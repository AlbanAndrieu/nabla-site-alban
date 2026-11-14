import assert from "node:assert/strict";
import test from "node:test";
import { formatContext, resolveExecutionProfile } from "../scripts/agent-task-context.mjs";

const snapshot = {
  branch: "feature/agent-capabilities",
  head: "0123456789abcdef0123456789abcdef01234567",
  base: "CACHED_ONLY",
  worktree: "CLEAN",
  profile: "REMOTE_SOURCE",
};

test("routing never upgrades an unavailable checkout to workstation evidence", () => {
  assert.equal(resolveExecutionProfile("UNAVAILABLE", true, "workstation"), "REMOTE_SOURCE");
  assert.equal(resolveExecutionProfile(snapshot.head, false), "LOCAL_LIMITED");
  assert.equal(resolveExecutionProfile(snapshot.head, true), "LOCAL_READY");
  assert.equal(resolveExecutionProfile(snapshot.head, true, "remote"), "REMOTE_SOURCE");
  assert.throws(() => resolveExecutionProfile(snapshot.head, true, "unknown"), /AGENT_EXECUTION_MODE_INVALID/);
});

test("remote routing avoids expensive or inaccessible local checks", () => {
  const output = formatContext("homelab", snapshot);
  assert.match(output, /profile REMOTE_SOURCE/);
  assert.match(output, /LAN UNVERIFIED/);
  assert.match(output, /inspect exact-SHA code/);
  assert.match(output, /L3: NOT_RUN/);
  assert.doesNotMatch(output, /First check: just node22-fast/);
  assert.ok(output.split("\n").length <= 7);
  assert.ok(output.length < 750);
});
