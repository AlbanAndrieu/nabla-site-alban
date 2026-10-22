import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const paths = [
	".github/workflows/security-supply-chain.yml",
	".github/workflows/docker-build.yml",
	".github/workflows/security-rss-opml.yml",
	".github/workflows/mega-linter.yml",
];
test("paid PR jobs skip drafts and can run on ready_for_review", () => {
	for (const path of paths) {
		const workflow = read(path);
		assert.match(workflow, /ready_for_review/);
		assert.match(workflow, /github\.event\.pull_request\.draft == false/);
	}
});
test("new Kubernetes Dockerfile is never omitted from Next.js CI scope", () => {
	const workflow = read(".github/workflows/ci.yml");
	const supply = read(".github/workflows/security-supply-chain.yml");
	for (const path of ["Dockerfile.k8s", "Dockerfile.k8s.dockerignore"]) {
		assert.ok(workflow.split(`"${path}"`).length >= 3, path);
		assert.ok(supply.split(`"${path}"`).length >= 3, path);
	}
});
test("fallback Docker workflow remains scoped to Nginx and avoids docker build on drafts", () => {
	const workflow = read(".github/workflows/docker-build.yml");
	assert.match(workflow, /name: Build static fallback/);
	assert.doesNotMatch(workflow, /"Dockerfile\.k8s"/);
});
test("shell formatter matches native Compose pattern without a Docker daemon", () => {
	const config = read(".pre-commit-config.yaml");
	assert.match(config, /-\s+id: shfmt\n/);
	assert.doesNotMatch(config, /id: shfmt-docker/);
	assert.match(read("mise.toml"), /go = "1\.25\.12"/);
});
