import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) =>
	readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const pkg = JSON.parse(source("package.json"));
const lock = JSON.parse(source("package-lock.json"));
const packages = lock.packages ?? {};

test("Node 24.22.1 LTS is the single Docker, Dagger and local runtime", () => {
	assert.equal(source(".nvmrc").trim(), "24.22.1");
	assert.equal(pkg.engines.node, ">=24.22.1 <25");
	assert.equal(pkg.devEngines.runtime.version, "24.22.1");
	assert.match(source(".envrc"), /NODE_VERSIONS=\$\{NODE_VERSIONS:-"v24\.22\.1"\}/);
	assert.match(source("Dockerfile"), /ARG NODE_IMAGE=node:24\.22\.1-alpine3\.24/);
	assert.match(source(".dagger/src/index.ts"), /const NODE_DEVELOPMENT = "24\.22\.1"/);
	assert.match(source(".dagger/src/index.ts"), /const NODE_VERCEL = "24\.22\.1"/);
	assert.match(source("justfile"), /dagger call check-node-lts --source=\./);
});

test("Next.js 16.4.2 Active LTS and runtime lock metadata remain coherent", () => {
	assert.equal(pkg.dependencies.next, "16.4.2");
	assert.equal(packages[""].dependencies.next, pkg.dependencies.next);
	assert.deepEqual(packages[""].engines, pkg.engines);
	assert.equal(packages["node_modules/next"].version, pkg.dependencies.next);
	assert.equal(packages["node_modules/@next/env"].version, pkg.dependencies.next);
	for (const path of ["node_modules/next", "node_modules/@next/env"]) {
		const entry = packages[path];
		assert.match(entry.integrity, /^sha512-/);
		assert.match(entry.resolved, /^https:\/\/registry\.npmjs\.org\//);
	}
});

test("platform-specific SWC binary versions match the Next.js release", () => {
	for (const [name, version] of Object.entries(
		packages["node_modules/next"].optionalDependencies ?? {},
	)) {
		if (!name.startsWith("@next/swc-")) continue;
		const entry = packages[`node_modules/${name}`];
		assert.ok(entry, name);
		assert.equal(entry.version, version);
		assert.match(entry.integrity, /^sha512-/);
	}
	assert.ok(packages["node_modules/sharp"]);
});

test("Node 24 typings keep an independently resolved undici-types version", () => {
	assert.equal(pkg.devDependencies["@types/node"], "^24.13.3");
	assert.equal(packages["node_modules/@types/node"].version, "24.13.3");
	assert.equal(
		packages["node_modules/@types/node"].dependencies["undici-types"],
		"~7.18.0",
	);
	assert.equal(
		packages["node_modules/@types/node/node_modules/undici-types"].version,
		"7.18.0",
	);
});

test("Vercel remains native Next.js, while the sole Dockerfile serves Talos", () => {
	assert.equal(JSON.parse(source("vercel.json")).framework, "nextjs");
	const dockerfile = source("Dockerfile");
	assert.match(dockerfile, /EXPOSE 3000/);
	assert.match(dockerfile, /USER 10001:10001/);
	assert.match(dockerfile, /CMD \["node", "server.js"\]/);
	assert.doesNotMatch(dockerfile, /FROM nginx/);
});
