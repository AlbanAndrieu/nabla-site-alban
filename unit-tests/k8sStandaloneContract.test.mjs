import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (name) =>
	readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const dockerfile = source("Dockerfile");
const ignore = source(".dockerignore");
const nextConfig = source("next.config.mjs");
const justfile = source("justfile");
const smoke = source("scripts/k8s/smoke-standalone.sh");

test("single Dockerfile builds a full Next.js runtime", () => {
	assert.match(dockerfile, /NABLA_K8S_BUILD=1/);
	assert.match(dockerfile, /\.next\/standalone/);
	assert.match(dockerfile, /\.next\/static/);
	assert.match(dockerfile, /CMD \["node", "server.js"\]/);
	assert.match(dockerfile, /EXPOSE 3000/);
	assert.doesNotMatch(dockerfile, /^FROM\s+nginx/m);
});

test("runtime image is unprivileged and excludes sensitive build context", () => {
	assert.match(dockerfile, /USER 10001:10001/);
	assert.match(dockerfile, /npm ci --no-audit --no-fund/);
	assert.match(ignore, /^\.git$/m);
	assert.match(ignore, /^\.env\.\*$/m);
	assert.match(ignore, /^\*\*\/\.env\.\*$/m);
	assert.match(ignore, /^\*\*\/\*\.pem$/m);
	assert.match(ignore, /^node_modules$/m);
	assert.doesNotMatch(
		dockerfile,
		/DIAGNOSTICS_ACCESS_KEY|HOMELAB_TRUSTED_CIDRS|NEXT_PUBLIC_/,
	);
});

test("standalone output is opt-in; Vercel retains existing build mode", () => {
	assert.match(nextConfig, /NABLA_K8S_BUILD === "1"/);
	assert.match(nextConfig, /output: "standalone"/);
	assert.match(justfile, /k8s-contract:/);
	assert.match(justfile, /k8s-build/);
});

test("local smoke keeps filesystem read-only and OWNER closed", () => {
	assert.match(smoke, /--read-only/);
	assert.match(smoke, /--user 10001:10001/);
	assert.match(smoke, /p\.trusted !== false/);
	assert.doesNotMatch(smoke, /--env VERCEL=1|github workflow run/);
});
