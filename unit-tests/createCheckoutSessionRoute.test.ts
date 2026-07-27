import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";
import {
	checkoutLocale,
	checkoutReturnUrls,
	getTrustedOrigin,
	originFromDomainEnv,
	wantsJson,
} from "../app/api/create-checkout-session/route";

test("checkoutLocale only accepts supported locales", () => {
	assert.equal(checkoutLocale("fr"), "fr");
	assert.equal(checkoutLocale("en"), "en");
	assert.equal(checkoutLocale("de"), "en");
	assert.equal(checkoutLocale(null), "en");
});

test("checkoutReturnUrls preserve the checkout locale", () => {
	assert.deepEqual(checkoutReturnUrls("https://example.com", "fr"), {
		successUrl:
			"https://example.com/fr/success?session_id={CHECKOUT_SESSION_ID}",
		cancelUrl: "https://example.com/fr/cancel",
	});
});

const ENV_KEYS = ["DOMAIN", "VERCEL_URL", "NODE_ENV"] as const;
const ORIGINAL_ENV = Object.fromEntries(
	ENV_KEYS.map((key) => [key, process.env[key]]),
) as Partial<Record<(typeof ENV_KEYS)[number], string>>;

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
	for (const key of ENV_KEYS) {
		if (Object.hasOwn(values, key)) {
			const value = values[key];
			if (value === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = value;
			}
		} else {
			delete process.env[key];
		}
	}
}

test.after(() => {
	for (const key of ENV_KEYS) {
		const value = ORIGINAL_ENV[key];
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	}
});

test("originFromDomainEnv keeps only safe scheme and host", () => {
	assert.equal(
		originFromDomainEnv(" https://example.com/ "),
		"https://example.com",
	);
	assert.equal(
		originFromDomainEnv("http://example.com:8080/path?x=1"),
		"http://example.com:8080",
	);
});

test("originFromDomainEnv rejects unsupported or credentialed URLs", () => {
	assert.equal(originFromDomainEnv("ftp://example.com"), null);
	assert.equal(originFromDomainEnv("https://user:pass@example.com"), null);
	assert.equal(originFromDomainEnv(""), null);
});

test("getTrustedOrigin uses DOMAIN when valid", () => {
	setEnv({
		DOMAIN: "https://payments.example.com",
		VERCEL_URL: "preview.example.vercel.app",
		NODE_ENV: "production",
	});

	assert.deepEqual(getTrustedOrigin(), {
		ok: true,
		origin: "https://payments.example.com",
	});
});

test("getTrustedOrigin fails fast on invalid DOMAIN", () => {
	setEnv({
		DOMAIN: "javascript:alert(1)",
		VERCEL_URL: "preview.example.vercel.app",
		NODE_ENV: "production",
	});

	const trusted = getTrustedOrigin();
	assert.equal(trusted.ok, false);
	if (!trusted.ok) {
		assert.match(trusted.error, /Invalid DOMAIN/);
	}
});

test("getTrustedOrigin derives https origin from VERCEL_URL", () => {
	setEnv({
		VERCEL_URL: "https://preview.example.vercel.app/",
		NODE_ENV: "production",
	});

	assert.deepEqual(getTrustedOrigin(), {
		ok: true,
		origin: "https://preview.example.vercel.app",
	});
});

test("getTrustedOrigin falls back to localhost outside production", () => {
	setEnv({ NODE_ENV: "development" });
	assert.deepEqual(getTrustedOrigin(), {
		ok: true,
		origin: "http://localhost:3000",
	});
});

test("getTrustedOrigin errors in production without DOMAIN or VERCEL_URL", () => {
	setEnv({ NODE_ENV: "production" });
	const trusted = getTrustedOrigin();
	assert.equal(trusted.ok, false);
	if (!trusted.ok) {
		assert.match(trusted.error, /Set DOMAIN/);
	}
});

test("wantsJson checks Accept header for JSON", () => {
	const jsonReq = {
		headers: new Headers({ accept: "text/plain,application/json" }),
	} as NextRequest;
	const htmlReq = {
		headers: new Headers({ accept: "text/html" }),
	} as NextRequest;

	assert.equal(wantsJson(jsonReq), true);
	assert.equal(wantsJson(htmlReq), false);
});
