"""Offline, standard-library contracts for bounded Actions usage inventory."""
import contextlib
import datetime as dt
import importlib.util
import io
import json
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parents[1] / "scripts/github-actions-usage.py"
SPEC = importlib.util.spec_from_file_location("actions_usage", SOURCE)
assert SPEC is not None and SPEC.loader is not None
usage = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(usage)
SINCE = dt.datetime(2026, 10, 1, tzinfo=dt.timezone.utc)


class ActionsBudgetTests(unittest.TestCase):
    def test_single_page_requests_are_bounded(self):
        with patch.object(usage, "items", return_value=[{"id": n} for n in range(12)]) as get:
            actual = usage.recent_runs("example/repo", SINCE, 12)
        self.assertEqual(len(actual), 12)
        get.assert_called_once()
        self.assertIn("per_page=12&page=1", get.call_args.args[0])
        self.assertFalse(get.call_args.kwargs["paginate"])

    def test_pagination_cannot_exceed_max_runs(self):
        calls = []
        def fake(path, key, paginate=True):
            calls.append(path)
            return [{"id": n} for n in range(100)]
        with patch.object(usage, "items", side_effect=fake):
            actual = usage.recent_runs("example/repo", SINCE, 120)
        self.assertEqual(len(actual), 120)
        self.assertEqual(len(calls), 2)
        self.assertIn("page=2", calls[-1])

    def test_empty_page_stops_immediately(self):
        with patch.object(usage, "items", return_value=[]) as get:
            self.assertEqual(usage.recent_runs("example/repo", SINCE, 100), [])
        get.assert_called_once()

    def test_recent_runs_do_not_ask_gh_for_unbounded_pagination(self):
        response = subprocess.CompletedProcess([], 0, json.dumps({"workflow_runs": [{"id": 1}]}))
        with patch.object(usage.subprocess, "run", return_value=response) as run:
            self.assertEqual(len(usage.items("repos/a/b/actions/runs?per_page=12", "workflow_runs", paginate=False)), 1)
        argv = run.call_args.args[0]
        self.assertNotIn("--paginate", argv)
        self.assertNotIn("--slurp", argv)

    def test_invalid_run_identifiers_fail_closed(self):
        for value in (0, True, -1, "../secrets", "1/2", 1.25, 2**63):
            with self.subTest(value=value), self.assertRaises(ValueError):
                usage.valid_run_id(value)
        self.assertEqual(usage.valid_run_id("123"), 123)

    def test_invalid_repository_names_fail_closed(self):
        for value in ("../other", "foo/bar", ".", "", "with space", "abc?x=y"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                usage.validate_component(value)

    def test_artifact_size_rejects_bad_types(self):
        for value in (True, -1, 1.5, "-3", "1.25"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                usage.artifact_bytes(value)
        self.assertEqual(usage.artifact_bytes("1048576"), 1048576)

    def test_job_minutes_count_only_measured_wall_time(self):
        rows = [
            {"started_at": "2026-10-22T09:00:00Z", "completed_at": "2026-10-22T09:02:30Z", "conclusion": "success"},
            {"conclusion": "skipped"},
        ]
        with patch.object(usage, "items", return_value=rows):
            wall, skipped = usage.job_stats("example/repo", 42)
        self.assertEqual(wall, 2.5)
        self.assertEqual(skipped, 1)

    def test_partial_api_failure_does_not_report_success(self):
        with patch.object(sys, "argv", ["github-actions-usage.py", "--repo", "nabla-site-alban"]), \
             patch.object(usage, "recent_runs", side_effect=OSError("credential details")), \
             patch.object(usage, "items", return_value=[]), \
             contextlib.redirect_stderr(io.StringIO()) as err, \
             contextlib.redirect_stdout(io.StringIO()):
            status = usage.main()
        self.assertEqual(status, 1)
        self.assertIn("metrics incomplete", err.getvalue())
        self.assertNotIn("credential details", err.getvalue())

    def test_invalid_cli_limits_are_rejected_before_network(self):
        with patch.object(sys, "argv", ["github-actions-usage.py", "--max-runs", "0"]), \
             patch.object(usage, "items", side_effect=AssertionError("no network")), \
             contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as error:
                usage.main()
        self.assertEqual(error.exception.code, 2)

    def test_workflow_labels_do_not_inject_terminal_lines(self):
        label = usage.safe_label("CI\nsecret\r\x1b[31m")
        self.assertNotIn("\n", label)
        self.assertNotIn("\r", label)
        self.assertNotIn("\x1b", label)


if __name__ == "__main__":
    unittest.main()
