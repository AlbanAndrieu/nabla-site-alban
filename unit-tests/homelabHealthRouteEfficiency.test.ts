import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/homelab-health/route";

const originalBoardUrl = process.env.HOMELAB_HEALTH_BOARD_API_URL;
const originalHealthUrl = process.env.HOMELAB_HEALTH_API_URL;
const originalProbesUrl = process.env.HOMELAB_PROBES_API_URL;

function restore(name: string, value: string | undefined) {
	if (value === undefined) delete process.env[name];
	else process.env[name] = value;
}

test("fresh cached health-board does not start aggregate or probe fallback requests", async () => {
	const suffix = Date.now();
	const boardUrl = `https://board-efficiency-${suffix}.example.invalid/api`;
	const aggregateUrl = `https://aggregate-efficiency-${suffix}.example.invalid/api`;
	const probesUrl = `https://probes-efficiency-${suffix}.example.invalid/api`;
	const originalFetch = globalThis.fetch;
	let boardCalls = 0;
	let aggregateCalls = 0;
	let probeCalls = 0;

	process.env.HOMELAB_HEALTH_BOARD_API_URL = boardUrl;
	process.env.HOMELAB_HEALTH_API_URL = aggregateUrl;
	process.env.HOMELAB_PROBES_API_URL = probesUrl;
	globalThis.fetch = (async (input) => {
		const url = String(input);
		if (url === boardUrl) {
			boardCalls += 1;
			return Response.json({
				schema_version: 1,
				state: "fresh",
				refreshing: false,
				generated_at: "2026-09-12T00:00:00Z",
				age_seconds: 1,
				error: null,
				runtime: null,
				healthz: null,
				homelab: {
					schema_version: 1,
					checked_at: "2026-09-12T00:00:00Z",
					services: [],
				},
				platform_metrics: null,
				sickz: null,
			});
		}
		if (url === aggregateUrl) {
			aggregateCalls += 1;
			return new Response("aggregate must not run", { status: 503 });
		}
		if (url === probesUrl) {
			probeCalls += 1;
			return new Response("probes must not run", { status: 503 });
		}
		return new Response(`unexpected ${url}`, { status: 503 });
	}) as typeof fetch;

	try {
		const response = await GET();
		assert.equal(response.status, 200);
		assert.equal(
			response.headers.get("x-homelab-health-source"),
			"fastapi-health-board",
		);
		assert.equal(boardCalls, 1);
		assert.equal(aggregateCalls, 0);
		assert.equal(probeCalls, 0);
	} finally {
		globalThis.fetch = originalFetch;
		restore("HOMELAB_HEALTH_BOARD_API_URL", originalBoardUrl);
		restore("HOMELAB_HEALTH_API_URL", originalHealthUrl);
		restore("HOMELAB_PROBES_API_URL", originalProbesUrl);
	}
});
