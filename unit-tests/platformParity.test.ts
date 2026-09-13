import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared platform hardening stays aligned with Bababou", async () => {
	const [dockerfile, nextConfig] = await Promise.all([
		source("Dockerfile"),
		source("next.config.mjs"),
	]);

	assert.match(
		dockerfile,
		/FROM nginxinc\/nginx-unprivileged:1\.30\.4-alpine-slim@sha256:3a4485bf084957d56674ee22db07d77d5a281418815c5852827419d6d629d440/,
	);
	assert.match(nextConfig, /poweredByHeader:\s*false/);
	assert.match(nextConfig, /X-Content-Type-Options/);
	assert.match(nextConfig, /Referrer-Policy/);
});
