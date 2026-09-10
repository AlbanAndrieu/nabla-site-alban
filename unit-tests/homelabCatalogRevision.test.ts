import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/homelab-services/route";

const ORIGINAL_API_URL = process.env.HOMELAB_SERVICES_API_URL;
const ORIGINAL_FETCH = globalThis.fetch;

test.afterEach(() => {
	if (ORIGINAL_API_URL === undefined) {
		delete process.env.HOMELAB_SERVICES_API_URL;
	} else {
		process.env.HOMELAB_SERVICES_API_URL = ORIGINAL_API_URL;
	}
	globalThis.fetch = ORIGINAL_FETCH;
});

test("homelab catalog proxy exposes the canonical catalog revision", async () => {
	process.env.HOMELAB_SERVICES_API_URL =
		"https://catalog.example.test/services";
	globalThis.fetch = (async () =>
		Response.json({
			version: 1,
			catalogRevision: "sha256:canonical-test",
			topologyVersion: 1,
			services: [{ id: "truenas", name: "TrueNAS" }],
		})) as typeof fetch;

	const response = await GET();
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.equal(response.headers.get("x-homelab-services-source"), "fastapi");
	assert.equal(
		response.headers.get("x-homelab-catalog-revision"),
		"sha256:canonical-test",
	);
	assert.equal(body.catalogRevision, "sha256:canonical-test");
	assert.equal(body.topologyVersion, 1);
});
