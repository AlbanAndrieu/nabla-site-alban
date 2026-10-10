import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const evidence = readFileSync(
  new URL("../app/components/homelab/ServiceProbeEvidence.tsx", import.meta.url),
  "utf8",
);
const merge = readFileSync(
  new URL("../lib/homelabProbeMerge.ts", import.meta.url),
  "utf8",
);

test("the Access secondary-check outcome is displayed even without rolling diagnostics", () => {
  assert.match(evidence, /hasRollingEvidence && !hasAccessEvidence/);
  assert.match(evidence, /data-cloudflare-access-evidence/);
  assert.match(evidence, /cloudflare_access_secondary_probe_attempted/);
  assert.match(evidence, /access_protected_origin_unverified/);
  assert.match(evidence, /authenticated_origin_observed/);
});

test("probe merge retains bounded diagnostic fields, not arbitrary provider payload", () => {
  for (const key of [
    "cloudflare_access_secondary_probe_eligible",
    "cloudflare_access_secondary_probe_attempted",
    "public_probe_verification",
  ]) {
    assert.ok(merge.includes(`"${key}"`), `missing whitelisted field ${key}`);
  }
  assert.doesNotMatch(merge, /CF-Access-Client-Secret/);
});
