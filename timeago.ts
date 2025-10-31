#!/usr/bin/env deno run

/**
 * Format a date as YYYY-MM-DD HH:MM:SS
 * @param date - Date object to format
 * @param utc - Whether to use UTC (true) or local time (false)
 * @returns Formatted date string
 */
function formatDateTime(date: Date, utc: boolean = false): string {
  const year = utc ? date.getUTCFullYear() : date.getFullYear();
  const month = String(utc ? date.getUTCMonth() + 1 : date.getMonth() + 1)
    .padStart(2, "0");
  const day = String(utc ? date.getUTCDate() : date.getDate()).padStart(2, "0");
  const hours = String(utc ? date.getUTCHours() : date.getHours()).padStart(
    2,
    "0",
  );
  const minutes = String(utc ? date.getUTCMinutes() : date.getMinutes())
    .padStart(2, "0");
  const seconds = String(utc ? date.getUTCSeconds() : date.getSeconds())
    .padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Parse a human-readable time string into milliseconds
 * Supports formats like: "2 hours", "30 minutes", "1 day 5 hours", etc.
 * @param timeString - Time string to parse
 * @returns Milliseconds equivalent
 */
function parseTimeString(timeString: string): number {
  const units: Record<string, number> = {
    "year": 365 * 24 * 60 * 60 * 1000,
    "years": 365 * 24 * 60 * 60 * 1000,
    "month": 30 * 24 * 60 * 60 * 1000,
    "months": 30 * 24 * 60 * 60 * 1000,
    "week": 7 * 24 * 60 * 60 * 1000,
    "weeks": 7 * 24 * 60 * 60 * 1000,
    "day": 24 * 60 * 60 * 1000,
    "days": 24 * 60 * 60 * 1000,
    "hour": 60 * 60 * 1000,
    "hours": 60 * 60 * 1000,
    "h": 60 * 60 * 1000,
    "minute": 60 * 1000,
    "minutes": 60 * 1000,
    "min": 60 * 1000,
    "m": 60 * 1000,
    "second": 1000,
    "seconds": 1000,
    "sec": 1000,
    "s": 1000,
    "millisecond": 1,
    "milliseconds": 1,
    "ms": 1,
  };

  // Remove "ago" if present
  const cleaned = timeString.toLowerCase().trim().replace(/\s+ago\s*$/, "");

  // If it's just a number, treat it as milliseconds
  const directNumber = parseInt(cleaned, 10);
  if (!isNaN(directNumber) && cleaned === directNumber.toString()) {
    return directNumber;
  }

  let totalMs = 0;

  // Match patterns like "2 hours", "30 minutes", etc.
  const regex = /(\d+\.?\d*)\s*([a-z]+)/g;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2];

    if (units[unit] !== undefined) {
      totalMs += value * units[unit];
    } else {
      throw new Error(`Unknown time unit: ${unit}`);
    }
  }

  if (totalMs === 0) {
    throw new Error(`Unable to parse time string: ${timeString}`);
  }

  return totalMs;
}

/**
 * Convert an epoch timestamp to a human-readable "time ago" format
 * @param epochMs - Epoch timestamp in milliseconds
 * @param precision - Number of time units to display (1-7, default: 1)
 * @returns A string like "2 hours ago" or "in 3 days 5 hours 30 minutes"
 */
