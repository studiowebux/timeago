#!/usr/bin/env deno test

import { assertEquals, assertMatch } from "jsr:@std/assert";

/**
 * Helper function to run the timeago CLI and capture output
 */
async function runTimeago(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  const command = new Deno.Command("deno", {
    args: ["run", "timeago.ts", ...args],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout, stderr, code } = await command.output();

  return {
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
    code,
  };
}

/**
 * BASIC FUNCTIONALITY TESTS
 */

Deno.test("No arguments - shows current time", async () => {
  const result = await runTimeago([]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Current Time:/);
  assertMatch(result.stdout, /Epoch: \d+/);
  assertMatch(result.stdout, /UTC: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
  assertMatch(result.stdout, /Local: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
});

Deno.test("Show help with --help", async () => {
  const result = await runTimeago(["--help"]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /TimeAgo - Convert epoch timestamps/);
  assertMatch(result.stdout, /--add <time>/);
  assertMatch(result.stdout, /--remove <time>/);
});

Deno.test("Show help with -h", async () => {
  const result = await runTimeago(["-h"]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /TimeAgo - Convert epoch timestamps/);
});

/**
 * TIME AGO CONVERSION TESTS
 */

Deno.test("Convert past epoch to time ago (default precision)", async () => {
  // 2 hours ago from now
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  const result = await runTimeago([twoHoursAgo.toString()]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Epoch: \d+/);
  assertMatch(result.stdout, /Time ago: 2 hours ago/);
});

Deno.test("Convert past epoch with precision=3", async () => {
  // 2 hours, 30 minutes, 45 seconds ago
  const pastTime = Date.now() - (2 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000);
  const result = await runTimeago([pastTime.toString(), "3"]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Precision: 3/);
  assertMatch(result.stdout, /Time ago: 2 hours 30 minutes 45 seconds ago/);
});

Deno.test("Convert future epoch to time until", async () => {
  // 3 hours from now
  const threeHoursLater = Date.now() + (3 * 60 * 60 * 1000);
  const result = await runTimeago([threeHoursLater.toString()]);

  assertEquals(result.code, 0);
  // Allow for 2-3 hours due to test execution time
  assertMatch(result.stdout, /Time until: in [2-3] hours/);
});

Deno.test("Invalid epoch timestamp", async () => {
  const result = await runTimeago(["invalid"]);

  assertEquals(result.code, 1);
  assertMatch(result.stderr, /Error: Invalid epoch timestamp/);
});

Deno.test("Invalid precision", async () => {
  const now = Date.now().toString();
  const result = await runTimeago([now, "invalid"]);

  assertEquals(result.code, 1);
  assertMatch(result.stderr, /Error: Invalid precision/);
});

/**
 * --ADD OPTION TESTS
 */

Deno.test("--add with current time (no timestamp provided)", async () => {
  const before = Date.now();
  const result = await runTimeago(["--add", "2 hours"]);
  const after = Date.now();

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Base Timestamp: \d+/);
  assertMatch(result.stdout, /Time Added: 7200000 ms/);
  assertMatch(result.stdout, /New Timestamp: \d+/);
  assertMatch(result.stdout, /Time until: in \d+ hours?/);

  // Extract the new timestamp
  const match = result.stdout.match(/New Timestamp: (\d+)/);
  if (match) {
    const newTimestamp = parseInt(match[1]);
    // Should be roughly current time + 2 hours (with some tolerance)
    const expectedMin = before + (2 * 60 * 60 * 1000) - 1000;
    const expectedMax = after + (2 * 60 * 60 * 1000) + 1000;
    assertEquals(newTimestamp >= expectedMin && newTimestamp <= expectedMax, true);
  }
});

Deno.test("--add with specific timestamp", async () => {
  const baseTimestamp = 1700000000000; // Nov 14, 2023
  const result = await runTimeago(["--add", "2 hours", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Base Timestamp: 1700000000000/);
  assertMatch(result.stdout, /Time Added: 7200000 ms/);
  assertMatch(result.stdout, /New Timestamp: 1700007200000/);
  assertMatch(result.stdout, /Time ago:/);
});

Deno.test("--add with milliseconds", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "7200000", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Time Added: 7200000 ms/);
  assertMatch(result.stdout, /New Timestamp: 1700007200000/);
});

Deno.test("--add with compound time format", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "1 day 5 hours 30 minutes", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  // 1 day = 86400000ms, 5 hours = 18000000ms, 30 min = 1800000ms
  // Total = 106200000ms
  assertMatch(result.stdout, /Time Added: 106200000 ms/);
  assertMatch(result.stdout, /New Timestamp: 1700106200000/);
});

Deno.test("--add with abbreviated format", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "2h 30m", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  // 2 hours = 7200000ms, 30 min = 1800000ms = 9000000ms total
  assertMatch(result.stdout, /Time Added: 9000000 ms/);
  assertMatch(result.stdout, /New Timestamp: 1700009000000/);
});

Deno.test("--add with 'ago' suffix (should be ignored)", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "2 hours ago", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Time Added: 7200000 ms/);
  assertMatch(result.stdout, /New Timestamp: 1700007200000/);
});

Deno.test("--add without time value (error)", async () => {
  const result = await runTimeago(["--add"]);

  assertEquals(result.code, 1);
  assertMatch(result.stderr, /Error: --add requires a time value/);
});

Deno.test("--add with invalid time format (error)", async () => {
  const result = await runTimeago(["--add", "invalid"]);

  assertEquals(result.code, 1);
  assertMatch(result.stderr, /Error: Unable to parse time string/);
});

