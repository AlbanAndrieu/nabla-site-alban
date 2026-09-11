"""Report non-regression code-size limits for maintained changed source files.

The gate is intentionally baseline-aware: existing oversized legacy files are
allowed a small growth margin, while new files or files crossing the hard limit
must be refactored. The script has no third-party dependency and is cheap enough
to run in the local agent gate before npm lint/tests.
"""

from __future__ import annotations

import argparse
import fnmatch
import subprocess
import sys
from pathlib import Path
from typing import Iterable

DEFAULT_WARNING_LINES = 300
DEFAULT_FAILURE_LINES = 600
DEFAULT_LEGACY_GROWTH_PERCENT = 2.0
DEFAULT_PATHS = ("app", "components", "i18n", "lib", "scripts", "tests", "unit-tests")
SOURCE_SUFFIXES = {".cjs", ".js", ".jsx", ".mjs", ".py", ".sh", ".ts", ".tsx"}
DEFAULT_EXCLUDES = (
    ".next/**",
    "coverage/**",
    "node_modules/**",
    "public/**",
    "**/generated/**",
    "**/*.d.ts",
)


def _normalized(path: Path) -> str:
    return path.as_posix().lstrip("./")


def _is_excluded(path: Path, patterns: Iterable[str]) -> bool:
    normalized = _normalized(path)
    return any(fnmatch.fnmatch(normalized, pattern) for pattern in patterns)


def _line_count(path: Path) -> int:
    with path.open("r", encoding="utf-8") as source:
        return sum(1 for _ in source)


def _baseline_line_count(path: Path, baseline_ref: str | None) -> int | None:
    if not baseline_ref or path.is_absolute():
        return None

    result = subprocess.run(  # noqa: S603 -- fixed git executable and validated file path
        ["git", "show", f"{baseline_ref}:{path.as_posix()}"],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    return len(result.stdout.splitlines())


def _iter_source_files(paths: Iterable[str]) -> Iterable[Path]:
    seen: set[Path] = set()
    for raw_path in paths:
        path = Path(raw_path)
        candidates = path.rglob("*") if path.is_dir() else (path,)
        for candidate in candidates:
            if candidate.suffix not in SOURCE_SUFFIXES or not candidate.is_file():
                continue
            resolved = candidate.resolve()
            if resolved in seen:
                continue
            seen.add(resolved)
            yield candidate


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="*", help="Source files/directories to inspect")
    parser.add_argument("--warn", type=int, default=DEFAULT_WARNING_LINES)
    parser.add_argument("--fail", type=int, default=DEFAULT_FAILURE_LINES)
    parser.add_argument(
        "--baseline-ref",
        help="Git ref used to grandfather already-oversized files",
    )
    parser.add_argument(
        "--legacy-growth-percent",
        type=float,
        default=DEFAULT_LEGACY_GROWTH_PERCENT,
        help="Maximum percentage growth allowed for files already above --fail",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        help="Additional glob pattern to exclude (repeatable)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.warn < 1 or args.fail <= args.warn:
        raise SystemExit(
            "--fail must be greater than --warn, and both must be positive",
        )
    if args.legacy_growth_percent < 0:
        raise SystemExit("--legacy-growth-percent must be non-negative")

    paths = args.paths or list(DEFAULT_PATHS)
    exclusions = (*DEFAULT_EXCLUDES, *args.exclude)
    warnings = 0
    failures = 0
    inspected = 0

    for path in sorted(_iter_source_files(paths), key=lambda item: item.as_posix()):
        if _is_excluded(path, exclusions):
            continue

        inspected += 1
        line_count = _line_count(path)
        baseline_lines = _baseline_line_count(path, args.baseline_ref)

        if line_count > args.fail:
            legacy_limit = None
            if baseline_lines is not None and baseline_lines > args.fail:
                legacy_limit = max(
                    baseline_lines,
                    int(baseline_lines * (1 + args.legacy_growth_percent / 100)),
                )

            if legacy_limit is not None and line_count <= legacy_limit:
                warnings += 1
                print(
                    f"WARNING {path}: {line_count} lines remains above {args.fail} "
                    f"(baseline {baseline_lines}, legacy limit {legacy_limit}); "
                    "refactor when adding substantial functionality.",
                    file=sys.stderr,
                )
                continue

            failures += 1
            baseline_detail = (
                f" (baseline: {baseline_lines})" if baseline_lines is not None else ""
            )
            print(
                f"ERROR {path}: {line_count} lines exceeds {args.fail}{baseline_detail}; "
                "extract cohesive responsibilities before adding significant functionality.",
                file=sys.stderr,
            )
        elif line_count > args.warn:
            warnings += 1
            print(
                f"WARNING {path}: {line_count} lines exceeds {args.warn}; "
                "consider extracting cohesive responsibilities.",
                file=sys.stderr,
            )

    print(
        f"Code-size gate: {inspected} file(s), {warnings} warning(s), {failures} error(s)",
    )
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
