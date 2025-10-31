#!/usr/bin/env deno run

/**
 * Format a date as YYYY-MM-DD HH:MM:SS
 * @param date - Date object to format
 * @param utc - Whether to use UTC (true) or local time (false)
 * @returns Formatted date string
 */
function formatDateTime(date: Date, utc: boolean = false): string {
  const year = utc ? date.getUTCFullYear() : date.getFullYear();
  const month = String(utc ? date.getUTCMonth() + 1 : date.getMonth() + 1).padStart(2, "0");
  const day = String(utc ? date.getUTCDate() : date.getDate()).padStart(2, "0");
  const hours = String(utc ? date.getUTCHours() : date.getHours()).padStart(2, "0");
  const minutes = String(utc ? date.getUTCMinutes() : date.getMinutes()).padStart(2, "0");
  const seconds = String(utc ? date.getUTCSeconds() : date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
    console.log("TimeAgo - Convert epoch timestamps to human-readable format\n");
    console.log("USAGE:");
    console.log("  timeago [OPTIONS] [EPOCH_TIMESTAMP] [PRECISION]\n");
    console.log("OPTIONS:");
    console.log("  -h, --help    Show this help message\n");
    console.log("ARGUMENTS:");
    console.log("  EPOCH_TIMESTAMP    Unix timestamp in milliseconds");
    console.log("  PRECISION          Number of time units to display (1-7, default: 1)\n");
    console.log("EXAMPLES:");
    console.log("  timeago");
    console.log("    Show current time in epoch, UTC, and local format\n");
    console.log("  timeago 1761878691116");
    console.log("    Convert epoch to time ago with default precision (1 unit)\n");
    console.log("  timeago 1761878691116 3");
    console.log("    Convert epoch to time ago with precision of 3 units");
    console.log("    Output: \"5 minutes 30 seconds 123 milliseconds ago\"\n");
    console.log("  timeago 1761879691116 5");
    console.log("    Convert future epoch with precision of 5 units");
    console.log("    Output: \"in 10 minutes 15 seconds 456 milliseconds\"\n");
    console.log("TIME UNITS:");
    console.log("  1. Years");
    console.log("  2. Months");
    console.log("  3. Days");
    console.log("  4. Hours");
    console.log("  5. Minutes");
    console.log("  6. Seconds");
    console.log("  7. Milliseconds\n");
    console.log("NOTES:");
    console.log("  - Precision controls how many non-zero time units are displayed");
    console.log("  - Future timestamps are detected and formatted as \"in X time\"");
    console.log("  - Past timestamps are formatted as \"X time ago\"");
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
