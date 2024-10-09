# Downloads Organizer

A Node.js script to automatically organize files in your Downloads folder by moving them into designated folders based on file extensions.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Examples](#examples)
- [Logging](#logging)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Features

- Automatic File Organization: Moves files from your Downloads folder to appropriate directories based on file type.
- Customizable Configuration: Define your own file extensions and destination folders using a JSON configuration file.
- Command-Line Interface: Use command-line options to specify source directory, log file path, and configuration file.
- Robust Logging: Provides detailed logs of operations using the Winston logging library.
- File Name Conflict Resolution: Automatically handles file name conflicts by appending a counter to duplicate file names.
- Cross-Platform Compatibility: Works on Windows, macOS, and Linux systems.
- Asynchronous Operations: Uses asynchronous file operations for improved performance.

## Prerequisites

- Node.js: Version 14.0.0 or higher.
- npm: Node.js package manager.

## Installation

1. Clone the Repository:

   ```bash
   git clone https://github.com/Nattie-Nkosi/downloads_organizer
   ```

2. Navigate to the Project Directory:

   ```bash
   cd downloads-organizer
   ```

3. Install Dependencies:
   ```bash
   npm install
   ```

## Configuration

The script can use a configuration file (`config.json`) to customize file extensions and destination folders.

### Default Configuration

If no configuration file is provided, the script uses the following default settings:

```json
{
  "extensions": {
    "images": [".jpg", ".png", ".jpeg", ".svg"],
    "videos": [".mp4", ".mkv"],
    "music": [".mp3", ".wav"],
    "documents": [".txt", ".pdf", ".docx", ".torrent", ".zip"]
  },
  "folders": {
    "images": "/Users/yourusername/Pictures",
    "videos": "/Users/yourusername/Videos",
    "music": "/Users/yourusername/Music",
    "documents": "/Users/yourusername/Documents"
  }
}
```

### Custom Configuration

Create a `config.json` file in the project directory or specify its path using the `--config` option.

Example `config.json`:

```json
{
  "extensions": {
    "images": [".jpg", ".jpeg", ".png", ".gif", ".svg"],
    "videos": [".mp4", ".avi", ".mkv"],
    "music": [".mp3", ".wav", ".aac"],
    "documents": [".pdf", ".docx", ".txt", ".xlsx", ".pptx"]
  },
  "folders": {
    "images": "/Users/yourusername/Pictures",
    "videos": "/Users/yourusername/Videos",
    "music": "/Users/yourusername/Music",
    "documents": "/Users/yourusername/Documents"
  }
}
```

Note: Replace `/Users/yourusername` with the path to your home directory.

## Usage

The script is executed via the command line.

### Basic Command

```bash
node organizeDownloads.js
```

### Options

- `-s, --source <directory>`: Specify the source directory to organize. Defaults to the Downloads folder in your home directory.
- `-l, --log <file>`: Specify the log file path. Defaults to `organizeDownloads.log`.
- `-c, --config <file>`: Specify the path to a custom configuration file.

## Examples

### Using Default Settings

Organize files in the default Downloads folder using the default configuration:

```bash
node organizeDownloads.js
```

### Specify a Source Directory

Organize files in a custom directory:

```bash
node organizeDownloads.js --source /path/to/your/directory
```

### Use a Custom Configuration File

```bash
node organizeDownloads.js --config config.json
```

### Specify a Log File Path

```bash
node organizeDownloads.js --log /path/to/your/logfile.log
```

### Combining Options

```bash
node organizeDownloads.js --source /path/to/your/directory --config config.json --log /path/to/your/logfile.log
```

## Logging

The script uses the Winston logging library to log operations.

### Log Levels:

- INFO: Successful operations and general information.
- WARN: Unsupported file extensions.
- ERROR: Errors encountered during execution.

### Log Outputs:

- File: Logs are saved to the file specified by the `--log` option or `organizeDownloads.log` by default.
- Console: Logs are also output to the console.

## Error Handling

- Configuration File Errors: If the configuration file cannot be loaded or parsed, the script logs an error and exits.
- File Operations: Errors during file operations (e.g., insufficient permissions, missing directories) are logged, and the script continues processing other files.
- Source Directory Errors: If the source directory cannot be accessed, the script logs an error and exits.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the Repository: Click the "Fork" button at the top right of the repository page.

2. Clone Your Fork:

   ```bash
   git clone https://github.com/yourusername/downloads-organizer.git
   ```

3. Create a New Branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Make Your Changes: Implement your feature or bug fix.

5. Commit Your Changes:

   ```bash
   git commit -am "Add new feature"
   ```

6. Push to Your Fork:

   ```bash
   git push origin feature/your-feature-name
   ```

7. Submit a Pull Request: Go to the original repository and click "New Pull Request".

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Troubleshooting

### Common Issues

- "Permission Denied" Errors: Ensure you have read and write permissions for both the source and destination directories.
- "No Files Found to Organize" Message: The source directory is empty or contains no files matching the specified extensions.
- "Unsupported File Extension" Warnings: Files with extensions not listed in the configuration will be skipped.

### Check Node.js Version

Ensure that you are using Node.js version 14.0.0 or higher:

```bash
node -v
```

## Frequently Asked Questions

Q: Can I add more file types to organize?
A: Yes! You can add more file extensions and corresponding destination folders in the `config.json` file.

Q: Does the script handle subdirectories within the source directory?
A: Currently, the script only processes files in the top level of the source directory. Subdirectories are skipped.

Q: What happens if a file with the same name already exists in the destination folder?
A: The script will append a counter to the file name to prevent overwriting existing files.

Example:

- Original file: `document.pdf`
- Existing file in destination: `document.pdf`
- Renamed file: `document(1).pdf`

## Acknowledgements

- Node.js
- Commander.js for command-line interface.
- Winston for logging.

## Contact

For questions or suggestions, please open an issue on the repository or contact me at nkosin361@gmail.com
