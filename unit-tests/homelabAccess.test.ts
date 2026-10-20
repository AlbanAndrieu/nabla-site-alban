import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { GET as GET_ACCESS } from "../app/api/homelab-access/route";
import {
	cloudflareAccessIssuer,
	decideHomelabAccess,
	isIpInCidrs,
	parseTrustedCidrs,
	resetHomelabAccessCacheForTests,
	vercelClientIp,
	verifyCloudflareAccessJwt,
} from "../lib/homelabAccess";
import { gatedHomelabResponse } from "../lib/privateHomelabResponse";

const ISSUER = "https://nabla.cloudflareaccess.com";
const AUDIENCE = "aud-tag-1234";
const NOW = Date.UTC(2026, 9, 20, 12, 0, 0);
const NOW_SECONDS = Math.floor(NOW / 1000);
const HOME_IP = "82.66.4.247";
const HOME_CIDR = "82.66.4.247/32";
const ACCESS_ENV = {
	VERCEL: "1",
	HOMELAB_TRUSTED_CIDRS: HOME_CIDR,
	CF_ACCESS_TEAM_DOMAIN: "nabla.cloudflareaccess.com",
	CF_ACCESS_AUD: AUDIENCE,
};

afterEach(() => resetHomelabAccessCacheForTests());

function base64Url(bytes: Uint8Array | string) {
	const buffer =
		typeof bytes === "string" ? Buffer.from(bytes) : Buffer.from(bytes);
	return buffer.toString("base64url");
}

const signingKeys = crypto.subtle.generateKey(
	{
		name: "RSASSA-PKCS1-v1_5",
		modulusLength: 2048,
		publicExponent: new Uint8Array([1, 0, 1]),
		hash: "SHA-256",
	},
	true,
	["sign", "verify"],
);

async function jwks(kid = "key-1") {
	const { publicKey } = await signingKeys;
	const jwk = await crypto.subtle.exportKey("jwk", publicKey);
	return { keys: [{ ...jwk, kid }] };
}

async function signToken(
	payload: Record<string, unknown>,
	header: Record<string, unknown> = { alg: "RS256", kid: "key-1" },
) {
	const { privateKey } = await signingKeys;
	const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
	const signature = await crypto.subtle.sign(
		"RSASSA-PKCS1-v1_5",
		privateKey,
		new TextEncoder().encode(signingInput),
	);
	return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
}

function validClaims(overrides: Record<string, unknown> = {}) {
	return {
		iss: ISSUER,
		aud: [AUDIENCE],
		sub: "home-owner",
		type: "app",
		exp: NOW_SECONDS + 600,
		nbf: NOW_SECONDS - 10,
		...overrides,
	};
}

function jwksFetch(calls: string[] = []) {
	return (async (input: RequestInfo | URL) => {
		calls.push(String(input));
		return Response.json(await jwks());
	}) as typeof fetch;
}

test("trusted CIDRs accept IPv4, IPv6 and IPv4-mapped addresses", () => {
	const cidrs = parseTrustedCidrs(
		"203.0.113.0/24, 2001:db8:abcd::/48 198.51.100.7",
	);
	assert.equal(cidrs.length, 3);
	assert.equal(isIpInCidrs("203.0.113.42", cidrs), true);
	assert.equal(isIpInCidrs("203.0.114.1", cidrs), false);
	assert.equal(isIpInCidrs("198.51.100.7", cidrs), true);
	assert.equal(isIpInCidrs("198.51.100.8", cidrs), false);
	assert.equal(isIpInCidrs("2001:db8:abcd:12::1", cidrs), true);
	assert.equal(isIpInCidrs("2001:db8:abce::1", cidrs), false);
	assert.equal(isIpInCidrs("::ffff:203.0.113.9", cidrs), true);
	assert.equal(isIpInCidrs("not-an-ip", cidrs), false);
});

test("invalid and catch-all CIDRs are ignored instead of trusting everyone", () => {
	assert.deepEqual(parseTrustedCidrs(undefined), []);
	assert.deepEqual(
		parseTrustedCidrs("0.0.0.0/0, ::/0, 300.1.1.1/24, 10.0.0.0/33, junk"),
		[],
	);
	assert.equal(isIpInCidrs("8.8.8.8", parseTrustedCidrs("0.0.0.0/0")), false);
});

