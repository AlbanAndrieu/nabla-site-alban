import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../app/api/deployment/route";

function restoreEnv(name: string, value: string | undefined) {
	if (value === undefined) {
		delete process.env[name];
	} else {
		process.env[name] = value;
	}
}

test("deployment API exposes only the Vercel deployment identity", async () => {
	const previousSha = process.env.VERCEL_GIT_COMMIT_SHA;
	const previousEnvironment = process.env.VERCEL_TARGET_ENV;
	const previousPublicSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

	process.env.VERCEL_GIT_COMMIT_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
	process.env.VERCEL_TARGET_ENV = "production";
	process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = "fallback";

	try {
		const response = GET();
		assert.equal(response.status, 200);
		assert.equal(response.headers.get("cache-control"), "no-store");
		assert.deepEqual(await response.json(), {
			gitSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			environment: "production",
		});
	} finally {
		restoreEnv("VERCEL_GIT_COMMIT_SHA", previousSha);
		restoreEnv("VERCEL_TARGET_ENV", previousEnvironment);
		restoreEnv("NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA", previousPublicSha);
	}
});

test("deployment API fails closed when Vercel Git identity is unavailable", async () => {
	const previousSha = process.env.VERCEL_GIT_COMMIT_SHA;
	const previousPublicSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

	delete process.env.VERCEL_GIT_COMMIT_SHA;
	delete process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;

	try {
		const response = GET();
		assert.equal(response.status, 503);
		assert.equal(response.headers.get("cache-control"), "no-store");
		assert.deepEqual(await response.json(), {
			error: "Deployment identity unavailable",
		});
	} finally {
		restoreEnv("VERCEL_GIT_COMMIT_SHA", previousSha);
		restoreEnv("NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA", previousPublicSha);
	}
});
