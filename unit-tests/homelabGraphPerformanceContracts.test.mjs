import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("C4 and topology load ReactFlow only near the viewport", () => {
  const source = read("app/[locale]/architecture/ArchitectureTopologyView.tsx");
  assert.match(source, /dynamic\(\(\) => import\("\.\/C4ArchitectureView"\)/);
  assert.match(source, /dynamic\(\(\) => import\("\.\/HierarchicalArchitectureExplorer"\)/);
  assert.match(source, /rootMargin: "420px"/);
  assert.match(source, /aria-busy=\{!c4Viewport\.ready\}/);
  assert.match(source, /aria-busy=\{!explorerViewport\.ready\}/);
});
test("OWNER evidence is keyboard-expandable and each diagnostic phase stays labeled", () => {
  const source = read("app/components/homelab/ServiceOwnerEvidenceSummary.tsx");
  assert.match(source, /data-owner-diagnostic-timeline/);
  assert.match(source, /<summary>/);
  assert.match(source, /data-evidence-phase=\{metric\.key\}/);
  assert.match(source, /missing evidence means unknown/);
});
