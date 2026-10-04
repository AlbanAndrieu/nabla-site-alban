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

	assert.match(
		dockerfile,
		/FROM nginxinc\/nginx-unprivileged:1\.30\.5-alpine-slim@sha256:e28dcf0a161ddcbf228c7364b4a14f9bad4763ae8f5317c437b896afa3df4b84/,
	);
	assert.match(nextConfig, /poweredByHeader:\s*false/);
	assert.match(nextConfig, /X-Content-Type-Options/);
	assert.match(nextConfig, /Referrer-Policy/);
});
