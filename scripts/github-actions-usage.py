#!/usr/bin/env python3
"""Read-only account Actions usage inventory (requires gh auth login).
Usage: python3 scripts/github-actions-usage.py --days 30 [--owner AlbanAndrieu]
Reports wall-clock job minutes (not invoiced runner-weighted minutes),
artifact bytes, and workflow totals; no tokens, secrets or files uploaded.
"""
import argparse
import collections
import concurrent.futures
import datetime as dt
import json
import re
import subprocess
import sys

UTC = dt.timezone.utc
DEFAULT_REPOS = ["nabla-compose", "fastapi-sample", "nabla-site-alban", "nabla-site-bababou"]
# Bounded fan-out: fast enough, below GitHub secondary rate limits.
JOB_WORKERS = 6
# Avoid treating user-supplied repository paths as arbitrary GitHub API URLs.
GITHUB_COMPONENT = re.compile(r"[A-Za-z0-9_.-]{1,100}\Z")
MAX_RUNS = 1000


def validate_component(value):
    if not GITHUB_COMPONENT.fullmatch(value) or value in (".", ".."):
        raise ValueError("invalid GitHub owner/repository identifier")
    return value


def valid_run_id(value):
    """Accept only positive numeric GitHub run ids before constructing API paths."""
    if isinstance(value, bool):
        raise ValueError("invalid GitHub workflow run id")
    if isinstance(value, int):
        run_id = value
    elif isinstance(value, str) and re.fullmatch(r"[0-9]{1,20}", value):
        run_id = int(value)
    else:
        raise ValueError("invalid GitHub workflow run id")
    if run_id <= 0 or run_id > 2**63 - 1:
        raise ValueError("invalid GitHub workflow run id")
    return run_id


def artifact_bytes(value):
    """Reject negative, fractional, malformed and boolean sizes."""
    if type(value) is int:
        size = value
    elif isinstance(value, str) and re.fullmatch(r"[0-9]{1,20}", value):
        size = int(value)
    else:
        raise ValueError("invalid GitHub artifact size")
    if size < 0 or size > 2**63 - 1:
        raise ValueError("invalid GitHub artifact size")
    return size


def safe_label(value):
    """Never allow workflow names to inject terminal lines/control sequences."""
    return "".join(ch if ch.isprintable() and ch not in "\r\n\t" else "?"
                   for ch in str(value))[:140]

def items(path, key, paginate=True):
    # Envelope responses ({"total_count", key: [...]}); --slurp wraps pages in a list.
    command = ["gh", "api", path] + (["--paginate", "--slurp"] if paginate else [])
    p = subprocess.run(command, capture_output=True, text=True, check=True, timeout=45)
    data = json.loads(p.stdout)
    pages = data if paginate else [data]
    if not isinstance(pages, list):
        raise ValueError("invalid GitHub API pagination envelope")
    rows = []
    for page in pages:
        if not isinstance(page, dict) or not isinstance(page.get(key), list):
            raise ValueError("invalid GitHub API response envelope")
        if any(not isinstance(row, dict) for row in page[key]):
            raise ValueError("invalid GitHub API response item")
        rows.extend(page[key])
    return rows

def recent_runs(name, since, max_runs):
    """Return at most max_runs newest runs without paginating all workflow history."""
    per_page = min(max_runs, 100)
    page = 1
    runs = []
    while len(runs) < max_runs:
        path = (
            f"repos/{name}/actions/runs?per_page={per_page}&page={page}"
            f"&created=%3E%3D{since.date().isoformat()}"
        )
        batch = items(path, "workflow_runs", paginate=False)
        runs.extend(batch[:max_runs - len(runs)])
        if len(batch) < per_page:
            break
        page += 1
    return runs


def timeval(raw):
    if raw is None or raw == "":
        return None
    if not isinstance(raw, str):
        raise ValueError("invalid GitHub job timestamp")
    when = dt.datetime.fromisoformat(raw.replace("Z", "+00:00"))
    if when.tzinfo is None:
        raise ValueError("GitHub job timestamp is missing timezone")
    return when

