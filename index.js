import os from "os";
import fs from "fs";
import path from "path";

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
          return;
        }

        const targetFileFullName = path.join(targetFolder, file);

        if (fs.existsSync(targetFileFullName)) {
          failedToMoveFiles.push(file);
          return;
        }

        try {
          fs.renameSync(downloadsFileFullName, targetFileFullName);
          movedFiles.push(`${file} moved to ${targetFolder}`);
        } catch {
          failedToMoveFiles.push(`${file} failed to move to ${targetFolder}`);
        }
      }
    });

    console.log("************************");
    console.log("** MOVED FILES **");
    console.log("************************");

    movedFiles.forEach((movedFile) => console.log(movedFile));

    console.log(`\n${movedFiles.length} files moved!!`);

    console.log("\n************************");
    console.log("** FAILED TO MOVE FILES **");
    console.log("************************\n");

    console.log(`${failedToMoveFiles.length} files failed to be moved!!`);

    failedToMoveFiles.forEach((failedMoveFile) => console.log(failedMoveFile));
  } else {
    console.log("No files in Downloads folder");
  }
} else {
  console.log("Invalid Downloads Folder");
}
