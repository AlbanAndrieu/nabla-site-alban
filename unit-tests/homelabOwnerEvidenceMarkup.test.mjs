import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../app/components/homelab/ServiceOwnerEvidenceSummary.tsx", import.meta.url),
  "utf8",
);

test("each OWNER evidence metric renders one stable data-evidence-key", () => {
  const metricSpan = source.match(/<span\s+key=\{metric\.key\}[\s\S]*?>/);
  assert.ok(metricSpan, "OWNER metric span must exist");
  const attributes = metricSpan[0].match(/data-[a-z-]+(?==)/g) ?? [];
  assert.equal(
    attributes.length,
    new Set(attributes).size,
    "duplicate data attributes break Next.js TypeScript builds (TS17001)",
  );
  assert.equal(attributes.filter((name) => name === "data-evidence-key").length, 1);
  assert.ok(attributes.includes("data-evidence-state"));
});

test("OWNER evidence stays non-interactive and does not invent a live probe", () => {
  assert.match(source, /data-owner-service-evidence/);
  assert.match(source, /describeServiceProbe\(entry, snapshot, "internal"\)/);
  assert.match(source, /probeMetric\("lan"/);
});
