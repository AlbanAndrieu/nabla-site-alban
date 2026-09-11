import assert from "node:assert/strict";
import test from "node:test";
import {
	fastApiHealthBoardCacheTtlMs,
	loadFastApiHealthBoard,
	type FastApiHealthBoardSnapshot,
} from "../lib/fastApiHealthBoard";

function board(
	state: FastApiHealthBoardSnapshot["state"],
	refreshing = false,
): FastApiHealthBoardSnapshot {
	return {
		schema_version: 1,
		state,
		refreshing,
		generated_at: "2026-09-12T00:00:00Z",
		runtime: null,
		healthz: null,
		homelab: null,
		platform_metrics: null,
		sickz: null,
	};
}

test("health-board cache stays short and refresh-aware", () => {
	assert.equal(fastApiHealthBoardCacheTtlMs(board("fresh")), 5_000);
	assert.equal(fastApiHealthBoardCacheTtlMs(board("fresh", true)), 2_000);
	assert.equal(fastApiHealthBoardCacheTtlMs(board("pending")), 1_000);
	assert.equal(fastApiHealthBoardCacheTtlMs(board("stale")), 1_000);
	assert.equal(fastApiHealthBoardCacheTtlMs(null), 0);
});

test("concurrent health-board loads share one upstream request and reuse the short cache", async () => {
	const originalFetch = globalThis.fetch;
	const originalUrl = process.env.HOMELAB_HEALTH_BOARD_API_URL;
	const testUrl = `https://health-board-cache-${Date.now()}.example.invalid/api/health-board`;
	let calls = 0;

	process.env.HOMELAB_HEALTH_BOARD_API_URL = testUrl;
	globalThis.fetch = async (input) => {
		assert.equal(String(input), testUrl);
		calls += 1;
		await new Promise((resolve) => setTimeout(resolve, 5));
		return new Response(JSON.stringify(board("fresh")), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	};

	try {
		const [first, second] = await Promise.all([
			loadFastApiHealthBoard(),
			loadFastApiHealthBoard(),
		]);
		assert.equal(calls, 1);
		assert.equal(first.primaryUrl, testUrl);
		assert.equal(second.primaryUrl, testUrl);
		assert.equal(first.board?.state, "fresh");

		const cached = await loadFastApiHealthBoard();
		assert.equal(calls, 1);
		assert.equal(cached.board?.state, "fresh");
	} finally {
		globalThis.fetch = originalFetch;
		if (originalUrl === undefined) {
			delete process.env.HOMELAB_HEALTH_BOARD_API_URL;
		} else {
			process.env.HOMELAB_HEALTH_BOARD_API_URL = originalUrl;
		}
	}
});
