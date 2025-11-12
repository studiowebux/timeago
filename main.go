package main

import (
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"golang.org/x/term"
)

// formatDateTime formats a time as "YYYY-MM-DD HH:MM:SS"
func formatDateTime(t time.Time, utc bool) string {
	if utc {
		t = t.UTC()
	}
	return t.Format("2006-01-02 15:04:05")
}

// parseTimeString parses a human-readable time string into milliseconds
func parseTimeString(input string) (int64, error) {
	input = strings.TrimSpace(input)
	input = strings.TrimSuffix(input, "ago")
	input = strings.TrimSpace(input)

	// Try to parse as a plain number (milliseconds)
	if val, err := strconv.ParseInt(input, 10, 64); err == nil {
		return val, nil
	}

	// Time unit mappings
	units := map[string]int64{
		"year":        365 * 24 * 60 * 60 * 1000,
		"years":       365 * 24 * 60 * 60 * 1000,
		"y":           365 * 24 * 60 * 60 * 1000,
		"month":       30 * 24 * 60 * 60 * 1000,
		"months":      30 * 24 * 60 * 60 * 1000,
		"week":        7 * 24 * 60 * 60 * 1000,
		"weeks":       7 * 24 * 60 * 60 * 1000,
		"w":           7 * 24 * 60 * 60 * 1000,
		"day":         24 * 60 * 60 * 1000,
		"days":        24 * 60 * 60 * 1000,
		"d":           24 * 60 * 60 * 1000,
		"hour":        60 * 60 * 1000,
		"hours":       60 * 60 * 1000,
		"h":           60 * 60 * 1000,
		"minute":      60 * 1000,
		"minutes":     60 * 1000,
		"min":         60 * 1000,
		"m":           60 * 1000,
		"second":      1000,
		"seconds":     1000,
		"sec":         1000,
		"s":           1000,
		"millisecond": 1,
		"milliseconds": 1,
		"ms":          1,
	}

	// Pattern to match number followed by unit
	re := regexp.MustCompile(`(\d+)\s*([a-zA-Z]+)`)
	matches := re.FindAllStringSubmatch(input, -1)

	if len(matches) == 0 {
		return 0, fmt.Errorf("invalid time format: %s", input)
	}

	var total int64
	for _, match := range matches {
		value, err := strconv.ParseInt(match[1], 10, 64)
		if err != nil {
			return 0, fmt.Errorf("invalid number: %s", match[1])
		}

		unit := strings.ToLower(match[2])
		multiplier, ok := units[unit]
		if !ok {
			return 0, fmt.Errorf("unknown time unit: %s", unit)
		}

		total += value * multiplier
	}

	return total, nil
}

// timeAgo converts an epoch timestamp to a human-readable relative time
func timeAgo(epochMs int64, precision int) string {
	now := time.Now().UnixMilli()
	diff := now - epochMs

	if diff == 0 {
		return "just now"
	}

	isFuture := diff < 0
	if isFuture {
		diff = -diff
	}

	units := []struct {
		name  string
		value int64
	}{
		{"year", 365 * 24 * 60 * 60 * 1000},
		{"month", 30 * 24 * 60 * 60 * 1000},
		{"week", 7 * 24 * 60 * 60 * 1000},
		{"day", 24 * 60 * 60 * 1000},
		{"hour", 60 * 60 * 1000},
		{"minute", 60 * 1000},
		{"second", 1000},
	}

	var parts []string
	remaining := diff

	for _, unit := range units {
		if remaining >= unit.value {
			count := remaining / unit.value
			remaining %= unit.value

			unitName := unit.name
			if count > 1 {
				unitName += "s"
			}
			parts = append(parts, fmt.Sprintf("%d %s", count, unitName))

			if len(parts) >= precision {
				break
			}
		}
	}

	result := strings.Join(parts, " ")
	if isFuture {
		return "in " + result
	}
	return result + " ago"
}

// isTTY checks if stdout is a terminal
func isTTY() bool {
	return term.IsTerminal(int(os.Stdout.Fd()))
}

// printHelp displays usage information
func printHelp() {
	help := `Époque - Time manipulation utility

USAGE:
  timeago [OPTIONS] [ARGUMENTS]

MODES:
  No arguments:
    timeago
    Shows current time in epoch, UTC, and local formats

  Convert timestamp:
    timeago <EPOCH_TIMESTAMP> [PRECISION]
    Shows the timestamp in multiple formats with relative time
    PRECISION: 1-7 (default: 1) - number of time units to display

  Add time:
    timeago --add <TIME> [EPOCH_TIMESTAMP] [PRECISION]
    Adds time to current timestamp or specified timestamp
    TIME: human-readable time (e.g., "2 hours", "30 minutes", "1 day 5 hours")

  Remove time:
    timeago --remove <TIME> [EPOCH_TIMESTAMP] [PRECISION]
    Removes time from current timestamp or specified timestamp

OPTIONS:
  --help, -h     Show this help message
  --add          Add time to a timestamp
  --remove       Remove time from a timestamp
  -p             Set precision (1-7, can be placed anywhere in arguments)

TIME FORMATS:
  Supported units: years, months, weeks, days, hours, minutes, seconds, milliseconds
  Abbreviated: y, w, d, h, m/min, s/sec, ms
  Examples: "2 hours", "30 minutes", "1 day 5 hours", "2h 30m", "90s"

PRECISION:
  1-7: Number of time units to display in relative time
  Example: precision 2 shows "2 hours 30 minutes ago"

PIPED OUTPUT:
  When output is piped, only the result epoch timestamp is printed

EXAMPLES:
  timeago                              # Show current time
  timeago 1700000000000                # Convert epoch to human-readable
  timeago 1700000000000 2              # Show with 2 units of precision (positional)
  timeago 1700000000000 -p 2           # Show with 2 units of precision (flag)
  timeago --add "2 hours"              # Add 2 hours to current time
  timeago --add "2 hours" -p 3         # Add 2 hours with precision 3
  timeago 1700000000000 --add "2 hours" -p 2  # Flexible argument order
  timeago --add "1 day" 1700000000000  # Add 1 day to specific timestamp
  timeago --remove "30 minutes"        # Remove 30 minutes from current time
`
	fmt.Print(help)
}

