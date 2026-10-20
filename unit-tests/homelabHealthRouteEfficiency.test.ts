import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/homelab-health/route";

test("public health route does not start board, aggregate or probe requests", async () => {
	const originalFetch = globalThis.fetch;
	let calls = 0;
	globalThis.fetch = (async () => {
		calls++;
		throw new Error("Private health must not be fetched");
	}) as typeof fetch;
	try {
		const response = await GET(
			new Request("https://www.albanandrieu.com/api/homelab-health", {
				headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "10.0.0.2" },
			}),
		);
		assert.equal(response.status, 404);
		assert.match(response.headers.get("cache-control") ?? "", /no-store/);
		assert.equal(response.headers.get("x-homelab-health-source"), null);
		assert.equal(calls, 0);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
