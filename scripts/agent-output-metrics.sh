#!/usr/bin/env bash
set -euo pipefail

# Compare measured output only; never print log contents or approximate tokens.
if (($# != 2)) || [[ ! -f "$1" || ! -f "$2" ]]; then
    echo 'Usage: bash scripts/agent-output-metrics.sh BASELINE_LOG CURRENT_LOG' >&2
    exit 2
fi
for file in "$1" "$2"; do
    if [[ ! -r "${file}" ]]; then
        echo '❌ OUTPUT_METRICS_UNREADABLE: one input cannot be read' >&2
        exit 2
    fi
done

baseline_lines="$(awk 'END { print NR+0 }' "$1")"
current_lines="$(awk 'END { print NR+0 }' "$2")"
baseline_bytes="$(wc -c <"$1" | tr -d ' ')"
current_bytes="$(wc -c <"$2" | tr -d ' ')"

# Force a dot decimal separator: a French locale would print 50,0.
LC_ALL=C awk -v bl="${baseline_lines}" -v cl="${current_lines}" -v bb="${baseline_bytes}" -v cb="${current_bytes}" 'BEGIN {
    if (bl == 0 || bb == 0) {
        print "❌ OUTPUT_METRICS_EMPTY_BASELINE: baseline log must contain data" > "/dev/stderr"
        exit 2
    }
    printf "OUTPUT_METRICS baseline_lines=%d current_lines=%d line_reduction_pct=%.1f baseline_bytes=%d current_bytes=%d byte_reduction_pct=%.1f tokens=not_measured\n", bl, cl, 100*(bl-cl)/bl, bb, cb, 100*(bb-cb)/bb
}'
