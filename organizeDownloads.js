#!/usr/bin/env node
import os from "os";
import fs from "fs/promises";
import path from "path";
import { Command } from "commander";
import winston from "winston";
import chokidar from "chokidar";

(async () => {
  // Set up the command-line interface
  const program = new Command();
  program
    .version("2.0.0")
    .description("Organize files in the Downloads folder")
    .option("-s, --source <directory>", "Source directory to organize")
    .option("-l, --log <file>", "Log file path", "organizeDownloads.log")
    .option("-c, --config <file>", "Configuration file path")
    .option("-d, --dry-run", "Preview changes without moving files")
    .option("-w, --watch", "Watch mode: continuously monitor and organize files")
    .option("-r, --recursive", "Process subdirectories recursively")
    .option("-u, --undo <file>", "Undo previous operation using history file")
    .parse(process.argv);

  const options = program.opts();

  // Set up the logger using Winston
  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} - ${level}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.File({
        filename: options.log,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.uncolorize(),
          winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} - ${level.toUpperCase()}: ${message}`;
          })
        )
      }),
      new winston.transports.Console(),
    ],
  });

  // Statistics tracking
  const stats = {
    moved: 0,
    skipped: 0,
    errors: 0,
    unsupported: 0,
  };

  // History tracking for undo functionality
  const historyFile = path.join(
    path.dirname(options.log),
    "organizeDownloads.history.json"
  );
  let moveHistory = [];

  // Load configuration from a file or use defaults
  let config = {
    extensions: {
      images: [".jpg", ".png", ".jpeg", ".svg"],
      videos: [".mp4", ".mkv"],
      music: [".mp3", ".wav"],
      documents: [".txt", ".pdf", ".docx", ".torrent", ".zip"],
    },
    folders: {
      images: path.join(os.homedir(), "Pictures"),
      videos: path.join(os.homedir(), "Videos"),
      music: path.join(os.homedir(), "Music"),
      documents: path.join(os.homedir(), "Documents"),
    },
  };

  if (options.config) {
    try {
      const configContent = await fs.readFile(options.config, "utf-8");
      config = JSON.parse(configContent);
      validateConfig(config);
      logger.info("Configuration loaded successfully.");
    } catch (err) {
      logger.error(`Failed to load configuration file: ${err.message}`);
      process.exit(1);
    }
  }

  /**
   * Validate the configuration object.
   * @param {object} cfg - The configuration object.
   */
  function validateConfig(cfg) {
    if (!cfg.extensions || typeof cfg.extensions !== "object") {
      throw new Error("Config must have 'extensions' object");
    }
    if (!cfg.folders || typeof cfg.folders !== "object") {
      throw new Error("Config must have 'folders' object");
    }

    const categories = Object.keys(cfg.extensions);
    for (const category of categories) {
      if (!cfg.folders[category]) {
        throw new Error(`Missing folder mapping for category: ${category}`);
      }
      if (!Array.isArray(cfg.extensions[category])) {
        throw new Error(`Extensions for '${category}' must be an array`);
      }
    }
  }

  // Determine the source directory
  const sourceDirectory =
    options.source || path.join(os.homedir(), "Downloads");

  /**
   * Ensure destination folders exist, create them if they don't.
   */
  async function ensureDestinationFolders() {
    for (const folder of Object.values(config.folders)) {
      try {
        await fs.access(folder);
      } catch {
        try {
          await fs.mkdir(folder, { recursive: true });
          logger.info(`Created destination folder: ${folder}`);
        } catch (err) {
          logger.error(`Failed to create folder ${folder}: ${err.message}`);
          throw err;
        }
      }
    }
  }

  /**
   * Process a single file.
   * @param {string} filePath - The full path to the file.
   * @param {string} file - The file name.
   */
  async function processFile(filePath, file) {
    try {
      const fileStat = await fs.stat(filePath);

      if (!fileStat.isFile()) {
        return; // Skip directories
      }

      const fileExtension = path.extname(file).toLowerCase();
      const destinationFolder = getDestinationFolder(fileExtension);

      if (!destinationFolder) {
        logger.warn(`Unsupported file extension: ${file}`);
        stats.unsupported++;
        return;
      }

      const destinationPath = path.join(destinationFolder, file);
      const finalDestinationPath = await resolveFileNameConflict(
        destinationPath
      );

      if (options.dryRun) {
        logger.info(`[DRY RUN] Would move: ${file} -> ${finalDestinationPath}`);
        stats.moved++;
      } else {
        try {
          await fs.rename(filePath, finalDestinationPath);
          logger.info(`Moved: ${file} -> ${path.basename(finalDestinationPath)}`);
          stats.moved++;

          // Record move in history
          moveHistory.push({
            timestamp: new Date().toISOString(),
            from: filePath,
            to: finalDestinationPath,
          });
        } catch (err) {
          logger.error(`Failed to move ${file}: ${err.message}`);
          stats.errors++;
        }
      }
    } catch (err) {
      logger.error(`Error processing ${file}: ${err.message}`);
      stats.errors++;
    }
  }

  /**
   * Organize files in the specified directory.
   * @param {string} directory - The directory to organize.
   */
  async function organizeFiles(directory = sourceDirectory) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      if (entries.length === 0) {
        logger.info("No files found to organize.");
        return;
      }

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isFile()) {
          await processFile(fullPath, entry.name);
        } else if (entry.isDirectory() && options.recursive) {
          logger.info(`Processing subdirectory: ${entry.name}`);
          await organizeFiles(fullPath);
        }
      }
    } catch (err) {
      logger.error(`Error accessing directory ${directory}: ${err.message}`);
      stats.errors++;
    }
  }

  /**
   * Get the destination folder based on file extension.
   * @param {string} extension - The file extension.
   * @returns {string|null} - The destination folder path or null if unsupported.
   */
  function getDestinationFolder(extension) {
    for (const [folderKey, extensions] of Object.entries(config.extensions)) {
      if (extensions.includes(extension)) {
        return config.folders[folderKey];
      }
    }
    return null;
  }

  /**
   * Resolve file name conflicts by appending a counter to the file name.
   * @param {string} filePath - The intended file path.
   * @returns {string} - A unique file path with no conflicts.
   */
  async function resolveFileNameConflict(filePath) {
    let counter = 1;
    let uniquePath = filePath;
    const { dir, name, ext } = path.parse(filePath);

    while (true) {
      try {
        await fs.access(uniquePath);
        uniquePath = path.join(dir, `${name}(${counter})${ext}`);
        counter++;
      } catch {
        // File does not exist
        break;
      }
    }
    return uniquePath;
  }

  /**
   * Save move history to file.
   */
  async function saveHistory() {
    if (moveHistory.length > 0 && !options.dryRun) {
      try {
        await fs.writeFile(historyFile, JSON.stringify(moveHistory, null, 2));
        logger.info(`History saved to ${historyFile}`);
      } catch (err) {
        logger.error(`Failed to save history: ${err.message}`);
      }
    }
  }

  /**
   * Undo previous file moves using history file.
   * @param {string} historyPath - Path to the history file.
   */
  async function undoMoves(historyPath) {
    try {
      const historyContent = await fs.readFile(historyPath, "utf-8");
      const history = JSON.parse(historyContent);

      logger.info(`Found ${history.length} moves to undo`);

      for (const move of history.reverse()) {
        try {
          await fs.rename(move.to, move.from);
          logger.info(`Restored: ${move.to} -> ${move.from}`);
          stats.moved++;
        } catch (err) {
          logger.error(`Failed to restore ${move.to}: ${err.message}`);
          stats.errors++;
        }
      }

      // Remove history file after successful undo
      await fs.unlink(historyPath);
      logger.info("Undo completed. History file removed.");
    } catch (err) {
      logger.error(`Failed to undo moves: ${err.message}`);
      process.exit(1);
    }
  }

  /**
   * Print statistics summary.
   */
  function printStats() {
    console.log("\n" + "=".repeat(50));
    console.log("SUMMARY");
    console.log("=".repeat(50));
    console.log(`Files moved:       ${stats.moved}`);
    console.log(`Files skipped:     ${stats.skipped}`);
    console.log(`Unsupported:       ${stats.unsupported}`);
    console.log(`Errors:            ${stats.errors}`);
    console.log("=".repeat(50) + "\n");
  }

  /**
   * Watch mode: continuously monitor and organize files.
   */
  async function watchMode() {
    logger.info(`Starting watch mode on: ${sourceDirectory}`);
    logger.info("Press Ctrl+C to stop watching...\n");

    const watcher = chokidar.watch(sourceDirectory, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: false,
      depth: options.recursive ? undefined : 0,
    });

    watcher
      .on("add", async (filePath) => {
        const fileName = path.basename(filePath);
        logger.info(`New file detected: ${fileName}`);
        await processFile(filePath, fileName);
      })
      .on("error", (error) => {
        logger.error(`Watcher error: ${error.message}`);
      });

    // Keep process alive
    process.on("SIGINT", async () => {
      logger.info("\nStopping watch mode...");
      await watcher.close();
      printStats();
      await saveHistory();
      process.exit(0);
    });
  }

  // Main execution
  try {
    // Handle undo mode
    if (options.undo) {
      logger.info("Undo mode activated");
      await undoMoves(options.undo);
      printStats();
      process.exit(0);
    }

    // Validate source directory
    try {
      await fs.access(sourceDirectory);
    } catch {
      logger.error(`Source directory does not exist: ${sourceDirectory}`);
      process.exit(1);
    }

    // Show mode information
    if (options.dryRun) {
      logger.info("DRY RUN MODE - No files will be moved");
    }
    if (options.recursive) {
      logger.info("RECURSIVE MODE - Processing subdirectories");
    }

    logger.info(`Source directory: ${sourceDirectory}`);

    // Ensure destination folders exist
    await ensureDestinationFolders();

    // Run in watch mode or one-time mode
    if (options.watch) {
      await watchMode();
    } else {
      await organizeFiles();
      printStats();
      await saveHistory();
    }
  } catch (err) {
    logger.error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
})();
