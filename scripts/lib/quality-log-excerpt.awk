# Store only the last max lines after the first failing hook, bounded in memory.
# When no failed hook is present, exit nonzero so the caller can show a fallback.
/\.\.\.Failed/ { found = 1 }
found {
    lines[count % max] = $0
    count++
}
END {
    if (!found) exit 1
    start = count > max ? count - max : 0
    for (i = start; i < count; i++) print lines[i % max]
}
