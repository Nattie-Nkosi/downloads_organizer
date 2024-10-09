#!/usr/bin/env node
import os from "os";
import fs from "fs/promises";
import path from "path";
import { Command } from "commander";
import winston from "winston";

(async () => {
  // Set up the command-line interface
  const program = new Command();
  program
    .version("1.0.0")
    .description("Organize files in the Downloads folder")
    .option("-s, --source <directory>", "Source directory to organize")
    .option("-l, --log <file>", "Log file path", "organizeDownloads.log")
    .option("-c, --config <file>", "Configuration file path")
    .parse(process.argv);

  const options = program.opts();

  // Set up the logger using Winston
  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} - ${level.toUpperCase()}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.File({ filename: options.log }),
      new winston.transports.Console(),
    ],
  });

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
      logger.info("Configuration loaded successfully.");
    } catch (err) {
      logger.error(`Failed to load configuration file: ${err.message}`);
      process.exit(1);
    }
  }

  // Determine the source directory
  const sourceDirectory =
    options.source || path.join(os.homedir(), "Downloads");

  /**
   * Organize files in the specified directory.
   */
  async function organizeFiles() {
    try {
      const files = await fs.readdir(sourceDirectory);
      if (files.length === 0) {
        logger.info("No files found to organize.");
        return;
      }

      for (const file of files) {
        const filePath = path.join(sourceDirectory, file);
        const fileStat = await fs.stat(filePath);

        if (!fileStat.isFile()) {
          continue; // Skip directories
        }

        const fileExtension = path.extname(file).toLowerCase();
        const destinationFolder = getDestinationFolder(fileExtension);

        if (!destinationFolder) {
          logger.warn(`Unsupported file extension for file: ${file}`);
          continue;
        }

        const destinationPath = path.join(destinationFolder, file);
        const finalDestinationPath = await resolveFileNameConflict(
          destinationPath
        );

        try {
          await fs.rename(filePath, finalDestinationPath);
          logger.info(`Moved file: ${file} to ${destinationFolder}`);
        } catch (err) {
          logger.error(`Failed to move file: ${file}. Error: ${err.message}`);
        }
      }
    } catch (err) {
      logger.error(`Error accessing source directory: ${err.message}`);
      process.exit(1);
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

  // Start organizing files
  await organizeFiles();
})();
