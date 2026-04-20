#!/usr/bin/env python3
"""
Convert JPG/JPEG images to PNG with transparent backgrounds.

White and near-white pixels are made transparent so logos and graphics
blend on any page background. Uses Python PIL/Pillow.

Usage:
  python3 jpg_to_transparent_png.py [directory]
  python3 jpg_to_transparent_png.py [directory] file1.jpg file2.jpeg

If no directory is given, uses the script's directory (assets/).
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow")
    sys.exit(1)


def make_transparent(
    path: str,
    threshold: int = 240,
    out_path: str | None = None,
) -> bool:
    """
    Convert a JPG/JPEG to PNG with white/near-white pixels made transparent.

    Args:
        path: Input image path (.jpg or .jpeg).
        threshold: RGB value above which pixels are made transparent (0-255). Default 240.
        out_path: Output PNG path. If None, same basename with .png extension.

    Returns:
        True if a PNG was written, False otherwise.
    """
    path = os.path.abspath(path)
    if not os.path.isfile(path):
        return False

    base, ext = os.path.splitext(path)
    if ext.lower() not in (".jpg", ".jpeg"):
        return False

    if out_path is None:
        out_path = base + ".png"
    out_path = os.path.abspath(out_path)

    try:
        im = Image.open(path).convert("RGBA")
        data = im.getdata()
        new_data = []
        for item in data:
            r, g, b, _ = item[:4]
            if r > threshold and g > threshold and b > threshold:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        im.putdata(new_data)
        im.save(out_path, "PNG")
        return True
    except Exception as e:
        print(f"Skip {path}: {e}", file=sys.stderr)
        return False


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    threshold = 240

    if len(sys.argv) < 2:
        directory = script_dir
        patterns = ("*.jpg", "*.jpeg")
        files = []
        for p in patterns:
            files.extend(directory.glob(p))
        files = sorted(set(files))
    else:
        arg1 = Path(sys.argv[1])
        if arg1.is_dir():
            directory = arg1
            patterns = ("*.jpg", "*.jpeg")
            files = []
            for p in patterns:
                files.extend(directory.glob(p))
            files = sorted(set(files))
            # Optional extra args: specific files
            for a in sys.argv[2:]:
                p = (directory / a) if not Path(a).is_absolute() else Path(a)
                if p.is_file():
                    files.append(p)
        else:
            directory = script_dir
            files = [Path(f) for f in sys.argv[1:] if Path(f).is_file()]

    if not files:
        print("No JPG/JPEG files found.", file=sys.stderr)
        sys.exit(0)

    for f in files:
        path = str(f)
        if make_transparent(path, threshold=threshold):
            out = os.path.splitext(path)[0] + ".png"
            print("Created", out)


if __name__ == "__main__":
    main()