test("client IP is only read from the Vercel edge header on Vercel", () => {
	const headers = new Headers({
		"x-real-ip": HOME_IP,
		"x-forwarded-for": "198.51.100.1",
	});
	assert.equal(vercelClientIp(headers, {}), null);
	assert.equal(vercelClientIp(headers, { VERCEL: "0" }), null);
	assert.equal(vercelClientIp(headers, { VERCEL: "1" }), "203.0.113.42");
	assert.equal(vercelClientIp(new Headers(), { VERCEL: "1" }), null);
});

test("owner network is trusted only on Vercel with the home /32 CIDR", async () => {
	const headers = new Headers({ "x-real-ip": HOME_IP });
	const env = { VERCEL: "1", HOMELAB_TRUSTED_CIDRS: HOME_CIDR };
	assert.deepEqual(await decideHomelabAccess(headers, { env }), {
		trusted: true,
		via: "trusted-network",
	});
	assert.deepEqual(
		await decideHomelabAccess(headers, {
			env: { HOMELAB_TRUSTED_CIDRS: HOME_CIDR },
		}),
		{ trusted: false, via: null },
	);
	assert.deepEqual(
		await decideHomelabAccess(new Headers({ "x-real-ip": "82.66.4.246" }), {
			env,
		}),
		{ trusted: false, via: null },
	);
});

test("Cloudflare Access issuer must be an https cloudflareaccess.com team", () => {
	assert.equal(cloudflareAccessIssuer("nabla.cloudflareaccess.com"), ISSUER);
	assert.equal(cloudflareAccessIssuer(`${ISSUER}/`), ISSUER);
	assert.equal(
		cloudflareAccessIssuer("http://nabla.cloudflareaccess.com"),
		null,
	);
	assert.equal(cloudflareAccessIssuer("https://evil.example.com"), null);
	assert.equal(
		cloudflareAccessIssuer("https://cloudflareaccess.com.evil.example"),
		null,
	);
	assert.equal(cloudflareAccessIssuer(undefined), null);
});

test("a valid Cloudflare Access JWT is verified against the team JWKS", async () => {
	const calls: string[] = [];
	const token = await signToken(validClaims());
	const options = {
		issuer: ISSUER,
		audience: AUDIENCE,
		fetchImpl: jwksFetch(calls),
		now: NOW,
	};
	assert.equal(await verifyCloudflareAccessJwt(token, options), true);
	assert.equal(await verifyCloudflareAccessJwt(token, options), true);
	assert.deepEqual(calls, [`${ISSUER}/cdn-cgi/access/certs`], "JWKS cached");
});

test("Cloudflare Access JWT rejects wrong claims, algorithm, key or signature", async () => {
	const verify = async (token: string) =>
		verifyCloudflareAccessJwt(token, {
			issuer: ISSUER,
			audience: AUDIENCE,
			fetchImpl: jwksFetch(),
			now: NOW,
		});
	const valid = await signToken(validClaims());
	const [header, payload, signature] = valid.split(".");

	assert.equal(
		await verify(await signToken(validClaims({ aud: ["other"] }))),
		false,
	);
	assert.equal(
		await verify(
			await signToken(
				validClaims({ iss: "https://evil.cloudflareaccess.com" }),
			),
		),
		false,
	);
	assert.equal(
		await verify(await signToken(validClaims({ exp: NOW_SECONDS - 120 }))),
		false,
	);
	assert.equal(
		await verify(await signToken(validClaims({ nbf: NOW_SECONDS + 120 }))),
		false,
	);
	assert.equal(
		await verify(await signToken(validClaims({ exp: undefined }))),
		false,
	);
	assert.equal(
		await verify(
			await signToken(validClaims(), { alg: "HS256", kid: "key-1" }),
		),
		false,
	);
	assert.equal(
		await verify(
			await signToken(validClaims(), { alg: "RS256", kid: "other" }),
		),
		false,
	);
	assert.equal(
		await verify(await signToken(validClaims(), { alg: "none" })),
		false,
	);
	const forgedPayload = base64Url(
		JSON.stringify(validClaims({ email: "attacker@example.com" })),
	);
	assert.equal(await verify(`${header}.${forgedPayload}.${signature}`), false);
	assert.equal(await verify(`${header}.${payload}.`), false);
	assert.equal(await verify("not.a.jwt"), false);
	assert.equal(await verify(""), false);
});

