import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("C4 and topology load ReactFlow only near the viewport", () => {
  const source = read("app/[locale]/architecture/ArchitectureTopologyView.tsx");
  assert.match(source, /dynamic\(\(\) => import\("\.\/C4ArchitectureView"\)/);
  assert.match(source, /dynamic\(\(\) => import\("\.\/HierarchicalArchitectureExplorer"\)/);
  assert.match(source, /rootMargin: "420px"/);
  assert.match(source, /aria-busy=\{!c4Ready\}/);
  assert.match(source, /aria-busy=\{!explorerReady\}/);
});
test("OWNER evidence is keyboard-expandable and each diagnostic phase stays labeled", () => {
  const source = read("app/components/homelab/ServiceOwnerEvidenceSummary.tsx");
  assert.match(source, /data-owner-diagnostic-timeline/);
  assert.match(source, /<summary>/);
  assert.match(source, /data-evidence-phase=\{metric\.key\}/);
  assert.match(source, /missing evidence means unknown/);
});

test("OWNER diagnostic phases identify DNS and API evidence gaps without fake green", () => {
  const source = read("app/components/homelab/ServiceOwnerEvidenceSummary.tsx");
  assert.match(source, /"catalog", "dns", "lan", "https", "http", "api"/);
  assert.match(source, /No service-level DNS evidence/);
  assert.match(source, /No dedicated API probe/);
  assert.match(source, /state: "unknown"/);
});

test("observer-less browsers reveal lazy graphs asynchronously and cancel on unmount", () => {
  const services = read("app/components/homelab/HomelabServicesBlock.tsx");
  const architecture = read("app/[locale]/architecture/ArchitectureTopologyView.tsx");

  assert.match(services, /if \(typeof IntersectionObserver === "undefined"\) \{/);
  assert.match(services, /window\.setTimeout\(\(\) => setGraphInView\(true\), 0\)/);
  assert.match(services, /return \(\) => window\.clearTimeout\(timer\)/);
  assert.doesNotMatch(services, /if \(typeof IntersectionObserver === "undefined"\) \{\s*setGraphInView\(/);
  assert.match(services, /rootMargin: "360px"/);

  assert.match(architecture, /if \(typeof IntersectionObserver === "undefined"\) \{/);
  assert.match(architecture, /window\.setTimeout\(\(\) => setReady\(true\), 0\)/);
  assert.match(architecture, /return \(\) => window\.clearTimeout\(timer\)/);
  assert.doesNotMatch(architecture, /if \(typeof IntersectionObserver === "undefined"\) \{\s*setReady\(/);
  assert.match(architecture, /rootMargin: "420px"/);
});

test("Architecture viewport readiness is state-only, never a ref-like return", () => {
  const source = read("app/[locale]/architecture/ArchitectureTopologyView.tsx");
  assert.match(source, /function useGraphNearViewport\(elementId: string\): boolean/);
  assert.match(source, /document\.getElementById\(elementId\)/);
  assert.match(source, /return ready;/);
  assert.match(source, /const c4Ready = useGraphNearViewport\("architecture-c4"\)/);
  assert.match(source, /const explorerReady = useGraphNearViewport\("service-architecture-explorer"\)/);
  assert.match(source, /aria-busy=\{!c4Ready\}/);
  assert.match(source, /aria-busy=\{!explorerReady\}/);
  assert.doesNotMatch(source, /return \{ (?:ref|setNode), ready \}/);
  assert.doesNotMatch(source, /\.current/);
});
