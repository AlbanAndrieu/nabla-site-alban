import assert from "node:assert/strict";
import test from "node:test";
import { loadFastApiHealthBoard } from "../lib/fastApiHealthBoard";
import {
	loadHomelabHealthSnapshot,
	loadHomelabProbeSnapshot,
} from "../lib/homelabHealthTransport";

test("Vercel never attempts OWNER-only upstream requests by default", async () => {
	const oldVercelEnv = process.env.VERCEL_ENV;
	const oldOverride = process.env.HOMELAB_OWNER_RAW_UPSTREAM_ENABLED;
	const oldDiagnosticsKey = process.env.DIAGNOSTICS_ACCESS_KEY;
	const originalFetch = globalThis.fetch;
	let calls = 0;
	try {
		process.env.VERCEL_ENV = "production";
		delete process.env.HOMELAB_OWNER_RAW_UPSTREAM_ENABLED;
		delete process.env.DIAGNOSTICS_ACCESS_KEY;
		globalThis.fetch = (async () => {
			calls += 1;
			throw new Error("No OWNER fetch should occur from Vercel");
		}) as typeof fetch;
		const board = await loadFastApiHealthBoard();
		const aggregate = await loadHomelabHealthSnapshot();
		const probes = await loadHomelabProbeSnapshot();
		assert.equal(board.board, null);
		assert.equal(board.error, "owner-upstream-disabled");
		assert.equal(aggregate.snapshot, null);
		assert.equal(probes.snapshot, null);
		assert.equal(calls, 0);
	} finally {
		globalThis.fetch = originalFetch;
		if (oldVercelEnv === undefined) delete process.env.VERCEL_ENV;
		else process.env.VERCEL_ENV = oldVercelEnv;
		if (oldOverride === undefined)
			delete process.env.HOMELAB_OWNER_RAW_UPSTREAM_ENABLED;
		else process.env.HOMELAB_OWNER_RAW_UPSTREAM_ENABLED = oldOverride;
		if (oldDiagnosticsKey === undefined) delete process.env.DIAGNOSTICS_ACCESS_KEY;
		else process.env.DIAGNOSTICS_ACCESS_KEY = oldDiagnosticsKey;
	}
});
