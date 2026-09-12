import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("same-origin observability route uses aggregate evidence first and conditional fallbacks", async () => {
	const route = await readFile(
		new URL("../app/api/homelab-observability/route.ts", import.meta.url),
		"utf8",
	);
	assert.match(route, /parseHomelabObservability/);
	assert.match(
		route,
		/parsed\.runtimeTopology \? Promise\.resolve\(null\) : loadRuntimeTopology\(\)/,
	);
	assert.match(
		route,
		/parsed\.diagnostics \? Promise\.resolve\(null\) : loadHomelabDiagnostics\(\)/,
	);
	assert.match(route, /X-Homelab-Runtime-Source/);
	assert.match(route, /X-Homelab-Diagnostics-Source/);
});

test("operations UI presents bounded metrics separately from functional health", async () => {
	const facade = await readFile(
		new URL(
			"../app/components/homelab/HomelabOperationalEvidence.tsx",
			import.meta.url,
		),
		"utf8",
	);
	const component = await readFile(
		new URL(
			"../app/components/homelab/HomelabOperationalMetrics.tsx",
			import.meta.url,
		),
		"utf8",
	);
	assert.match(facade, /HomelabOperationalMetrics/);
	assert.match(component, /data-platform-metrics/);
	assert.match(component, /PLATFORM_METRIC_LABEL_KEY/);
	assert.match(component, /metrics\.healthSeparation/);
	assert.doesNotMatch(component, /data-effective-health=.*platformMetrics/);
});
