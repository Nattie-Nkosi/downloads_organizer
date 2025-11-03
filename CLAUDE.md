# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Downloads Organizer v2.0 is a Node.js CLI application that automatically organizes files from a source directory (typically Downloads) into categorized destination folders based on file extensions. The script uses ES6 modules, Winston for logging, Commander.js for CLI argument parsing, and Chokidar for file system watching.

## Key Commands

### Installation
```bash
npm install  # Install dependencies (commander, winston, chokidar)
```

### Running the Script

**Basic usage:**
```bash
node organizeDownloads.js                    # Use defaults (~/Downloads -> ~/Pictures, ~/Videos, etc.)
node organizeDownloads.js -s /path/to/source # Specify source directory
node organizeDownloads.js -c config.json     # Use custom config
node organizeDownloads.js -l custom.log      # Specify log file
```

**New v2.0 features:**
```bash
node organizeDownloads.js -d                 # Dry-run mode (preview without moving)
node organizeDownloads.js -w                 # Watch mode (continuous monitoring)
node organizeDownloads.js -r                 # Recursive mode (process subdirectories)
node organizeDownloads.js -u history.json    # Undo previous operation
node organizeDownloads.js -w -r              # Watch + recursive
node organizeDownloads.js -d -r              # Dry-run + recursive
```

**Common workflows:**
```bash
# Preview what would happen before actually organizing
node organizeDownloads.js -d

# Organize and keep watching for new files
node organizeDownloads.js -w

# Organize including subdirectories
node organizeDownloads.js -r

# Undo the last organization
node organizeDownloads.js -u organizeDownloads.history.json
```

### Making Script Executable
The script includes a shebang (`#!/usr/bin/env node`) and can be run directly on Unix-like systems:
```bash
chmod +x organizeDownloads.js
./organizeDownloads.js -w
```

## Architecture

### Main Script: organizeDownloads.js

The entire application is contained in a single IIFE that executes asynchronously. The architecture has been significantly enhanced in v2.0:

1. **CLI Setup (lines 10-22)**: Commander.js parses command-line options including:
   - Basic: source directory, log file, config file
   - New: dry-run, watch, recursive, undo modes

2. **Logger Initialization (lines 26-49)**: Winston logger with:
   - Colorized console output for better readability
   - Uncolorized file logging
   - Separate transports with different formatting

3. **Statistics & History Tracking (lines 51-64)**:
   - `stats` object tracks moved, skipped, unsupported, and error counts
   - `moveHistory` array records all file moves for undo capability
   - History saved to `organizeDownloads.history.json`

4. **Configuration System (lines 66-115)**:
   - Loads from config.json or uses defaults
   - `validateConfig()`: Validates structure and ensures extension/folder mapping consistency
   - Auto-creates missing destination folders via `ensureDestinationFolders()`

5. **File Processing Functions**:
   - `processFile(filePath, file)` (lines 140-191): Core file processing logic
     - Handles dry-run mode (preview only)
     - Records moves in history
     - Updates statistics
   - `organizeFiles(directory)` (lines 193-220): Main orchestrator
     - Supports recursive directory traversal
     - Calls `processFile()` for each file
   - `getDestinationFolder(extension)` (lines 222-234): Maps extensions to folders
   - `resolveFileNameConflict(filePath)` (lines 236-257): Prevents overwrites

6. **New v2.0 Features**:
   - `saveHistory()` (lines 259-271): Persists move history to JSON file
   - `undoMoves(historyPath)` (lines 273-302): Reverses all moves from history file
   - `printStats()` (lines 304-316): Displays formatted summary
   - `watchMode()` (lines 318-350): Continuous monitoring using Chokidar
     - Watches for new files in real-time
     - Respects recursive option
     - Handles Ctrl+C gracefully

7. **Main Execution Flow (lines 352-395)**:
   - Validates source directory exists
   - Routes to undo mode if requested
   - Shows mode information (dry-run, recursive)
   - Ensures destination folders exist
   - Routes to watch mode or one-time execution
   - Prints statistics and saves history

### Configuration System: config.json

JSON structure with two top-level keys:
- `extensions`: Maps category names to arrays of file extensions
- `folders`: Maps category names to absolute destination paths

Categories (images, videos, music, documents) must match between both objects. Adding new file types requires updating both sections.

## Important Implementation Details

- **ES6 Modules**: package.json has `"type": "module"`, so use `import` not `require()`
- **Async File Operations**: All fs operations use `fs/promises` API
- **File Conflict Resolution**: Uses `fs.access()` in a try-catch within a while loop to detect existing files and increment counter
- **Platform Compatibility**: Uses `os.homedir()` and `path.join()` for cross-platform paths
- **Logging Levels**:
  - INFO: Successful moves, mode information
  - WARN: Unsupported file extensions
  - ERROR: Operation failures, validation errors
- **Directory Processing**:
  - Default: Single-level (root only)
  - With `-r`: Recursive processing of subdirectories
- **Auto-Creation**: Destination folders are automatically created if they don't exist
- **Dry-Run Safety**: With `-d` flag, no files are moved and no history is saved
- **Watch Mode**: Uses Chokidar's `add` event to detect new files, ignores dotfiles
- **Undo Mechanism**:
  - History stored in JSON format with timestamps, from/to paths
  - Undo reverses moves in reverse order
  - History file deleted after successful undo
- **Statistics**: Tracks moved, skipped, unsupported, and error counts; displayed at end

## Configuration System: config.json

JSON structure with two top-level keys:
- `extensions`: Maps category names to arrays of file extensions
- `folders`: Maps category names to absolute destination paths

Categories (images, videos, music, documents) must match between both objects. Adding new file types requires updating both sections. Configuration is validated on load to ensure consistency.

## Dependencies

- **chokidar** (^4.0.3): File system watching for watch mode
- **commander** (^12.1.0): CLI argument parsing
- **winston** (^3.15.0): Structured logging with colorization

## Project Requirements

- Node.js version 14.0.0 or higher
- Write permissions to both source and destination directories
- For watch mode: sufficient system resources for continuous file monitoring

## Common Use Cases

1. **Preview before organizing**: Use `-d` to see what would happen
2. **Continuous organization**: Use `-w` to keep Downloads folder clean automatically
3. **Deep cleaning**: Use `-r` to organize nested subdirectories
4. **Mistake recovery**: Use `-u` with the history file to reverse all changes
5. **Testing configurations**: Combine `-d` and `-c` to test new config files safely
