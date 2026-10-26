import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("all eight OWNER service metrics live inside the collapsed diagnostics disclosure", () => {
  const card = read("app/components/homelab/HomelabServiceCard.tsx");
  const reasons = read("app/components/homelab/ServiceHealthReasons.tsx");
  const diagnostics = read("app/components/homelab/ServiceOperatorDiagnostics.tsx");
  const summary = read("app/components/homelab/ServiceOwnerEvidenceSummary.tsx");

  assert.doesNotMatch(card, /<ServiceOwnerEvidenceSummary/);
  assert.match(card, /<ServiceHealthReasons/);
  assert.match(card, /ownerView=\{!readOnly\}/);
  assert.match(reasons, /<ServiceOperatorDiagnostics entry=\{entry\}>/);
  assert.match(reasons, /\{ownerView \? <>\{probeEvidence\}\{ownerEvidence\}<\/> : null\}/);
  assert.match(reasons, /<ServiceOwnerEvidenceSummary/);
  assert.match(diagnostics, /<details[\s\S]*data-service-operator-diagnostics/);
  assert.match(diagnostics, /\{children\}/);
  assert.doesNotMatch(diagnostics, /\{rows\.length\}\)/);

  for (const key of ["docker", "https", "cloudflare", "http", "latency", "prometheus"]) {
    assert.match(summary, new RegExp('key: "' + key + '"'));
  }
  assert.match(summary, /probeMetric\("probe"/);
  assert.match(summary, /probeMetric\("lan"/);
  assert.match(summary, /data-owner-diagnostic-timeline/);
  assert.match(summary, /data-evidence-state=\{metric\.state\}/);
});

test("OWNER-only metrics and probe placeholders do not appear in public SERVICE cards", () => {
  const reasons = read("app/components/homelab/ServiceHealthReasons.tsx");
  const diagnostics = read("app/components/homelab/ServiceOperatorDiagnostics.tsx");
  assert.match(reasons, /ownerView \? snapshot \?/);
  assert.match(reasons, /ownerView \? <>\{probeEvidence\}\{ownerEvidence\}<\/> : null/);
  assert.match(diagnostics, /if \(!entry && !children\) return null/);
  assert.match(reasons, /data-service-evidence-unavailable/);
});

test("refreshing endpoints cannot remount service cards or close open diagnostics", () => {
  const grid = read("app/components/homelab/HomelabServiceGrid.tsx");
  const reasons = read("app/components/homelab/ServiceHealthReasons.tsx");
  const css = read("app/components/homelab/HomelabServicesBlock.module.css");
  assert.match(grid, /const serviceOccurrences = new Map<string, number>\(\)/);
  assert.match(grid, /key=\{`\$\{serviceId\}:\$\{occurrence\}`\}/);
  assert.doesNotMatch(grid, /key=\{`\$\{serviceId\}:\$\{endpointUrl\}`\}/);
  assert.match(reasons, /\{hasHealthIssue \? \(/);
  assert.doesNotMatch(reasons, /if \(state !== "fail" && state !== "warn"\)/);
  assert.match(css, /\.serviceSignalSlot\s*\{\s*min-height:/);
  assert.match(css, /data-service-operator-diagnostics\] > summary:focus-visible/);
});
