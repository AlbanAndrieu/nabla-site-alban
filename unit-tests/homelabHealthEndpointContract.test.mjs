import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
	new URL(
		"../app/components/homelab/homelabHealthFetchers.ts",
		import.meta.url,
	),
	"utf8",
);

test("health and probes retain separate routes with shared bounded transport", () => {
	assert.match(
		source,
		/fetchHealthEndpoint\("\/api\/homelab-health", signal, false\)/,
	);
	assert.match(
		source,
		/fetchHealthEndpoint\("\/api\/homelab-probes", signal, true\)/,
	);
	assert.match(source, /signal: boundedHomelabSignal\(signal\)/);
	assert.match(source, /cache: "no-store"/);
	assert.match(source, /"Cache-Control": "no-cache"/);
	assert.match(source, /Accept: "application\/json"/);
});

test("transport preserves owner boundary and unknown on failed requests", () => {
	assert.match(source, /response\.headers\.get\("X-Homelab-Health-Reason"\)/);
	assert.match(source, /reason: "owner-boundary" as const/);
	assert.match(
		source,
		/snapshot: parseHomelabHealthSnapshot\(await response\.json\(\)\)/,
	);
	assert.match(source, /return \{ snapshot: null, status: null \}/);
});
