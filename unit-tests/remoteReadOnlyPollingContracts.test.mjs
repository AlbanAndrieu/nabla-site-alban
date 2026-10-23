import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("remote service cards use v2 health without requesting OWNER probes", () => {
	const gate = source("app/components/homelab/HomelabPrivateServices.tsx");
	const block = source("app/components/homelab/HomelabServicesBlock.tsx");
	const hook = source("app/components/homelab/useHomelabHealth.ts");
	assert.match(gate, /<HomelabServicesBlock readOnly\s*\/>/);
	assert.match(block, /useHomelabHealth\(readOnly\)/);
	assert.match(block, /!readOnly && \(\s*<>\s*<HomelabObservationCoverage/);
	assert.match(block, /!readOnly && \(\s*<HomelabStatusOverview/);
	assert.match(hook, /if \(readOnly\) \{/);
	assert.match(hook, /fetch\("\/api\/homelab-health-v2"/);
	const readonlyBranch = hook.indexOf("if (readOnly) {");
	const ownerProbes = hook.indexOf("const probesPromise = fetchProbeHealth(signal)");
	assert.ok(readonlyBranch > 0 && ownerProbes > readonlyBranch);
	assert.match(hook.slice(readonlyBranch, ownerProbes), /return;\s*}/);
});

test("remote architecture uses the v2 read model and never polls OWNER runtime", () => {
	const view = source("app/[locale]/architecture/ArchitecturePrivateViews.tsx");
	const graph = source("app/[locale]/architecture/ArchitectureTopologyView.tsx");
	const poll = source("app/[locale]/architecture/useArchitectureHealthPolling.ts");
	const runtime = source("app/[locale]/architecture/useArchitectureRuntimeStatus.ts");
	assert.match(view, /<ArchitectureTopologyView\s+readOnly/);
	assert.match(graph, /useArchitectureHealthPolling\(readOnly\)/);
	assert.match(graph, /indexHealth\(health, siteHealth, catalog.catalogRevision\)/);
	assert.match(poll, /readOnly \? "\/api\/homelab-health-v2" : "\/api\/homelab-health"/);
	assert.match(poll, /parseSiteHealthV2\(await response.json\(\)\)/);
	assert.match(runtime, /if \(readOnly\) \{/);
	assert.match(runtime, /if \(readOnly\) \{[\s\S]*?return;/);
	assert.match(runtime, /runtimeStatus: readOnly \? null : runtimeStatus/);
});

test("owner-only status is not published via v2 read-only response", () => {
	const access = source("lib/remoteHomelabReadOnly.ts");
	assert.match(access, /PUBLIC_READONLY_PATHS/);
	for (const blocked of ["homelab-probes", "homelab-observability", "runtime-topology"]) {
		assert.doesNotMatch(access, new RegExp(`"\\/api\\/${blocked}"`));
	}
	const view = source("app/[locale]/architecture/ArchitecturePrivateViews.tsx");
	assert.match(view, /access === "readonly"/);
	assert.match(view, /<ArchitectureTopologyView/);
});

test("architecture public and OWNER views bind the correct readOnly flag", () => {
	const view = source("app/[locale]/architecture/ArchitecturePrivateViews.tsx");
	const publicStart = view.indexOf('if (access === "readonly")');
	const ownerStart = view.indexOf('<div data-homelab-private-view>', publicStart);
	assert.ok(publicStart >= 0 && ownerStart > publicStart);
	const publicView = view.slice(publicStart, ownerStart);
	const ownerView = view.slice(ownerStart);
	assert.match(publicView, /<ArchitectureTopologyView\s+readOnly\b/);
	assert.doesNotMatch(ownerView, /<ArchitectureTopologyView\s+readOnly\b/);
	assert.equal((publicView.match(/<ArchitectureTopologyView\b/g) ?? []).length, 1);
	assert.equal((ownerView.match(/<ArchitectureTopologyView\b/g) ?? []).length, 1);
});

test("mode transitions mask previously fetched OWNER snapshots synchronously", () => {
	const architecture = source("app/[locale]/architecture/useArchitectureHealthPolling.ts");
	assert.match(architecture, /const visibleHealth = readOnly \? null : health;/);
	assert.match(architecture, /const visibleSiteHealth = readOnly \? siteHealth : null;/);
	assert.match(architecture, /health: visibleHealth,/);
	assert.match(architecture, /siteHealth: visibleSiteHealth,/);

	const truenas = source("app/components/homelab/useHomelabHealth.ts");
	const publicResult = truenas.slice(truenas.lastIndexOf("if (readOnly) {"));
	assert.match(publicResult, /snapshot: null,/);
	assert.match(publicResult, /ownerBoundary: false,/);
	assert.match(publicResult, /healthStatus: null,/);
});
