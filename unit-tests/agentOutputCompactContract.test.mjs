import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const awk = fileURLToPath(new URL("../scripts/lib/quality-log-excerpt.awk", import.meta.url));
const metrics = fileURLToPath(new URL("../scripts/agent-output-metrics.sh", import.meta.url));
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("bounded pre-commit excerpt retains last actionable lines", () => {
  const input = ["initial noise", "hook........Failed", ...Array.from({length: 1000}, (_, i) => "diagnostic " + i), "last failure"].join("\n");
  const result = spawnSync("awk", ["-v", "max=4", "-f", awk], {input, encoding:"utf8"});
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split("\n").slice(-1), ["last failure"]);
  assert.equal(result.stdout.trim().split("\n").length, 4);
  assert.equal(spawnSync("awk", ["-v", "max=4", "-f", awk], {input:"all passed", encoding:"utf8"}).status, 1);
});

test("agent output metrics measures only lines and bytes", () => {
  const dir = mkdtempSync(join(tmpdir(), "alban-agent-metrics-"));
  try {
    const old = join(dir, "old.log"), now = join(dir, "new.log");
    writeFileSync(old, "one\ntwo\nthree\nfour\n");
    writeFileSync(now, "one\ntwo\n");
    const result = spawnSync("bash", [metrics, old, now], {encoding:"utf8"});
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /line_reduction_pct=50\.0/);
    assert.match(result.stdout, /tokens=not_measured/);
    assert.equal(spawnSync("bash", [metrics, now, join(dir, "missing")]).status, 2);
  } finally { rmSync(dir, {recursive:true, force:true}); }
});

test("log tools are maintenance-only and never bypass security scanning", () => {
  const paths = ["scripts/ci-scope.sh", "scripts/lib/baseline-classification.sh", ".github/workflows/vercel-preview.yml"];
  for (const path of paths) for (const tool of ["scripts/lib/quality-log-excerpt.awk", "scripts/agent-output-metrics.sh"]) {
    assert.ok(read(path).includes(tool), path + " lacks " + tool);
  }
  const gate = read("scripts/quality-gate.sh");
  assert.match(gate, /QUALITY_ERROR_LINES must be a positive integer/);
  assert.match(gate, /-f scripts\/lib\/quality-log-excerpt\.awk/);
  assert.match(gate, /pre-commit/);
});
