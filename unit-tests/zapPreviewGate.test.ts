import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../.github/workflows/zap-preview.yml",
  import.meta.url,
);

test("automatic ZAP preview starts only after a successful Vercel deployment", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /repository_dispatch:/);
  assert.match(workflow, /vercel\.deployment\.success/);
  assert.doesNotMatch(workflow, /vercel\.deployment\.(failure|error|canceled)/);
});

test("manual ZAP remains an explicit operator action, not a failed-preview fallback", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:\s*(?:\n|$)/);
});
