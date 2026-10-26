import assert from "node:assert/strict";
import test from "node:test";
import {
  displayResourceBytes,
  parseResourceSnapshot,
  parseResourceSnapshotFile,
  snapshotAgeState,
} from "../lib/homelabResourceEvidence.ts";
import { readFileSync } from "node:fs";

const now = "2026-10-26T22:20:00Z";
const fixture = () => ({
  schema: "nabla-service-resources/v1",
  observed_at_utc: now,
  catalog_revision: "sha256:catalog",
  source_host: "truenas",
  services: [{
    entityRef: "component:default/defectdojo",
    memory: { status:"observed", working_set_bytes: 512 * 1024 ** 2 },
    gpu: { status:"unverified", process_memory_bytes:null },
    storage: {
      writable_layer_status:"observed",
      writable_layer_bytes: 0,
      datasets_status:"observed",
      datasets:[{name:"cpool/defectdojo", used_bytes_including_children:1024 * 1024 ** 3, shared_by_services:false}],
    },
    secret: "DO_NOT_FORWARD",
    observed_containers: ["runtime-name"],
  }],
  upstreamSecret: "DO_NOT_FORWARD",
});

test("imports only whitelisted private resource fields", () => {
  const parsed = parseResourceSnapshot(fixture());
  assert.ok(parsed);
  assert.equal(parsed.services.length, 1);
  assert.equal(parsed.services[0].memory.working_set_bytes, 512 * 1024 ** 2);
  assert.equal(parsed.services[0].gpu.process_memory_bytes, null);
  assert.equal(parsed.services[0].storage.writable_layer_bytes, 0);
  assert.doesNotMatch(JSON.stringify(parsed), /DO_NOT_FORWARD|runtime-name/);
});

test("optional CPU percent is accepted and never inferred from absent evidence", () => {
  const payload = fixture();
  payload.services[0].cpu = {
    status: "observed", usage_pct: 174.25, units: "percent_of_one_core",
  };
  const measured = parseResourceSnapshot(payload);
  assert.ok(measured);
  assert.equal(measured.services[0].cpu.usage_pct, 174.25);
  const old = fixture();
  const legacy = parseResourceSnapshot(old);
  assert.ok(legacy);
  assert.equal(legacy.services[0].cpu, undefined);
  const invalid = fixture();
  invalid.services[0].cpu = {
    status: "observed", usage_pct: -10, units: "percent_of_one_core",
  };
  assert.equal(parseResourceSnapshot(invalid), null);
});

test("GPU unavailable and memory absent are not rendered as zero", () => {
  const original = fixture();
  original.services[0].memory = {status: "unverified", working_set_bytes: null};
  const parsed = parseResourceSnapshot(original);
  assert.ok(parsed);
  assert.equal(parsed.services[0].memory.working_set_bytes, null);
  assert.equal(displayResourceBytes(null), "—");
  assert.equal(displayResourceBytes(1024 ** 3), "1.0 GiB");
  assert.equal(displayResourceBytes(0), "0 B");
});

test("duplicate entityRefs, invalid bytes and future timestamps are refused", () => {
  const duplicate = fixture();
  duplicate.services.push({...duplicate.services[0]});
  assert.equal(parseResourceSnapshot(duplicate), null);
  const negative = fixture();
  negative.services[0].memory.working_set_bytes = -5;
  assert.equal(parseResourceSnapshot(negative), null);
  const future = fixture();
  future.observed_at_utc = "9999-10-26T22:20:00Z";
  assert.equal(parseResourceSnapshot(future), null);
});

test("shared datasets retain warning and no sum across services", () => {
  const payload = fixture();
  payload.services[0].storage.datasets[0].shared_by_services = true;
  const parsed = parseResourceSnapshot(payload);
  assert.ok(parsed);
  assert.equal(parsed.services[0].storage.datasets[0].shared_by_services, true);
  assert.equal(parsed.services[0].storage.datasets[0].used_bytes_including_children, 1024 ** 3);
});

test("staleness and catalog mismatch stay distinct", () => {
  const parsed = parseResourceSnapshot(fixture());
  assert.ok(parsed);
  const t = Date.parse(now);
  assert.equal(snapshotAgeState(parsed, t + 10_000, "sha256:catalog"), "fresh");
  assert.equal(snapshotAgeState(parsed, t + 31 * 60_000, "sha256:catalog"), "stale");
  assert.equal(snapshotAgeState(parsed, t + 10_000, "different"), "revision-mismatch");
});

test("oversized or malformed JSON is refused without throwing", () => {
  assert.equal(parseResourceSnapshotFile("{invalid"), null);
  assert.equal(parseResourceSnapshotFile("x".repeat(750_001)), null);
});

test("private UI contract does not auto-fetch or expose snapshot to public SERVICE", () => {
  const root = new URL("../app/components/homelab/", import.meta.url);
  const importer = readFileSync(new URL("HomelabResourceSnapshotImport.tsx", root), "utf8");
  const grid = readFileSync(new URL("HomelabServiceGrid.tsx", root), "utf8");
  const card = readFileSync(new URL("HomelabServiceCard.tsx", root), "utf8");
  assert.match(importer, /ownerAllowed/);
  assert.match(importer, /localStorage/);
  assert.doesNotMatch(importer, /fetch\(/);
  assert.match(grid, /!readOnly && !ownerBoundary/);
  assert.match(card, /!readOnly && resource/);
});