test("JWKS outages fail closed", async () => {
	const token = await signToken(validClaims());
	const failing = (async () => {
		throw new Error("network down");
	}) as typeof fetch;
	const unavailable = (async () =>
		new Response("nope", { status: 503 })) as typeof fetch;
	for (const fetchImpl of [failing, unavailable]) {
		assert.equal(
			await verifyCloudflareAccessJwt(token, {
				issuer: ISSUER,
				audience: AUDIENCE,
				fetchImpl,
				now: NOW,
			}),
			false,
		);
	}
});

test("Cloudflare Access requires both the home CIDR and a verified owner", async () => {
	const token = await signToken(validClaims());
	const headers = new Headers({
		"cf-access-jwt-assertion": token,
		"x-real-ip": HOME_IP,
	});
	assert.deepEqual(
		await decideHomelabAccess(headers, {
			env: ACCESS_ENV,
			fetchImpl: jwksFetch(),
			now: NOW,
		}),
		{ trusted: true, via: "cloudflare-access" },
	);
	for (const env of [
		{},
		{ CF_ACCESS_TEAM_DOMAIN: ACCESS_ENV.CF_ACCESS_TEAM_DOMAIN },
		{ CF_ACCESS_AUD: AUDIENCE },
		{ ...ACCESS_ENV, CF_ACCESS_TEAM_DOMAIN: "https://evil.example.com" },
	]) {
		assert.deepEqual(
			await decideHomelabAccess(headers, {
				env,
				fetchImpl: jwksFetch(),
				now: NOW,
			}),
			{ trusted: false, via: null },
		);
	}
});

test("a valid JWT from outside the home IP is still denied", async () => {
	const token = await signToken(validClaims());
	const decision = await decideHomelabAccess(
		new Headers({
			"cf-access-jwt-assertion": token,
			"x-real-ip": "203.0.113.50",
			"x-forwarded-for": HOME_IP,
		}),
		{ env: ACCESS_ENV, fetchImpl: jwksFetch(), now: NOW },
	);
	assert.deepEqual(decision, { trusted: false, via: null });
});

test("gated responses are a neutral 404 for anonymous visitors", async () => {
	let handled = false;
	const response = await gatedHomelabResponse(
		new Request("https://www.albanandrieu.com/api/homelab-services", {
			headers: { "x-real-ip": HOME_IP },
		}),
		async () => {
			handled = true;
			return Response.json({ secret: true });
		},
	);
	assert.equal(handled, false);
	assert.equal(response.status, 404);
	assert.equal(
		response.headers.get("cache-control"),
		"private, no-store, max-age=0",
	);
	assert.deepEqual(await response.json(), {
		error: "Operational homelab data is private",
	});
});

test("trusted responses always override caching with private no-store", async () => {
	const previous = { ...process.env };
	process.env.VERCEL = "1";
	process.env.HOMELAB_TRUSTED_CIDRS = HOME_CIDR;
	try {
		const response = await gatedHomelabResponse(
			new Request("https://www.albanandrieu.com/api/homelab-services", {
				headers: { "x-real-ip": HOME_IP },
			}),
			async () =>
				Response.json(
					{ services: [] },
					{ headers: { "Cache-Control": "public, s-maxage=15" } },
				),
		);
		assert.equal(response.status, 200);
		assert.equal(
			response.headers.get("cache-control"),
			"private, no-store, max-age=0",
		);
		assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
		assert.deepEqual(await response.json(), { services: [] });

		const access = await GET_ACCESS(
			new Request("https://www.albanandrieu.com/api/homelab-access", {
				headers: { "x-real-ip": HOME_IP },
			}),
		);
		assert.deepEqual(await access.json(), { trusted: true });
	} finally {
		process.env = previous;
	}
});

test("access probe answers only a boolean and is never cached", async () => {
	const response = await GET_ACCESS(
		new Request("https://www.albanandrieu.com/api/homelab-access", {
			headers: {
				"x-real-ip": HOME_IP,
				"cf-access-jwt-assertion": "forged.token.value",
			},
		}),
	);
	assert.equal(response.status, 200);
	assert.match(
		response.headers.get("cache-control") ?? "",
		/private, no-store/,
	);
	assert.deepEqual(await response.json(), { trusted: false });
});
