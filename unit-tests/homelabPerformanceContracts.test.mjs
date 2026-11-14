import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("service groups share indexed OWNER evidence instead of scanning per card", () => {
	const navigation = source("lib/homelabOwnerServiceNavigation.ts");
	const grid = source("app/components/homelab/HomelabServiceGrid.tsx");
	const block = source("app/components/homelab/HomelabServicesBlock.tsx");
	const architecture = source("app/[locale]/architecture/ArchitectureServiceHierarchy.tsx");

	assert.match(navigation, /export function indexOwnerNavigation\(/);
	assert.match(navigation, /const ownerIndex = index \?\? indexOwnerNavigation\(snapshot\)/);
	assert.doesNotMatch(navigation, /\.filter\(\(entry\) => entry\.id === id\)/);
	assert.doesNotMatch(navigation, /\.filter\(\(row\) => row\.id === entry\.id\)/);
	assert.match(grid, /ownerNavigationIndex \?\? indexOwnerNavigation\(snapshot\)/);
	for (const caller of [block, architecture]) {
		assert.match(caller, /ownerNavigationIndex=\{ownerNavigationIndex\}/);
		assert.match(caller, /ownerHealthIndex=/);
		assert.match(caller, /siteStatusIndex=/);
		assert.match(caller, /showRuntimeWarnings=\{index === 0\}/);
	}
});

test("only one visibility-aware resource clock exists for all TrueNAS groups", () => {
	const block = source("app/components/homelab/HomelabServicesBlock.tsx");
	const grid = source("app/components/homelab/HomelabServiceGrid.tsx");
	assert.match(block, /snapshotAgeState\(/);
	assert.match(block, /resourceStale=\{resourceStale\}/);
	assert.match(block, /document\.hidden/);
	assert.match(block, /document\.addEventListener\("visibilitychange", refresh\)/);
	assert.doesNotMatch(grid, /setInterval|setTimeout|snapshotAgeState\(/);
	assert.match(grid, /resourceStale = true/);
});

test("SERVICE mode cannot reuse a caller-provided OWNER snapshot or navigation index", () => {
	const grid = source("app/components/homelab/HomelabServiceGrid.tsx");
	assert.match(grid, /const snapshot = readOnly \|\| ownerBoundary \? null : rawSnapshot/);
	assert.match(grid, /readOnly \|\| ownerBoundary \? \[\] : resources\?\.services/);
	assert.match(grid, /snapshot=\{snapshot\}/);
	assert.match(grid, /siteHealthIndex\(siteHealth, catalog\.catalogRevision\)/);
	assert.match(grid, /siteHealth\?\.boardState === "fresh"/);
	assert.match(grid, /siteHealth\.catalogRevision === catalog\.catalogRevision/);
});

test("service group computation does not copy an expanding group for every service", () => {
	const presentation = source("lib/servicePresentation.ts");
	assert.match(presentation, /if \(items\) items\.push\(service\)/);
	assert.doesNotMatch(presentation, /grouped\.set\(group, \[\.\.\.\(grouped\.get/);
});
