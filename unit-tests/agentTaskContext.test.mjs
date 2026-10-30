import assert from "node:assert/strict";
import test from "node:test";
import { formatContext, inspectGit, parseTask, TASKS } from "../scripts/agent-task-context.mjs";

const snapshot = {
  branch: "docs/agent-test", head: "0123456789abcdef0123456789abcdef01234567",
  worktree: "DIRTY", base: "CACHED_ONLY",
};

test("accepts only explicit, known task scopes", () => {
  for (const name of Object.keys(TASKS)) {
    assert.equal(parseTask([name]), name);
    assert.equal(parseTask(["--task", name]), name);
  }
  for (const args of [[], ["all"], ["--task"], ["--task", "../../.env"], ["ui", "extra"]]) {
    assert.throws(() => parseTask(args), /AGENT_TASK_INVALID/);
  }
});

test("prints small bounded action plan without claiming success", () => {
  const out = formatContext("ui", snapshot);
  assert.ok(out.split("\n").length <= 7);
  assert.match(out, /docs\/agent-frontend-standards\.md/);
  assert.match(out, /First check: just node22-fast/);
  assert.match(out, /HEAD 0123456789ab/);
  assert.match(out, /L3: NOT_RUN/);
  assert.doesNotMatch(out, /\bPASS\b|secret|token|172\.17\./i);
});

test("always leaves strict L3 publication gate intact", () => {
  for (const name of Object.keys(TASKS)) {
    const out = formatContext(name, snapshot);
    assert.match(out, /npm run quality:agent:publish/);
    assert.match(out, /NOT_RUN/);
    assert.ok(out.length < 750);
  }
});

test("cannot mark missing checkout or cached refs as verified", () => {
  const state = inspectGit("/directory-that-does-not-exist");
  assert.equal(state.head, "UNAVAILABLE");
  assert.equal(state.branch, "DETACHED_OR_NO_GIT");
  assert.equal(state.worktree, "UNKNOWN");
  assert.equal(state.base, "BASE_MISSING");
  assert.match(formatContext("ci", state), /BASE_MISSING/);
});
