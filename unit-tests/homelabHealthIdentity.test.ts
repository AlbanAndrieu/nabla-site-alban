import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compatibleHomelabEvidence } from "../lib/homelabHealthIdentity";

const ownerEvidence = { id: "api", state: "ok", source: "owner-probes" };

test("Backstage cards reject name/URL-only observations from a different identity", () => {
	assert.equal(
		compatibleHomelabEvidence(
			"component:edge/api",
			"component-edge-api",
			ownerEvidence,
		),
		undefined,
	);
	assert.equal(
		compatibleHomelabEvidence("component:default/api", "api", { state: "ok" }),
		undefined,
	);
});

test("exact owner ID matches remain eligible for enrichment", () => {
	assert.equal(
		compatibleHomelabEvidence("component:default/api", "api", ownerEvidence),
		ownerEvidence,
	);
});

test("legacy cards and absent snapshots retain their current behavior", () => {
	assert.equal(
		compatibleHomelabEvidence(undefined, "api", ownerEvidence),
		ownerEvidence,
	);
	assert.equal(
		compatibleHomelabEvidence("component:default/api", "api", undefined),
		undefined,
	);
});

test("both service-card and health-summary paths apply canonical identity checks", () => {
	const grid = readFileSync(
		new URL(
			"../app/components/homelab/homelabGridPresentation.ts",
			import.meta.url,
		),
		"utf8",
	);
	const hook = readFileSync(
		new URL("../app/components/homelab/useHomelabHealth.ts", import.meta.url),
		"utf8",
	);
	assert.match(grid, /const generic = compatibleHomelabEvidence\(/);
	assert.match(hook, /const entry = compatibleHomelabEvidence\(/);
});
