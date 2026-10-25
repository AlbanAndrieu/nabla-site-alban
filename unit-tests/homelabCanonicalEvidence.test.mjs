import assert from "node:assert/strict";
import test from "node:test";
import { canonicalHomelabEvidence, uniqueHomelabEvidenceIndex } from "../lib/homelabHealthIdentity.ts";
import { projectC4Topology } from "../app/[locale]/architecture/c4ArchitectureModel.ts";

const entry = (id, name, url = "https://example.test/shared") => ({ id, name, url });

test("canonical ID accepts only the matching, unique service probe", () => {
  const grafana = entry("grafana", "Grafana");
  const index = uniqueHomelabEvidenceIndex([grafana]);
  assert.equal(canonicalHomelabEvidence(index, "grafana"), grafana);
  assert.equal(canonicalHomelabEvidence(index, "other"), undefined);
});

test("matching name and URL cannot substitute a mismatched service ID", () => {
  const index = uniqueHomelabEvidenceIndex([entry("other", "Grafana")]);
  assert.equal(index.byName.has("grafana"), true);
  assert.equal(index.byUrl.size, 1);
  assert.equal(canonicalHomelabEvidence(index, "grafana"), undefined);
});

test("duplicate canonical IDs fail closed despite distinct URLs", () => {
  const index = uniqueHomelabEvidenceIndex([
    entry("grafana", "Primary", "https://example.test/a"),
    entry("grafana", "Secondary", "https://example.test/b"),
  ]);
  assert.equal(canonicalHomelabEvidence(index, "grafana"), undefined);
  assert.equal(index.ambiguousIds.has("grafana"), true);
});

test("C4 public projection rejects private names and unknown relation types", () => {
  const result = projectC4Topology({
    nodes: [
      { id: "grafana", name: "Grafana", kind: "dashboard", category: "observability" },
      { id: "secrets", name: "http://172.17.0.24:10443", kind: "secret", category: "private" },
      { id: "prometheus", name: "Prometheus", kind: "metrics", category: "observability" },
    ],
    relations: [
      { source: "grafana", target: "prometheus", type: "consumesApi" },
      { source: "grafana", target: "prometheus", type: "token=private" },
    ],
  }, "containers");
  assert.deepEqual(result.nodes.map((node) => node.id), ["grafana", "prometheus"]);
  assert.deepEqual(result.links.map((link) => link.label), ["consumesApi"]);
  assert.doesNotMatch(JSON.stringify(result), /172\.17\.|token=private/);
});

test("C4 falls back to a neutral role when metadata is unsafe", () => {
  const result = projectC4Topology({
    nodes: [{ id: "grafana", name: "Grafana", kind: "token=private", category: "http://internal" }],
    relations: [],
  }, "containers");
  assert.equal(result.nodes[0]?.description, "Service");
});
