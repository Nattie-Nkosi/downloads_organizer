# Downloads Folder Organizer

This script organizes files in your Downloads folder by moving them to appropriate folders based on their file extensions. It supports moving images, videos, music, and documents to their respective folders.

## Features

1. Moves files from the Downloads folder to their respective folders (Pictures, Videos, Music, Documents) based on file extensions.
2. Logs actions to a file named `organizeDownloads.log`.
3. Can be scheduled to run periodically to keep the Downloads folder organized automatically.

## Requirements

- Node.js

## Usage

1. Clone the repository or download the `organizeDownloads.js` script.
2. Open a terminal/command prompt and navigate to the folder containing the script.
3. Run the script using the following command:

```bash
  node organizeDownloads.js
```

4. Check the organizeDownloads.log file for the log of actions taken by the script.

## Scheduling Automatic Organization

You can set up the script to run periodically using the built-in scheduler on your operating system.

### Unix-based systems (Linux and macOS)

1. Open a terminal.
2. Type crontab -e and press Enter to open the cron table for editing.
3. Add a new line with the following format:

```bash
  * * * * * /usr/bin/env node /path/to/organizeDownloads.js
```

Replace /path/to/organizeDownloads.js with the absolute path to your script. Adjust the asterisks to set the desired schedule.

4. Save and exit the editor.

### Windows

1. Open Task Scheduler.
2. Create a new task to run the script periodically, specifying the path to the Node.js executable and the path to the organizeDownloads.js script.
