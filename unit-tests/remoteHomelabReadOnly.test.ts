import assert from "node:assert/strict";
import { test } from "node:test";
import { GET as probeAccess } from "../app/api/homelab-access/route";
import { gatedHomelabResponse } from "../lib/privateHomelabResponse";
import {
	allowPublicHomelabProjection,
	publicRemoteReadOnlyEnabled,
} from "../lib/remoteHomelabReadOnly";

const outside = "https://www.albanandrieu.com";

test("only sanitized v2 read endpoints qualify for temporary public access", () => {
	const on = { HOMELAB_PUBLIC_READONLY_ENABLED: "true" };
	for (const path of [
		"/api/homelab-services",
		"/api/homelab-catalog-v2",
		"/api/homelab-health-v2",
	]) {
		assert.equal(allowPublicHomelabProjection(new Request(outside + path), on), true);
	}
	for (const path of [
		"/api/homelab-status",
		"/api/homelab-health",
		"/api/homelab-observability",
		"/api/homelab-probes",
		"/api/homelab-topology",
		"/api/runtime-topology",
		"/api/homelab-network-flow",
		"/api/homelab-diagnostics",
		"/api/admin",
	]) {
		assert.equal(allowPublicHomelabProjection(new Request(outside + path), on), false);
	}
	assert.equal(
		allowPublicHomelabProjection(
			new Request(outside + "/api/homelab-services", { method: "POST" }),
			on,
		),
		false,
	);
	assert.equal(
		allowPublicHomelabProjection(new Request(outside + "/api/homelab-services"), {
			HOMELAB_PUBLIC_READONLY_ENABLED: "false",
		}),
		false,
	);
	assert.equal(publicRemoteReadOnlyEnabled({ HOMELAB_PUBLIC_READONLY_ENABLED: "false" }), false);
});

test("remote allowlisted GET works without CIDR but raw endpoints stay denied", async () => {
	const old = process.env.HOMELAB_PUBLIC_READONLY_ENABLED;
	const oldVercel = process.env.VERCEL;
	process.env.HOMELAB_PUBLIC_READONLY_ENABLED = "true";
	delete process.env.VERCEL;
	try {
		const safe = await gatedHomelabResponse(
			new Request(outside + "/api/homelab-health-v2"),
			async () => Response.json({ schemaVersion: 2, services: [] }),
		);
		assert.equal(safe.status, 200);
		assert.match(safe.headers.get("cache-control") ?? "", /no-store/);
		const raw = await gatedHomelabResponse(
			new Request(outside + "/api/homelab-probes"),
			async () => Response.json({ private: true }),
		);
		assert.equal(raw.status, 404);
		const access = await probeAccess(new Request(outside + "/api/homelab-access"));
		assert.deepEqual(await access.json(), { trusted: true, mode: "public-readonly" });
	} finally {
		if (old === undefined) delete process.env.HOMELAB_PUBLIC_READONLY_ENABLED;
		else process.env.HOMELAB_PUBLIC_READONLY_ENABLED = old;
		if (oldVercel === undefined) delete process.env.VERCEL;
		else process.env.VERCEL = oldVercel;
	}
});
