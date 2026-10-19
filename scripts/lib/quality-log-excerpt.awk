# Preserve the *first* failing pre-commit hook rather than the last
# ${max} lines (which can be unrelated successful secret-scanner output).
# Print bounded redacted diagnostics; never print source files or HTTP evidence.
/\.\.\.Failed/ && !found { found = 1; remaining = max; print; next }
found && remaining > 0 {
    # One hook's standard diagnostics: id, exit code, error and next lines.
    if ($0 ~ /^.*\.\.\.(Passed|Skipped|Failed)/) exit
    gsub(/(Authorization:|Set-Cookie:|Cookie:)[^[:space:]]*/, "[redacted]")
    print
    remaining--
    if (remaining == 0) exit
}
END { if (!found) exit 1 }
