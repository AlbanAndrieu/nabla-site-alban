import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";
import { GET } from "../app/api/homelab-tunnel-check/route";

const ORIGINAL_HOSTS = process.env.HOMELAB_TUNNEL_CHECK_HOSTS;
const ORIGINAL_FETCH = globalThis.fetch;

function setHosts(value: string | undefined) {
	if (value === undefined) {
		delete process.env.HOMELAB_TUNNEL_CHECK_HOSTS;
	} else {
		process.env.HOMELAB_TUNNEL_CHECK_HOSTS = value;
	}
}

function requestFor(rawUrl?: string): NextRequest {
	const url = new URL("https://site.test/api/homelab-tunnel-check");
	if (rawUrl !== undefined) {
		url.searchParams.set("url", rawUrl);
	}
	return { nextUrl: url } as NextRequest;
}

test.afterEach(() => {
	setHosts(ORIGINAL_HOSTS);
	globalThis.fetch = ORIGINAL_FETCH;
});

test("homelab tunnel check rejects missing, invalid, and unsafe URLs before fetching", async () => {
	setHosts("albandrieu.com");
	let fetchCalls = 0;
	globalThis.fetch = (async () => {
		fetchCalls += 1;
		return new Response(null, { status: 204 });
	}) as typeof fetch;

	const missing = await GET(requestFor());
	assert.equal(missing.status, 400);
	assert.deepEqual(await missing.json(), { error: "missing url" });

	const invalid = await GET(requestFor("not a url"));
	assert.equal(invalid.status, 400);
	assert.deepEqual(await invalid.json(), { error: "invalid url" });

	const credentialed = await GET(
		requestFor("https://user:pass@service.albandrieu.com/"),
	);
	assert.equal(credentialed.status, 403);
	assert.deepEqual(await credentialed.json(), { error: "host not allowed" });

	const lookalike = await GET(requestFor("https://evilalbandrieu.com/"));
	assert.equal(lookalike.status, 403);
	assert.deepEqual(await lookalike.json(), { error: "host not allowed" });

	const unsupportedScheme = await GET(requestFor("file:///etc/passwd"));
	assert.equal(unsupportedScheme.status, 403);
	assert.deepEqual(await unsupportedScheme.json(), { error: "host not allowed" });
	assert.equal(fetchCalls, 0);
});

test("homelab tunnel check allows configured host suffixes and falls back from HEAD to ranged GET", async () => {
	setHosts("example.com, tunnel.example.net");
	const calls: Array<{ url: string; method?: string; headers?: HeadersInit }> = [];
	globalThis.fetch = (async (input, init) => {
		calls.push({
			url: String(input),
			method: init?.method,
			headers: init?.headers,
		});
		return new Response(null, {
			status: calls.length === 1 ? 405 : 204,
		});
	}) as typeof fetch;

	const response = await GET(
		requestFor("https://app.tunnel.example.net/status?health=1"),
	);
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.equal(response.headers.get("cache-control"), "no-store");
	assert.deepEqual(body, { status: 204, tlsError: false });
	assert.deepEqual(
		calls.map((call) => call.method),
		["HEAD", "GET"],
	);
	assert.equal(
		calls[0].url,
		"https://app.tunnel.example.net/status?health=1",
	);
	assert.equal(
		calls[1].url,
		"https://app.tunnel.example.net/status?health=1",
	);
	assert.equal(
		(calls[1].headers as Record<string, string>).Range,
		"bytes=0-0",
	);
});

test("homelab tunnel check reports TLS-like fetch failures without caching", async () => {
	setHosts("albandrieu.com");
	globalThis.fetch = (async () => {
		throw new Error("CERT_HAS_EXPIRED unable to verify certificate");
	}) as typeof fetch;

	const response = await GET(requestFor("https://grafana.albandrieu.com/"));
	const body = await response.json();

	assert.equal(response.status, 200);
	assert.equal(response.headers.get("cache-control"), "no-store");
	assert.equal(body.status, 0);
	assert.equal(body.tlsError, true);
	assert.match(body.error, /CERT_HAS_EXPIRED/);
});