function timeAgo(epochMs: number, precision: number = 1): string {
  const now = Date.now();
  const diffMs = now - epochMs;
  const isFuture = diffMs < 0;
  let remaining = Math.abs(diffMs);

  // Calculate each time unit and subtract from remaining
  const years = Math.floor(remaining / (365 * 24 * 60 * 60 * 1000));
  remaining -= years * (365 * 24 * 60 * 60 * 1000);

  const months = Math.floor(remaining / (30 * 24 * 60 * 60 * 1000));
  remaining -= months * (30 * 24 * 60 * 60 * 1000);

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  remaining -= days * (24 * 60 * 60 * 1000);

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  remaining -= hours * (60 * 60 * 1000);

  const minutes = Math.floor(remaining / (60 * 1000));
  remaining -= minutes * (60 * 1000);

  const seconds = Math.floor(remaining / 1000);
  remaining -= seconds * 1000;

  const milliseconds = remaining;

  // Build array of time components
  const components: Array<{ value: number; label: string }> = [
    { value: years, label: "year" },
    { value: months, label: "month" },
    { value: days, label: "day" },
    { value: hours, label: "hour" },
    { value: minutes, label: "minute" },
    { value: seconds, label: "second" },
    { value: milliseconds, label: "millisecond" },
  ];

  // Filter out zero values and take only the requested precision
  const parts = components
    .filter((c) => c.value > 0)
    .slice(0, Math.max(1, Math.min(7, precision)))
    .map((c) => `${c.value} ${c.value === 1 ? c.label : c.label + "s"}`);

  // If no parts, it means the time difference is 0
  if (parts.length === 0) {
    return "just now";
  }

  const timeString = parts.join(" ");

  return isFuture ? `in ${timeString}` : `${timeString} ago`;
}

