import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";

const source = (path) =>
	readFileSync(new URL("../" + path, import.meta.url), "utf8");
const policySource = source("lib/homelabSlowApiPolicy.ts");
const code = stripTypeScriptTypes(policySource, { mode: "transform" });
const policy = await import(
	"data:text/javascript;base64," + Buffer.from(code).toString("base64")
);

test("frozen APIs get a bounded deadline and predictable retry backoff", () => {
	assert.equal(policy.HOMELAB_REQUEST_DEADLINE_MS, 8000);
	assert.equal(policy.homelabRetryDelayMs(0), 30000);
	assert.equal(policy.homelabRetryDelayMs(1), 60000);
	assert.equal(policy.homelabRetryDelayMs(2), 120000);
	assert.equal(policy.homelabRetryDelayMs(3), 240000);
	assert.equal(policy.homelabRetryDelayMs(500), 240000);
	assert.equal(policy.homelabRetryDelayMs(NaN), 30000);
	const controller = new AbortController();
	const signal = policy.boundedHomelabSignal(controller.signal);
	assert.equal(signal.aborted, false);
	controller.abort();
	assert.equal(signal.aborted, true);
});

test("slow API requests are bounded in service cards and Architecture without OWNER persistence", () => {
	const health = source("app/components/homelab/useHomelabHealth.ts");
	const architecture = source(
		"app/[locale]/architecture/ArchitecturePrivateViews.tsx",
	);
	const polling = source(
		"app/[locale]/architecture/useArchitectureHealthPolling.ts",
	);
	const cache = source("lib/homelabPublicBrowserCache.ts");
	for (const sourceCode of [health, architecture, polling]) {
		assert.match(sourceCode, /boundedHomelabSignal\(/);
	}
	assert.match(health, /nextHealthAttemptAt/);
	assert.match(health, /homelabRetryDelayMs\(consecutiveHealthFailures\)/);
	assert.match(
		health,
		/readStalePublicHealthCache\(\s*publicStorage,\s*activeCatalogRevision,?\s*\)/,
	);
	assert.match(polling, /setHealth\(null\)/);
	assert.match(polling, /setSiteHealth\(null\)/);
	assert.doesNotMatch(polling, /HEALTH_POLL_REFRESHING_MS = 2_000/);
	assert.match(architecture, /readPublicCatalogCache\(publicStorage\)/);
	assert.match(architecture, /data-architecture-public-cache-stale/);
	assert.match(
		architecture,
		/if \(denied && publicStorage\)\s*clearPublicHomelabBrowserCache/,
	);
	assert.match(architecture, /ownerAuthorized\) return null/);
	assert.match(architecture, /relations: \[\]/);
	assert.match(cache, /const CATALOG_TTL_MS = 24 \* 60 \* 60_000/);
	assert.match(cache, /const HEALTH_TTL_MS = 2 \* 60_000/);
	assert.match(cache, /state: "unknown"/);
});
