import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
	OWNER_BOUNDARY_REASON,
	ownerUpstreamBlocked,
} from "../lib/homelabOwnerBoundary";

test("SERVER owner boundary never equates SERVICE credentials with OWNER", () => {
	assert.equal(ownerUpstreamBlocked("production", undefined), true);
	assert.equal(ownerUpstreamBlocked("preview", "false"), true);
	assert.equal(ownerUpstreamBlocked("production", "true"), false);
	assert.equal(ownerUpstreamBlocked(undefined, undefined), false);
	assert.equal(OWNER_BOUNDARY_REASON, "owner-boundary");
});

test("owner proxy routes retain the owner gate and no-store boundary status", () => {
	for (const route of ["health", "probes"]) {
		const source = readFileSync(
			new URL(`../app/api/homelab-${route}/route.ts`, import.meta.url),
			"utf8",
		);
		assert.match(source, /ownerUpstreamBlocked\(/);
		assert.match(source, /X-Homelab-Health-Reason/);
		assert.match(source, /private, no-store/);
		assert.match(source, /gatedHomelabResponse\(request,/);
	}
});

test("browser preserves SERVICE v2 polling after identifying the OWNER boundary", () => {
	const source = readFileSync(
		new URL("../app/components/homelab/useHomelabHealth.ts", import.meta.url),
		"utf8",
	);
	assert.match(source, /if \(ownerUpstreamBlocked\)/);
	assert.match(source, /aggregate\.reason === "owner-boundary"/);
	assert.match(source, /probes\.reason === "owner-boundary"/);
	assert.match(source, /fetch\("\/api\/homelab-health-v2"/);
});
