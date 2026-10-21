import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { decideHomelabAccess } from "../lib/homelabAccess";
import { diagnoseHomelabAccessNetwork } from "../lib/homelabAccessDiagnostics";

const home = "82.66.4.247/32";
const env = { VERCEL: "1", HOMELAB_TRUSTED_CIDRS: home };

test("trusted home IPv4 gets the owner cards, without diagnostic IP disclosure", async () => {
	const headers = new Headers({ "x-real-ip": "82.66.4.247" });
	const access = await decideHomelabAccess(headers, { env });
	assert.equal(access.trusted, true);
	assert.deepEqual(diagnoseHomelabAccessNetwork(headers, env, access.trusted), {
		reason: "authorized",
		sourceFamily: "ipv4",
		trustedCidrsConfigured: true,
		networkAllowed: true,
		identityRequired: false,
	});
});

test("home IPv4 CIDR never implicitly authorizes unrelated IPv6", async () => {
	const headers = new Headers({
		"x-real-ip": "2001:db8::51",
		"x-forwarded-for": "82.66.4.247",
	});
	assert.equal((await decideHomelabAccess(headers, { env })).trusted, false);
	const info = diagnoseHomelabAccessNetwork(headers, env);
	assert.equal(info.sourceFamily, "ipv6");
	assert.equal(info.networkAllowed, false);
	assert.equal(info.reason, "client-ip-outside-trusted-cidrs");
	assert.doesNotMatch(JSON.stringify(info), /2001:db8|82\.66\.4\.247/);
});

test("missing settings are observable, but remain fail-closed", async () => {
	const headers = new Headers({ "x-real-ip": "82.66.4.247" });
	for (const [settings, reason] of [
		[{}, "runtime-unverified"],
		[{ VERCEL: "1" }, "trusted-cidrs-not-configured"],
		[
			{ VERCEL: "1", HOMELAB_TRUSTED_CIDRS: "wrong" },
			"trusted-cidrs-not-configured",
		],
	] as const) {
		assert.equal(
			(await decideHomelabAccess(headers, { env: settings })).trusted,
			false,
		);
		assert.equal(
			diagnoseHomelabAccessNetwork(headers, settings).reason,
			reason,
		);
	}
});

test("identity remains mandatory after network authorization", async () => {
	const headers = new Headers({ "x-real-ip": "82.66.4.247" });
	const settings = { ...env, CF_ACCESS_AUD: "owner-audience" };
	assert.equal(
		(await decideHomelabAccess(headers, { env: settings })).trusted,
		false,
	);
	assert.equal(
		diagnoseHomelabAccessNetwork(headers, settings).reason,
		"identity-not-authorized",
	);
});

test("default access response remains boolean; explicit diagnostics do not echo IPs", () => {
	const route = readFileSync(
		new URL("../app/api/homelab-access/route.ts", import.meta.url),
		"utf8",
	);
	assert.match(route, /get\("diagnose"\) === "1"/);
	assert.match(route, /: \{ trusted: decision\.trusted \}/);
	assert.match(route, /private, no-store, max-age=0/);
	const view = readFileSync(
		new URL(
			"../app/components/homelab/HomelabPrivateServices.tsx",
			import.meta.url,
		),
		"utf8",
	);
	assert.match(view, /data-homelab-access-diagnostic/);
	assert.match(view, /if \(access === "denied"\)/);
});
