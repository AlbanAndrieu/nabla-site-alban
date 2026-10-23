import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared platform hardening keeps the reviewed security baseline", async () => {
	const [dockerfile, nextConfig] = await Promise.all([
		source("Dockerfile"),
		source("next.config.mjs"),
	]);

	// The Talos runtime is Node standalone (k8sStandaloneContract); every stage
	// still uses a digest-pinned, unprivileged base image.
	assert.match(
		dockerfile,
		/^ARG NODE_IMAGE=node:24\.22\.1-alpine3\.24@sha256:[0-9a-f]{64}$/m,
	);
	assert.doesNotMatch(dockerfile, /^FROM (?!\$\{NODE_IMAGE\})/m);
	assert.match(dockerfile, /^USER 10001:10001$/m);
	assert.match(nextConfig, /poweredByHeader:\s*false/);
	assert.match(nextConfig, /X-Content-Type-Options/);
	assert.match(nextConfig, /Referrer-Policy/);
});
