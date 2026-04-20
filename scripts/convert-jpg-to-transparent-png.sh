#!/usr/bin/env bash
# Convert all JPG/JPEG under public to PNG with transparent backgrounds (project-wide).
# Requires: Python 3 + Pillow. Run from repo root.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONVERTER="$REPO_ROOT/public/assets/jpg_to_transparent_png.py"

if [[ ! -f "$CONVERTER" ]]; then
	echo "Error: Converter not found: $CONVERTER" >&2
	exit 1
fi

for dir in "$REPO_ROOT/public/assets" "$REPO_ROOT/public/other"; do
	if [[ -d "$dir" ]]; then
		echo "Converting JPG/JPEG in $dir ..."
		python3 "$CONVERTER" "$dir" || true
	fi
done

echo "Done. Update HTML/CSS to reference .png instead of .jpg/.jpeg where needed."