Deno.test("--add with precision", async () => {
  // Use current time minus 5 hours to get a reasonable recent timestamp
  const baseTimestamp = Date.now() - (5 * 60 * 60 * 1000);
  const result = await runTimeago(["--add", "2 hours 30 minutes 45 seconds", baseTimestamp.toString(), "3"]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Precision: 3/);
  // Should show time in hours/minutes/seconds format
  assertMatch(result.stdout, /Time ago:/);
});

Deno.test("--add with invalid precision (error)", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "2 hours", baseTimestamp.toString(), "invalid"]);

  assertEquals(result.code, 1);
  assertMatch(result.stderr, /Error: Invalid precision/);
});

/**
 * --REMOVE OPTION TESTS
 */

Deno.test("--remove with current time (no timestamp provided)", async () => {
  const before = Date.now();
  const result = await runTimeago(["--remove", "30 minutes"]);
  const after = Date.now();

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Base Timestamp: \d+/);
  assertMatch(result.stdout, /Time Removed: 1800000 ms/);
  assertMatch(result.stdout, /New Timestamp: \d+/);

  // Extract the new timestamp
  const match = result.stdout.match(/New Timestamp: (\d+)/);
  if (match) {
    const newTimestamp = parseInt(match[1]);
    // Should be roughly current time - 30 minutes (with some tolerance)
    const expectedMin = before - (30 * 60 * 1000) - 1000;
    const expectedMax = after - (30 * 60 * 1000) + 1000;
    assertEquals(newTimestamp >= expectedMin && newTimestamp <= expectedMax, true);
  }
});

Deno.test("--remove with specific timestamp", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--remove", "1 hour", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Base Timestamp: 1700000000000/);
  assertMatch(result.stdout, /Time Removed: 3600000 ms/);
  assertMatch(result.stdout, /New Timestamp: 1699996400000/);
});

Deno.test("--remove with multiple time units", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--remove", "2 days 3 hours", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  // 2 days = 172800000ms, 3 hours = 10800000ms = 183600000ms total
  assertMatch(result.stdout, /Time Removed: 183600000 ms/);
  assertMatch(result.stdout, /New Timestamp: 1699816400000/);
});

Deno.test("--remove without time value (error)", async () => {
  const result = await runTimeago(["--remove"]);

  assertEquals(result.code, 1);
  assertMatch(result.stderr, /Error: --remove requires a time value/);
});

Deno.test("--remove with precision", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--remove", "1 hour 15 minutes 30 seconds", baseTimestamp.toString(), "4"]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Precision: 4/);
  assertMatch(result.stdout, /Time ago:/);
});

/**
 * TIME FORMAT PARSING TESTS
 */

Deno.test("--add with seconds", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "90 seconds", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Time Added: 90000 ms/);
});

Deno.test("--add with minutes (abbreviated)", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "45min", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Time Added: 2700000 ms/);
});

Deno.test("--add with days", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "3 days", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Time Added: 259200000 ms/);
});

Deno.test("--add with weeks", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "2 weeks", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  // 2 weeks = 14 days = 1209600000ms
  assertMatch(result.stdout, /Time Added: 1209600000 ms/);
});

Deno.test("--add with months", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "1 month", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  // 1 month = 30 days = 2592000000ms
  assertMatch(result.stdout, /Time Added: 2592000000 ms/);
});

Deno.test("--add with years", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "1 year", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  // 1 year = 365 days = 31536000000ms
  assertMatch(result.stdout, /Time Added: 31536000000 ms/);
});

Deno.test("--add with milliseconds", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "500 milliseconds", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Time Added: 500 ms/);
});

Deno.test("--add with abbreviated ms", async () => {
  const baseTimestamp = 1700000000000;
  const result = await runTimeago(["--add", "1500ms", baseTimestamp.toString()]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Time Added: 1500 ms/);
});

/**
 * COMPLEX REAL-WORLD EXAMPLES
 */

Deno.test("Example: Calculate timestamp for 'deadline in 3 days'", async () => {
  const result = await runTimeago(["--add", "3 days"]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Time Added: 259200000 ms/);
  assertMatch(result.stdout, /New Timestamp: \d+/);
  console.log("\nExample: Calculate deadline in 3 days");
  console.log(result.stdout);
});

Deno.test("Example: Calculate when something happened '5 hours ago'", async () => {
  const result = await runTimeago(["--remove", "5 hours"]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Time Removed: 18000000 ms/);
  console.log("\nExample: Calculate timestamp from 5 hours ago");
  console.log(result.stdout);
});

Deno.test("Example: Add time to specific event timestamp", async () => {
  const eventTimestamp = 1700000000000; // A specific event
  const result = await runTimeago(["--add", "2 hours 30 minutes", eventTimestamp.toString()]);

  assertEquals(result.code, 0);
  console.log("\nExample: Add 2.5 hours to event timestamp");
  console.log(result.stdout);
});

Deno.test("Example: Check how long ago a timestamp was", async () => {
  const pastTimestamp = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
  const result = await runTimeago([Math.floor(pastTimestamp).toString()]);

  assertEquals(result.code, 0);
  console.log("\nExample: Check how long ago (7 days)");
  console.log(result.stdout);
});

Deno.test("Example: Check detailed time with precision=5", async () => {
  const pastTimestamp = Date.now() - (2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000);
  const result = await runTimeago([Math.floor(pastTimestamp).toString(), "5"]);

  assertEquals(result.code, 0);
  assertMatch(result.stdout, /Precision: 5/);
  console.log("\nExample: Detailed time with 5 units of precision");
  console.log(result.stdout);
});
