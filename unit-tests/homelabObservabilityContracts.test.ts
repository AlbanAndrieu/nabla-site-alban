import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public observability route never proxies diagnostic or runtime topology", async () => {
	const route = await readFile(
		new URL("../app/api/homelab-observability/route.ts", import.meta.url),
		"utf8",
	);
	const privateResponse = await readFile(
		new URL("../lib/privateHomelabResponse.ts", import.meta.url),
		"utf8",
	);
	assert.match(route, /privateHomelabResponse/);
	assert.doesNotMatch(
		route,
		/parseHomelabObservability|loadRuntimeTopology|loadHomelabDiagnostics/,
	);
	assert.match(privateResponse, /status: 404/);
	assert.match(privateResponse, /no-store/);
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