def job_stats(name, run_id):
    run_id = valid_run_id(run_id)
    wall, skipped = 0., 0
    for job in items(f"repos/{name}/actions/runs/{run_id}/jobs?per_page=100", "jobs"):
        if job.get("conclusion") == "skipped":
            skipped += 1
        start, end = timeval(job.get("started_at")), timeval(job.get("completed_at"))
        if (start is None) != (end is None):
            raise ValueError("incomplete GitHub job timing")
        if start is not None and end is not None:
            if end < start:
                raise ValueError("GitHub job completed before it started")
            wall += (end - start).total_seconds() / 60
    return wall, skipped

API_FAILURES = (subprocess.CalledProcessError, subprocess.TimeoutExpired,
                OSError, ValueError, TypeError)


def warn_partial(scope, exc):
    """Warn without echoing API response bodies or credential-bearing commands."""
    print(f"WARNING: {scope}: {type(exc).__name__}; metrics incomplete",
          file=sys.stderr)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--owner", default="AlbanAndrieu")
    p.add_argument("--days", type=int, default=30)
    p.add_argument("--max-runs", type=int, default=40)
    p.add_argument("--repo", action="append", help="Repository name; repeat to include more. Defaults to the four active projects.")
    a = p.parse_args()
    if not 1 <= a.days <= 3650:
        p.error("--days must be between 1 and 3650")
    if not 1 <= a.max_runs <= MAX_RUNS:
        p.error(f"--max-runs must be between 1 and {MAX_RUNS}")
    # Duplicate --repo flags must never cause double counting or extra API calls.
    selected_repos = list(dict.fromkeys(a.repo or DEFAULT_REPOS))
    try:
        validate_component(a.owner)
        for repo in selected_repos:
            validate_component(repo)
    except ValueError as exc:
        p.error(str(exc))
    since = dt.datetime.now(UTC) - dt.timedelta(days=a.days)
    total = collections.defaultdict(lambda: {"runs": 0, "job_wall_minutes": 0.,
                                             "artifact_mib": 0., "skipped_jobs": 0})
    incomplete = False
    with concurrent.futures.ThreadPoolExecutor(max_workers=JOB_WORKERS) as pool:
        for repo in selected_repos:
            name = f"{a.owner}/{repo}"
            try:
                runs = recent_runs(name, since, a.max_runs)
            except API_FAILURES as exc:
                warn_partial(f"{name} workflow runs", exc)
                incomplete = True
                runs = []
            else:
                if len(runs) >= a.max_runs:
                    print(f"WARNING: {name} reached --max-runs={a.max_runs}; "
                          "run history may be truncated; metrics incomplete",
                          file=sys.stderr)
                    incomplete = True
            try:
                for artifact in items(f"repos/{name}/actions/artifacts?per_page=100", "artifacts"):
                    if not artifact.get("expired"):
                        total[f"{name} :: stored artifacts"]["artifact_mib"] += (
                            artifact_bytes(artifact.get("size_in_bytes")) / 1048576
                        )
            except API_FAILURES as exc:
                warn_partial(f"{name} artifacts", exc)
                incomplete = True
            futures = {}
            for run in runs:
                try:
                    run_id = valid_run_id(run.get("id"))
                except (ValueError, TypeError, AttributeError) as exc:
                    warn_partial(f"{name} workflow run identity", exc)
                    incomplete = True
                    continue
                label = (
                    f"{name} :: "
                    f"{safe_label(run.get('name') or run.get('path') or 'unknown')}"
                )
                futures[pool.submit(job_stats, name, run_id)] = label
            for future in concurrent.futures.as_completed(futures):
                label = futures[future]
                try:
                    wall, skipped = future.result()
                except API_FAILURES as exc:
                    warn_partial(f"{label} jobs", exc)
                    incomplete = True
                    continue
                total[label]["runs"] += 1
                total[label]["job_wall_minutes"] += wall
                total[label]["skipped_jobs"] += skipped
    print("repo / workflow\truns\tjob wall min\tstored MiB\tskipped jobs")
    for key, d in sorted(total.items(), key=lambda x: -(x[1]["job_wall_minutes"] + x[1]["artifact_mib"])):
        print(f"{key}\t{d['runs']}\t{d['job_wall_minutes']:.1f}\t{d['artifact_mib']:.1f}\t{d['skipped_jobs']}")
    print("Note: wall minutes are NOT GitHub billed minutes. See Billing > Usage for authoritative credits.", file=sys.stderr)
    if incomplete:
        print("WARNING: partial API inventory; missing data must not be treated as zero usage.", file=sys.stderr)
    return 1 if incomplete else 0

if __name__ == "__main__":
    raise SystemExit(main())