// Main execution
if (import.meta.main) {
  // Check for help flag
  if (Deno.args.includes("--help") || Deno.args.includes("-h")) {
    console.log(
      "TimeAgo - Convert epoch timestamps to human-readable format\n",
    );
    console.log("USAGE:");
    console.log("  timeago [OPTIONS] [EPOCH_TIMESTAMP] [PRECISION]");
    console.log("  timeago --add <time> [EPOCH_TIMESTAMP] [PRECISION]");
    console.log("  timeago --remove <time> [EPOCH_TIMESTAMP] [PRECISION]\n");
    console.log("OPTIONS:");
    console.log("  -h, --help          Show this help message");
    console.log(
      "  --add <time>        Add time to a timestamp (uses current time if no timestamp provided)",
    );
    console.log(
      "  --remove <time>     Remove time from a timestamp (uses current time if no timestamp provided)\n",
    );
    console.log("ARGUMENTS:");
    console.log("  EPOCH_TIMESTAMP    Unix timestamp in milliseconds");
    console.log(
      "  PRECISION          Number of time units to display (1-7, default: 1)\n",
    );
    console.log("EXAMPLES:");
    console.log("  timeago");
    console.log("    Show current time in epoch, UTC, and local format\n");
    console.log("  timeago 1761878691116");
    console.log(
      "    Convert epoch to time ago with default precision (1 unit)\n",
    );
    console.log("  timeago 1761878691116 3");
    console.log("    Convert epoch to time ago with precision of 3 units");
    console.log('    Output: "5 minutes 30 seconds 123 milliseconds ago"\n');
    console.log('  timeago --add "2 hours"');
    console.log("    Add 2 hours to current timestamp\n");
    console.log('  timeago --add "2 hours" 1761878691116');
    console.log("    Add 2 hours to the specified timestamp\n");
    console.log('  timeago --remove "30 minutes" 1761878691116');
    console.log("    Remove 30 minutes from the specified timestamp\n");
    console.log("  timeago --add 7200000");
    console.log(
      "    Add 7200000 milliseconds (2 hours) to current timestamp\n",
    );
    console.log('  timeago --add "2 hours" 1761878691116 3');
    console.log("    Add 2 hours with precision=3 for detailed time display\n");
    console.log("TIME FORMATS:");
    console.log("  Supports human-readable formats like journalctl:");
    console.log('  - "2 hours", "30 minutes", "1 day", "3 weeks"');
    console.log('  - "1 day 5 hours", "2h 30m", "90s"');
    console.log("  - \"2 hours ago\" (the 'ago' is ignored)");
    console.log("  - Plain numbers are treated as milliseconds\n");
    console.log("TIME UNITS:");
    console.log("  1. Years");
    console.log("  2. Months");
    console.log("  3. Days");
    console.log("  4. Hours");
    console.log("  5. Minutes");
    console.log("  6. Seconds");
    console.log("  7. Milliseconds\n");
    console.log("NOTES:");
    console.log(
      "  - Precision controls how many non-zero time units are displayed",
    );
    console.log(
      '  - Future timestamps are detected and formatted as "in X time"',
    );
    console.log('  - Past timestamps are formatted as "X time ago"');
    Deno.exit(0);
  }

  // Check for --add or --remove flags
  const addIndex = Deno.args.indexOf("--add");
  const removeIndex = Deno.args.indexOf("--remove");

  if (addIndex !== -1 || removeIndex !== -1) {
    const isAdd = addIndex !== -1;
    const flagIndex = isAdd ? addIndex : removeIndex;
    const flagName = isAdd ? "--add" : "--remove";

    // Get the time value (next argument after the flag)
    if (flagIndex + 1 >= Deno.args.length) {
      console.error(`Error: ${flagName} requires a time value`);
      console.error('Examples: --add "2 hours", --add 7200000');
      Deno.exit(1);
    }

    const timeValue = Deno.args[flagIndex + 1];

    // Parse the time value
    let timeDelta: number;
    try {
      timeDelta = parseTimeString(timeValue);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error(`Error: ${errorMessage}`);
      Deno.exit(1);
    }

    // Get the base timestamp (either from args or current time)
    let baseTimestamp = Date.now();
    let precision = 1;

    // Check if there's a timestamp and precision in the remaining args
    const remainingArgs = Deno.args.filter((_, i) =>
      i !== flagIndex && i !== flagIndex + 1
    );
    if (remainingArgs.length > 0) {
      const possibleTimestamp = parseInt(remainingArgs[0], 10);
      if (!isNaN(possibleTimestamp)) {
        baseTimestamp = possibleTimestamp;
      }
    }
    if (remainingArgs.length > 1) {
      const possiblePrecision = parseInt(remainingArgs[1], 10);
      if (!isNaN(possiblePrecision) && possiblePrecision >= 1 && possiblePrecision <= 7) {
        precision = possiblePrecision;
      } else {
        console.error(`Error: Invalid precision "${remainingArgs[1]}" (must be 1-7)`);
        Deno.exit(1);
      }
    }

    // Calculate the new timestamp
    const newTimestamp = isAdd
      ? baseTimestamp + timeDelta
      : baseTimestamp - timeDelta;
    const date = new Date(newTimestamp);
    const timeAgoResult = timeAgo(newTimestamp, precision);
    const isFuture = newTimestamp > Date.now();

    console.log(`Base Timestamp: ${baseTimestamp}`);
    console.log(`Time ${isAdd ? "Added" : "Removed"}: ${timeDelta} ms`);
    console.log(`New Timestamp: ${newTimestamp}`);
    console.log(`UTC: ${formatDateTime(date, true)}`);
    console.log(`Local: ${formatDateTime(date, false)}`);
    console.log(`Precision: ${precision}`);
    console.log(`${isFuture ? "Time until" : "Time ago"}: ${timeAgoResult}`);
    Deno.exit(0);
  }

  if (Deno.args.length === 0) {
    // No arguments: print current time
    const now = Date.now();
    const date = new Date(now);

    console.log("Current Time:");
    console.log(`Epoch: ${now}`);
    console.log(`UTC: ${formatDateTime(date, true)}`);
    console.log(`Local: ${formatDateTime(date, false)}`);
    Deno.exit(0);
  }

  const epoch = parseInt(Deno.args[0], 10);

  if (isNaN(epoch)) {
    console.error(`Error: Invalid epoch timestamp "${Deno.args[0]}"`);
    console.error("\nRun 'timeago --help' for usage information");
    Deno.exit(1);
  }

  let precision = 1;
  if (Deno.args.length > 1) {
    precision = parseInt(Deno.args[1], 10);
    if (isNaN(precision) || precision < 1 || precision > 7) {
      console.error(`Error: Invalid precision "${Deno.args[1]}" (must be 1-7)`);
      Deno.exit(1);
    }
  }

  const result = timeAgo(epoch, precision);
  const date = new Date(epoch);
  const isFuture = epoch > Date.now();

  console.log(`Epoch: ${epoch}`);
  console.log(`UTC: ${formatDateTime(date, true)}`);
  console.log(`Local: ${formatDateTime(date, false)}`);
  console.log(`Precision: ${precision}`);
  console.log(`${isFuture ? "Time until" : "Time ago"}: ${result}`);
}

export { timeAgo };
