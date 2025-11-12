# Époque

Simple CLI tool to help with epoch timestamps and allows some manipulations.

Available in two implementations:

- **Go** - Portable binary with pipe-friendly output

# Help

```text
Époque - Time manipulation utility

USAGE:
  timeago [OPTIONS] [ARGUMENTS]

MODES:
  No arguments:
    timeago
    Shows current time in epoch, UTC, and local formats

  Convert timestamp:
    timeago <EPOCH_TIMESTAMP> -p <PRECISION>
    Shows the timestamp in multiple formats with relative time

  Add time:
    timeago --add <TIME> [EPOCH_TIMESTAMP] [-p PRECISION]
    Adds time to current timestamp or specified timestamp
    TIME: human-readable time (e.g., "2 hours", "30 minutes", "1 day 5 hours")

  Remove time:
    timeago --remove <TIME> [EPOCH_TIMESTAMP] [-p PRECISION]
    Removes time from current timestamp or specified timestamp

OPTIONS:
  --help, -h     Show this help message
  --add          Add time to a timestamp
  --remove       Remove time from a timestamp
  -p             Set precision (1-7)

ARGUMENTS:
  EPOCH_TIMESTAMP    Unix timestamp in milliseconds
  PRECISION          Number of time units to display (1-7, default: 1)

FLEXIBLE ARGUMENT ORDER:
  Arguments can appear in any order. All of these are valid:
  - timeago 1761878691116 --add "2 hours" -p 3
  - timeago --add "2 hours" 1761878691116 -p 3
  - timeago --add "2 hours" -p 3 1761878691116

EXAMPLES:
  timeago
    Show current time in epoch, UTC, and local format

  timeago 1761878691116
    Convert epoch to time ago with default precision (1 unit)

  timeago 1761878691116 -p 3
    Convert epoch with precision of 3 units (using -p flag)

  timeago --add "2 hours"
    Add 2 hours to current timestamp

  timeago --add "2 hours" -p 3
    Add 2 hours to current time with precision 3

  timeago 1761878691116 --add "2 hours" -p 2
    Add 2 hours to specific timestamp (flexible order)

  timeago --add "2 hours" 1761878691116
    Add 2 hours to the specified timestamp

  timeago --remove "30 minutes" 1761878691116
    Remove 30 minutes from the specified timestamp

  timeago --add 7200000
    Add 7200000 milliseconds (2 hours) to current timestamp

TIME FORMATS:
  Supports human-readable formats like journalctl:
  - "2 hours", "30 minutes", "1 day", "3 weeks"
  - "1 day 5 hours", "2h 30m", "90s"
  - "2 hours ago" (the 'ago' is ignored)
  - Plain numbers are treated as milliseconds

TIME UNITS:
  1. Years
  2. Months
  3. Days
  4. Hours
  5. Minutes
  6. Seconds
  7. Milliseconds

NOTES:
  - Precision controls how many non-zero time units are displayed
  - Future timestamps are detected and formatted as "in X time"
  - Past timestamps are formatted as "X time ago"
```

# Installation

## Go Version

### Using go install

```bash
go install github.com/studiowebux/timeago@latest
```

### Building from source

```bash
go build -o timeago main.go
chmod +x ./timeago
sudo mv ./timeago /usr/local/bin/
```

### Dependencies

```bash
go get golang.org/x/term
```

## Piped Output Behavior

The Go version automatically detects when output is piped and adjusts its behavior:

- **Terminal (TTY)**: Displays full formatted output with labels
- **Piped**: Outputs only the result epoch timestamp (no labels)

This makes it easy to use in shell scripts and pipelines:

```bash
# Get current timestamp for use in other tools
timeago | xargs -I {} echo "Timestamp: {}"

# Add 2 hours and pipe to another command
timeago --add "2 hours" | cat

# Use in shell variable
FUTURE=$(timeago --add "1 day")
echo "Tomorrow's timestamp: $FUTURE"
```
