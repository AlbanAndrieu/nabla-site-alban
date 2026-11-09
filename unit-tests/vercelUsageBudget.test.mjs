import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { analyzeUsage } from "../scripts/finops/vercel-usage-budget.mjs";

const location = dirname(fileURLToPath(import.meta.url));
const script = join(location, "../scripts/finops/vercel-usage-budget.mjs");
const item = (value, unit = "CPU-hours") => ({ name: "Fluid Active CPU", usage: value, unit });
const period = { start: "2026-10-10T00:00:00Z", end: "2026-11-09T00:00:00Z" };

test("Hobby CPU ratios are explicitly scoped and deterministic", () => {
  for (const [hours, status] of [[0, "OK"], [1.99, "OK"], [2, "WATCH"], [3, "INVESTIGATE"], [3.6, "CRITICAL"]]) {
    const value = analyzeUsage({ period, services: [item(hours)] });
    assert.equal(value.status, status);
    assert.equal(value.cpuHours, hours);
    assert.equal(value.cpuQuantityParsed, true);
  }
});

test("converts seconds and milliseconds without inferring from wall time", () => {
  const res = analyzeUsage({ period, services: [item(3600, "s"), item(1800000, "ms")] });
  assert.equal(res.cpuHours, 1.5);
  assert.equal(res.status, "OK");
});

test("does not treat cost or HTTP duration as billed CPU", () => {
  const r = analyzeUsage({ services: [{ name: "Fluid Active CPU", cost: 0.01, durationMs: 999999 }] });
  assert.equal(r.status, "NOT_MEASURED");
  assert.equal(r.cpuHours, null);
  assert.equal(r.reason, "unrecognized-quantity-or-unit");
});

test("does not silently pass absent or ambiguous CPU evidence", () => {
  assert.equal(analyzeUsage({ services: [{ name: "Fast Data Transfer", usage: 100, unit: "GB" }] }).status, "NOT_MEASURED");
  assert.equal(analyzeUsage({ services: [item(1), { name: "Active CPU", usage: 2, unit: "mystery" }] }).status, "NOT_MEASURED");
  assert.equal(analyzeUsage({ services: [] }).cpuHours, null);
  assert.equal(analyzeUsage([]).status, "INVALID");
});

test("supports FOCUS charge objects without summing daily breakdown twice", () => {
  const r = analyzeUsage({ period, charges: [{ ServiceName: "Fluid Active CPU", UsageQuantity: 7200, UsageUnit: "seconds" }], breakdown: [{ services: [item(9000)] }] });
  assert.equal(r.cpuHours, 2);
  assert.equal(r.status, "WATCH");
});

test("refuses to declare a safe budget from an incomplete or unknown date window", () => {
  const shortWindow = analyzeUsage({ period: { start: "2026-11-08", end: "2026-11-09" }, services: [item(0.1)] });
  assert.equal(shortWindow.status, "WINDOW_UNVERIFIED");
  assert.equal(shortWindow.percentOfQuota, null);
  assert.equal(analyzeUsage({ services: [item(1)] }).status, "WINDOW_UNVERIFIED");
});

test("stdin CLI emits compact machine-readable JSON with conservative exit codes", () => {
  const success = spawnSync(process.execPath, [script, "--stdin"], { input: JSON.stringify({ period, services: [item(2.1)] }), encoding: "utf8" });
  assert.equal(success.status, 0);
  assert.equal(JSON.parse(success.stdout).status, "WATCH");
  const strict = spawnSync(process.execPath, [script, "--stdin", "--strict"], { input: JSON.stringify({ period, services: [item(2.1)] }), encoding: "utf8" });
  assert.equal(strict.status, 1);
  const missing = spawnSync(process.execPath, [script, "--stdin"], { input: "{}", encoding: "utf8" });
  assert.equal(missing.status, 2);
  assert.equal(JSON.parse(missing.stdout).status, "NOT_MEASURED");
});

test("malformed/unavailable exports fail closed without raw data echo", () => {
  const broken = spawnSync(process.execPath, [script, "--stdin"], { input: '{"apiKey": "secret-shh"', encoding: "utf8" });
  assert.equal(broken.status, 2);
  assert.equal(JSON.parse(broken.stdout).reason, "invalid-json");
  assert.doesNotMatch(broken.stdout, /secret-shh/);
  const none = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(none.status, 2);
});
