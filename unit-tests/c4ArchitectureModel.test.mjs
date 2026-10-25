import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { projectC4Topology } from "../app/[locale]/architecture/c4ArchitectureModel.ts";

const sample = {
  catalogRevision: "sha:test",
  nodes: [
    { id: "fastapi", name: "FastAPI", kind: "API", category: "app", url: "http://172.17.0.24", description: "secret" },
    { id: "truenas", name: "TrueNAS", kind: "storage", category: "platform", internalUrl: "http://172.17.0.24" },
    { id: "bad_ID", name: "Invalid", kind: "invalid", category: "test" },
  ],
  relations: [{ source: "fastapi", target: "truenas", type: "consumesApi" }],
};

test("C4 L1 shows actors and external systems, not health probes", () => {
  const view = projectC4Topology(sample, "context");
  assert.ok(view.nodes.some((n) => n.role === "person"));
  assert.ok(view.nodes.some((n) => n.role === "system"));
  assert.ok(view.nodes.some((n) => n.role === "external"));
  assert.equal(view.revision, "sha:test");
});

test("C4 L2 uses only validated canonical topology identities and real relations", () => {
  const view = projectC4Topology(sample, "containers");
  assert.deepEqual(view.nodes.map((x) => x.id), ["fastapi", "truenas"]);
  assert.deepEqual(view.links.map((x) => [x.source, x.target]), [["fastapi", "truenas"]]);
});

test("C4 cannot copy private origins or arbitrary evidence into its diagram", () => {
  const result = JSON.stringify(projectC4Topology(sample, "containers"));
  assert.ok(!result.includes("172.17."));
  assert.ok(!result.includes("secret"));
});

test("C4 L2 has a strict size bound and deterministic order", () => {
  const topology = { nodes: Array.from({ length: 60 }, (_, i) => ({ id: "app-" + i, name: "App " + i, kind: "app", category: "app" })), relations: [] };
  const result = projectC4Topology(topology, "containers");
  assert.equal(result.nodes.length, 16);
  assert.equal(result.omitted, 44);
  assert.deepEqual(result, projectC4Topology(topology, "containers"));
});

test("C4 view reuses React Flow with keyboard switches and accessible text", () => {
  const component = readFileSync(new URL("../app/[locale]/architecture/C4ArchitectureView.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/[locale]/architecture/ArchitectureTopologyView.tsx", import.meta.url), "utf8");
  assert.match(component, /from "@xyflow\/react"/);
  assert.match(component, /aria-pressed=\{level === "context"\}/);
  assert.match(component, /<details className=\{styles\.alternative\}>/);
  assert.doesNotMatch(component, /<iframe|dangerouslySetInnerHTML/);
  assert.match(page, /<C4ArchitectureView locale=\{locale\} topology=\{topology\} readOnly=\{readOnly\}/);
});

test("C4 node drilldown lists only declared adjacent relationships", async () => {
  const { c4NodeRelations } = await import("../app/[locale]/architecture/c4ArchitectureModel.ts");
  const view = projectC4Topology(sample, "containers");
  assert.equal(c4NodeRelations(view, "fastapi").length, 1);
  assert.equal(c4NodeRelations(view, "truenas").length, 1);
  assert.deepEqual(c4NodeRelations(view, "unknown"), []);
});

test("C4 focus/selection and dependent navigation are keyboard-accessible", () => {
  const component = readFileSync(new URL("../app/[locale]/architecture/C4ArchitectureView.tsx", import.meta.url), "utf8");
  assert.match(component, /onNodeClick=\{\(_, node\) => setSelectedId\(node\.id\)\}/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /setSelectedId\(other\)/);
  assert.match(component, /role="region"/);
});
