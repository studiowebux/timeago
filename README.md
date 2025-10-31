# Époque

Simple CLI tool to help with epoch timestamps and allows some manipulations.

# Help

```text
TimeAgo - Convert epoch timestamps to human-readable format

USAGE:
  timeago [OPTIONS] [EPOCH_TIMESTAMP] [PRECISION]
  timeago --add <time> [EPOCH_TIMESTAMP] [PRECISION]
  timeago --remove <time> [EPOCH_TIMESTAMP] [PRECISION]

OPTIONS:
  -h, --help          Show this help message
  --add <time>        Add time to a timestamp (uses current time if no timestamp provided)
  --remove <time>     Remove time from a timestamp (uses current time if no timestamp provided)

ARGUMENTS:
  EPOCH_TIMESTAMP    Unix timestamp in milliseconds
  PRECISION          Number of time units to display (1-7, default: 1)

EXAMPLES:
  timeago
    Show current time in epoch, UTC, and local format

  timeago 1761878691116
    Convert epoch to time ago with default precision (1 unit)

  timeago 1761878691116 3
    Convert epoch to time ago with precision of 3 units
    Output: "5 minutes 30 seconds 123 milliseconds ago"

  timeago --add "2 hours"
    Add 2 hours to current timestamp

  timeago --add "2 hours" 1761878691116
    Add 2 hours to the specified timestamp

  timeago --remove "30 minutes" 1761878691116
    Remove 30 minutes from the specified timestamp

  timeago --add 7200000
    Add 7200000 milliseconds (2 hours) to current timestamp

  timeago --add "2 hours" 1761878691116 3
    Add 2 hours with precision=3 for detailed time display

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

# Installation:

```bash
deno compile --output timeago timeago.ts
chmod +x ./timeago
sudo mv ./timeago /usr/local/bin/
```

# Tests / Examples

```bash
deno test --allow-run
```
