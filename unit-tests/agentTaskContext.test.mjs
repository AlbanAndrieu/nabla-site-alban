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

test("reports actual cached base and untracked changes in an isolated Git fixture", async () => {
  const { execFileSync } = await import("node:child_process");
  const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "site-alban-context-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, stdio: "pipe" }).toString().trim();
  try {
    git("init", "-q", "-b", "master");
    git("config", "user.email", "test@example.invalid");
    git("config", "user.name", "Agent Context Test");
    writeFileSync(join(dir, "base.txt"), "base\n");
    git("add", "base.txt");
    git("commit", "-qm", "fixture base");
    git("update-ref", "refs/remotes/origin/master", "HEAD");
    git("switch", "-qc", "agent-test");
    const before = inspectGit(dir);
    assert.match(before.head, /^[a-f0-9]{40}$/);
    assert.equal(before.branch, "agent-test");
    assert.equal(before.worktree, "CLEAN");
    assert.equal(before.base, "CACHED_ONLY");
    writeFileSync(join(dir, "untracked.txt"), "never print these contents\n");
    assert.equal(inspectGit(dir).worktree, "DIRTY");
    assert.doesNotMatch(formatContext("agent", inspectGit(dir)), /never print these contents/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
