import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const paths = [
	".github/workflows/security-supply-chain.yml",
	".github/workflows/docker-build.yml",
	".github/workflows/security-rss-opml.yml",
];
test("paid PR jobs skip drafts and can run on ready_for_review", () => {
	for (const path of paths) {
		const workflow = read(path);
		assert.match(workflow, /ready_for_review/);
		assert.match(workflow, /github\.event\.pull_request\.draft == false/);
	}
});
test("Copilot setup never allocates a paid runner on Draft PRs", () => {
	const workflow = read(".github/workflows/copilot-setup-steps.yml");
	assert.match(workflow, /name: "Copilot Setup Steps"/);
	assert.match(workflow, /github\.event\.pull_request\.draft == false/);
	assert.match(workflow, /workflow_dispatch:/);
});

test("single root Dockerfile is always in CI/SCA and image build scope", () => {
	for (const path of [
		".github/workflows/ci.yml",
		".github/workflows/security-supply-chain.yml",
		".github/workflows/docker-build.yml",
	]) {
		const workflow = read(path);
		assert.ok(workflow.split('"Dockerfile"').length >= 3, path);
		assert.ok(workflow.split('".dockerignore"').length >= 3, path);
		assert.doesNotMatch(workflow, /Dockerfile\.k8s/);
	}
	assert.match(read(".github/workflows/docker-build.yml"), /name: Build Next.js standalone image/);
});
test("shell formatter matches native Compose pattern without a Docker daemon", () => {
	const config = read(".pre-commit-config.yaml");
	assert.match(config, /-\s+id: shfmt\n/);
	assert.doesNotMatch(config, /id: shfmt-docker/);
	assert.match(read("mise.toml"), /go = "1\.25\.12"/);
	const gate = read("scripts/agent-quality-gate.sh");
	assert.match(gate, /pre-commit run shfmt --files/);
	assert.doesNotMatch(gate, /shfmt-docker/);
});
test("MegaLinter is manual, read-only and cannot make auto-fix commits", () => {
	const workflow = read(".github/workflows/mega-linter.yml");
	assert.match(workflow, /^  workflow_dispatch:/m);
	assert.doesNotMatch(workflow, /^  (?:pull_request|push):/m);
	assert.match(workflow, /permissions:\n  contents: read/);
	assert.match(workflow, /APPLY_FIXES: none/);
	assert.doesNotMatch(workflow, /contents: write|pull-requests: write|git push/);
});
