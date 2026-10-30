import assert from "node:assert/strict";
import test from "node:test";
import { median, summarize, run } from "../scripts/agent-efficiency-snapshot.mjs";

test("median is bounded and does not modify inputs", () => {
  const samples = [15, 4, 9, 22];
  assert.equal(median(samples), 9);
  assert.deepEqual(samples, [15, 4, 9, 22]);
  assert.equal(median([]), null);
  assert.equal(median([NaN]), null);
});

test("instruction size is measurable, token costs remain explicitly unknown", () => {
  const report = summarize([3940, 1604], [25, 30, 22], true);
  assert.equal(report.agentInstructionBytes, 3940);
  assert.equal(report.openCodePromptBytes, 1604);
  assert.equal(report.taskHintMedianMs, 25);
  assert.equal(report.samples, 3);
  assert.equal(report.tokenCost, "UNKNOWN");
  assert.equal(report.publication, "NOT_RUN");
  assert.equal(summarize([3940, 1604], [], false).taskHintMedianMs, null);
});

test("missing checkout or invalid sample count never produces a PASS", () => {
  assert.equal(run({ cwd: "/missing-site-alban-repo", samples: 3 }), 3);
  assert.equal(run({ cwd: "/missing-site-alban-repo", samples: 11 }), 2);
});
