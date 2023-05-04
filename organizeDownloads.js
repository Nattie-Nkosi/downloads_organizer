#!/usr/bin/env node
import os from "os";
import fs from "fs";
import path from "path";

const logFile = "organizeDownloads.log";

function log(message) {
  const timeStamp = new Date().toISOString();
  const logMessage = `${timeStamp}: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
}

const homeDir = os.homedir();

const downloadsFolder = path.join(homeDir, "Downloads");
const picturesFolder = path.join(homeDir, "Pictures");
const videosFolder = path.join(homeDir, "Videos");
const musicFolder = path.join(homeDir, "Music");
const documentsFolder = path.join(homeDir, "Documents");

const allowedImageExtensions = [".jpg", ".png", ".jpeg", ".svg"];
const allowedVideoExtensions = [".mp4", ".mkv"];
const allowedMusicExtensions = [".mp3", ".wav"];
const allowedDocumentsExtensions = [".txt", ".pdf", ".docx"];

const failedToMoveFiles = [];
const movedFiles = [];

if (fs.existsSync(downloadsFolder)) {
  const downloadsFolderFiles = fs.readdirSync(downloadsFolder);

  if (downloadsFolderFiles.length > 0) {
    downloadsFolderFiles.forEach((file) => {
      const downloadsFileFullName = path.join(downloadsFolder, file);

      if (fs.statSync(downloadsFileFullName).isFile()) {
        const extention = path.extname(file);

        let targetFolder;

        if (allowedImageExtensions.includes(extention)) {
          targetFolder = picturesFolder;
        } else if (allowedVideoExtensions.includes(extention)) {
          targetFolder = videosFolder;
        } else if (allowedMusicExtensions.includes(extention)) {
          targetFolder = musicFolder;
        } else if (allowedDocumentsExtensions.includes(extention)) {
          targetFolder = documentsFolder;
        } else {
          failedToMoveFiles.push(`${file} failed to move: Invalid Extension`);
          log(`${file} failed to move: Invalid Extension`);
          return;
        }

        const targetFileFullName = path.join(targetFolder, file);

        if (fs.existsSync(targetFileFullName)) {
          failedToMoveFiles.push(file);
          log(
            `Failed to move: ${file} (File already exists in the destination folder)`
          );
          return;
        }

        try {
          fs.renameSync(downloadsFileFullName, targetFileFullName);
          movedFiles.push(`${file} moved to ${targetFolder}`);
          log(`${file} moved to ${targetFolder}`);
        } catch {
          failedToMoveFiles.push(`${file} failed to move to ${targetFolder}`);
          log(`Error: ${file} failed to move to ${targetFolder}`);
        }
      }
    });

    log("\n************************");
    log("** MOVED FILES **");
    log("************************");

    movedFiles.forEach((movedFile) => log(movedFile));

    log(`\n${movedFiles.length} files moved!!`);

    log("\n************************");
    log("** FAILED TO MOVE FILES **");
    log("************************\n");

    log(`${failedToMoveFiles.length} files failed to be moved!!`);

    failedToMoveFiles.forEach((failedMoveFile) => console.log(failedMoveFile));
  } else {
    log("No files in Downloads folder");
  }
} else {
  log("Invalid Downloads Folder");
}
