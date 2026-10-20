import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/homelab-services/route";

test("public catalog endpoint fails closed without forwarding private revisions", async () => {
	const originalFetch = globalThis.fetch;
	let requests = 0;
	globalThis.fetch = (async () => {
		requests++;
		throw new Error("Private upstream must not be contacted");
	}) as typeof fetch;
	try {
		const response = await GET(
			new Request("https://www.albanandrieu.com/api/homelab-services", {
				headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "10.0.0.2" },
			}),
		);
		assert.equal(response.status, 404);
		assert.match(response.headers.get("cache-control") ?? "", /no-store/);
		assert.equal(response.headers.get("x-homelab-catalog-revision"), null);
		assert.equal(response.headers.get("x-homelab-services-source"), null);
		assert.equal(requests, 0);
		const body = await response.json();
		assert.equal(body.catalogRevision, undefined);
		assert.equal(body.topologyVersion, undefined);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