func main() {
	args := os.Args[1:]

	// Handle help
	for _, arg := range args {
		if arg == "--help" || arg == "-h" {
			printHelp()
			os.Exit(0)
		}
	}

	isTTY := isTTY()

	// Handle no arguments - show current time
	if len(args) == 0 {
		now := time.Now()
		epochMs := now.UnixMilli()

		if isTTY {
			fmt.Println("Current Time:")
			fmt.Printf("Epoch: %d\n", epochMs)
			fmt.Printf("UTC: %s\n", formatDateTime(now, true))
			fmt.Printf("Local: %s\n", formatDateTime(now, false))
		} else {
			fmt.Println(epochMs)
		}
		os.Exit(0)
	}

	// Find operation flag (--add or --remove) anywhere in args
	var operation string
	var operationIdx int = -1
	for i, arg := range args {
		if arg == "--add" || arg == "--remove" {
			operation = arg
			operationIdx = i
			break
		}
	}

	// Find precision flag (-p) anywhere in args
	precision := 1
	precisionIdx := -1
	for i, arg := range args {
		if arg == "-p" {
			precisionIdx = i
			if i+1 < len(args) {
				p, err := strconv.Atoi(args[i+1])
				if err == nil && p >= 1 && p <= 7 {
					precision = p
				} else {
					fmt.Fprintf(os.Stderr, "Error: -p requires a value between 1 and 7\n")
					os.Exit(1)
				}
			} else {
				fmt.Fprintf(os.Stderr, "Error: -p requires a value\n")
				os.Exit(1)
			}
			break
		}
	}

	// Handle --add or --remove operations
	if operationIdx >= 0 {
		// Find the time value (should be right after the flag)
		if operationIdx+1 >= len(args) {
			fmt.Fprintf(os.Stderr, "Error: %s requires a time value\n", operation)
			os.Exit(1)
		}

		timeStr := args[operationIdx+1]
		timeMs, err := parseTimeString(timeStr)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: Invalid time format: %s\n", err)
			os.Exit(1)
		}

		// Find timestamp from remaining args (skip operation, time value, and -p flag)
		var baseEpoch int64 = -1

		for i, arg := range args {
			// Skip the operation flag and its time value
			if i == operationIdx || i == operationIdx+1 {
				continue
			}
			// Skip -p flag and its value
			if i == precisionIdx || i == precisionIdx+1 {
				continue
			}

			// Try to parse as timestamp
			val, err := strconv.ParseInt(arg, 10, 64)
			if err == nil {
				// If no -p flag was found and it's 1-7, treat as precision for backward compatibility
				if precisionIdx == -1 && val >= 1 && val <= 7 && baseEpoch != -1 {
					precision = int(val)
				} else {
					// Otherwise it's a timestamp
					baseEpoch = val
				}
			}
		}

		// Use current time if no timestamp specified
		if baseEpoch == -1 {
			baseEpoch = time.Now().UnixMilli()
		}

		// Calculate new timestamp
		var newEpoch int64
		if operation == "--add" {
			newEpoch = baseEpoch + timeMs
		} else {
			newEpoch = baseEpoch - timeMs
		}

		// Output result
		if isTTY {
			operationLabel := "Time Added"
			if operation == "--remove" {
				operationLabel = "Time Removed"
			}

			newTime := time.UnixMilli(newEpoch)
			fmt.Printf("Base Timestamp: %d\n", baseEpoch)
			fmt.Printf("%s: %d ms\n", operationLabel, timeMs)
			fmt.Printf("New Timestamp: %d\n", newEpoch)
			fmt.Printf("UTC: %s\n", formatDateTime(newTime, true))
			fmt.Printf("Local: %s\n", formatDateTime(newTime, false))
			fmt.Printf("Precision: %d\n", precision)
			fmt.Printf("Time %s: %s\n",
				map[bool]string{true: "until", false: "ago"}[newEpoch > time.Now().UnixMilli()],
				timeAgo(newEpoch, precision))
		} else {
			fmt.Println(newEpoch)
		}
		os.Exit(0)
	}

	// Handle timestamp conversion (no operation flag)
	var epochMs int64
	var err error

	// Find the timestamp (skip -p flag and its value)
	for i, arg := range args {
		if i == precisionIdx || i == precisionIdx+1 {
			continue
		}
		epochMs, err = strconv.ParseInt(arg, 10, 64)
		if err == nil {
			// If no -p was specified and there's another arg that's 1-7, use it as precision
			if precisionIdx == -1 && i+1 < len(args) {
				p, errP := strconv.Atoi(args[i+1])
				if errP == nil && p >= 1 && p <= 7 {
					precision = p
				}
			}
			break
		}
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: Invalid epoch timestamp\n")
		os.Exit(1)
	}

	t := time.UnixMilli(epochMs)

	if isTTY {
		fmt.Printf("Epoch: %d\n", epochMs)
		fmt.Printf("UTC: %s\n", formatDateTime(t, true))
		fmt.Printf("Local: %s\n", formatDateTime(t, false))
		fmt.Printf("Precision: %d\n", precision)
		fmt.Printf("Time ago: %s\n", timeAgo(epochMs, precision))
	} else {
		fmt.Println(epochMs)
	}
}
