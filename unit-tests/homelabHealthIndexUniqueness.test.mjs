import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalHomelabEvidence, uniqueHomelabEvidenceIndex } from "../lib/homelabHealthIdentity.ts";

const entry = (id, name = id, url = `https://example.test/${id}`) => ({ id, name, url });

test("unique observations resolve by canonical ID, normalized name and URL", () => {
  const first = entry("grafana", "Grafana", "https://example.test/grafana#panel");
  const result = uniqueHomelabEvidenceIndex([first]);
  assert.equal(result.byId.get("grafana"), first);
  assert.equal(result.byName.get("grafana"), first);
  assert.equal(result.byUrl.get("https://example.test/grafana"), first);
  assert.equal(result.ambiguousIds.size, 0);
});

test("duplicated IDs are rejected even if names and endpoints differ", () => {
  const results = uniqueHomelabEvidenceIndex([
    entry("grafana", "Grafana primary", "https://example.test/one"),
    entry("grafana", "Grafana secondary", "https://example.test/two"),
    entry("grafana", "Grafana third", "https://example.test/three"),
  ]);
  assert.equal(results.byId.has("grafana"), false);
  assert.equal(results.ambiguousIds.has("grafana"), true);
});

test("duplicate names or URLs never select the last observation", () => {
  const a = entry("first", "Shared", "https://example.test/shared#one");
  const b = entry("second", " shared ", "https://example.test/shared#two");
  const index = uniqueHomelabEvidenceIndex([a, b]);
  assert.equal(index.byName.has("shared"), false);
  assert.equal(index.byUrl.has("https://example.test/shared"), false);
  assert.equal(index.byId.get("first"), a);
  assert.equal(index.byId.get("second"), b);
});

test("invalid URLs cannot become lookup keys", () => {
  const index = uniqueHomelabEvidenceIndex([entry("service", "Service", "not a URL")]);
  assert.equal(index.byUrl.size, 0);
});

test("cards and counts join probes exclusively by canonical service ID", () => {
  const grid = readFileSync(new URL("../app/components/homelab/homelabGridPresentation.ts", import.meta.url), "utf8");
  const selectors = readFileSync(new URL("../app/components/homelab/homelabHealthSelectors.ts", import.meta.url), "utf8");
  const hook = readFileSync(new URL("../app/components/homelab/useHomelabHealth.ts", import.meta.url), "utf8");
  assert.match(grid, /canonicalHomelabEvidence\(index, homelabServiceId\(service\)\)/);
  assert.match(selectors, /canonicalHomelabEvidence\(index, serviceId\)/);
  assert.match(hook, /from "\.\/homelabHealthSelectors"/);
  assert.doesNotMatch(grid, /index\.byUrl\.get\(|index\.byName\.get\(/);
  assert.doesNotMatch(hook, /index\.byName\.get\(/);
});

test("matching URL and name never attach evidence from another service", () => {
  const evidence = entry("other-service", "Grafana", "https://example.test/grafana");
  const index = uniqueHomelabEvidenceIndex([evidence]);
  assert.equal(canonicalHomelabEvidence(index, "grafana"), undefined);
  assert.equal(canonicalHomelabEvidence(index, "other-service"), evidence);
});

test("ambiguous canonical IDs have no selected probe", () => {
  const index = uniqueHomelabEvidenceIndex([entry("grafana", "Primary"), entry("grafana", "Secondary")]);
  assert.equal(canonicalHomelabEvidence(index, "grafana"), undefined);
});
