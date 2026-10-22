import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
	OWNER_BOUNDARY_REASON,
	ownerDiagnosticHeaders,
	ownerUpstreamBlocked,
} from "../lib/homelabOwnerBoundary";

test("SERVER owner boundary never equates SERVICE credentials with OWNER", () => {
	assert.equal(ownerUpstreamBlocked("production", undefined), true);
	assert.equal(ownerUpstreamBlocked("production", undefined, "server-secret"), false);
	assert.equal(ownerUpstreamBlocked("production", "false", "server-secret"), true);
	assert.equal(ownerUpstreamBlocked("preview", "false"), true);
	assert.equal(ownerUpstreamBlocked("production", "true", "server-secret"), false);
	assert.equal(ownerUpstreamBlocked(undefined, undefined), false);
	assert.equal(OWNER_BOUNDARY_REASON, "owner-boundary");
	assert.deepEqual(ownerDiagnosticHeaders("server-secret"), {
		"X-Diagnostics-Key": "server-secret",
	});
	assert.deepEqual(ownerDiagnosticHeaders(undefined), {});
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

test("OWNER upstream readers keep access boundaries and server-only credentials", () => {
	for (const sourcePath of [
		"lib/fastApiHealthBoard.ts",
		"lib/homelabHealthTransport.ts",
		"lib/homelabDiagnostics.ts",
		"lib/runtimeTopology.ts",
	]) {
		const source = readFileSync(new URL(`../${sourcePath}`, import.meta.url), "utf8");
		assert.match(source, /ownerUpstreamBlocked\(/, sourcePath);
		assert.match(
			source,
			/ownerDiagnosticHeaders\(process\.env\.DIAGNOSTICS_ACCESS_KEY\)/,
			sourcePath,
		);
		assert.match(source, /redirect: "error"/, sourcePath);
	}
});
