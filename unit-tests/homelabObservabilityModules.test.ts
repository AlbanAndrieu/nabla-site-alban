import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("homelab observability facade delegates cohesive parsing responsibilities", async () => {
	const [facade, deepDiagnostics, platformMetrics, controlPlane, fallbacks] =
		await Promise.all([
			source("lib/homelabObservability.ts"),
			source("lib/homelabObservabilityDeepDiagnostics.ts"),
			source("lib/homelabObservabilityPlatformMetrics.ts"),
			source("lib/homelabObservabilityControlPlane.ts"),
			source("lib/homelabObservabilityFallbacks.ts"),
		]);

	assert.match(facade, /parseDeepDiagnostics/);
	assert.match(facade, /parsePlatformMetrics/);
	assert.match(facade, /parseControlPlaneDiagnostics/);
	assert.match(facade, /withObservabilityFallbacks/);
	assert.doesNotMatch(facade, /function parseDeepDiagnostics/);
	assert.doesNotMatch(facade, /function parsePlatformMetrics/);
	assert.doesNotMatch(facade, /function withObservabilityFallbacks/);
	assert.match(deepDiagnostics, /function parseDeepDiagnostics/);
	assert.match(platformMetrics, /function parsePlatformMetrics/);
	assert.match(controlPlane, /function parseControlPlaneDiagnostics/);
	assert.match(fallbacks, /function withObservabilityFallbacks/);
});
