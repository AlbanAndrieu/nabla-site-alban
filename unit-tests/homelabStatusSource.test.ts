import assert from "node:assert/strict";
import test from "node:test";
import { parseHomelabStatusSnapshot } from "../lib/homelabStatus";

const BASE_STATUS = {
	schemaVersion: 1,
	checkedAt: "2026-08-25T22:39:43Z",
	catalogRevision: "sha256:test",
	topologyVersion: 1,
	runtime: {
		provider: "truenas",
		observed_at: "2026-08-25T22:39:43Z",
		configured: true,
		reachable: true,
	},
	services: [
		{
			id: "litellm",
			name: "LiteLLM",
			declared: true,
			reconciliation: "in_sync",
		},
	],
	observedOnly: [],
};

test("homelab status parser accepts current and stale runtime snapshots", () => {
	assert.deepEqual(parseHomelabStatusSnapshot(BASE_STATUS), BASE_STATUS);

	const stale = {
		...BASE_STATUS,
		runtime: {
			...BASE_STATUS.runtime,
			stale: true,
			error: "temporary TrueNAS refresh failure",
		},
	};
	assert.deepEqual(parseHomelabStatusSnapshot(stale), stale);
});

test("homelab status parser rejects invalid stale and error fields", () => {
	assert.equal(
		parseHomelabStatusSnapshot({
			...BASE_STATUS,
			runtime: { ...BASE_STATUS.runtime, stale: "true" },
		}),
		null,
	);
	assert.equal(
		parseHomelabStatusSnapshot({
			...BASE_STATUS,
			runtime: { ...BASE_STATUS.runtime, error: 503 },
		}),
		null,
	);
});
