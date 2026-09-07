import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Docker CI follows the real fallback inputs and modern CodeQL path", async () => {
	const workflow = await read(".github/workflows/docker-build.yml");

	assert.match(workflow, /branches: \[master\]/);
	assert.match(workflow, /"public\/\*\*"/);
	assert.match(workflow, /"\.github\/workflows\/docker-build\.yml"/);
	assert.match(workflow, /actions: read/);
	assert.match(workflow, /docker\/setup-buildx-action@v4/);
	assert.match(workflow, /docker\/build-push-action@v7/);
	assert.match(workflow, /docker\/login-action@v4/);
	assert.match(workflow, /github\/codeql-action\/upload-sarif@v4/);
	assert.doesNotMatch(workflow, /upload-sarif@v3/);
});

test("Docker CI scans the local image before any registry publication", async () => {
	const workflow = await read(".github/workflows/docker-build.yml");
	const build = workflow.indexOf("- name: Build fallback image");
	const smoke = workflow.indexOf("- name: Smoke test fallback container");
	const trivy = workflow.indexOf("- name: Run Trivy vulnerability scanner");
	const publish = workflow.indexOf("- name: Publish validated fallback image");

	assert.ok(build >= 0 && smoke > build && trivy > smoke && publish > trivy);
	assert.match(workflow, /LOCAL_IMAGE: nabla-site-alban:ci/);
	assert.match(workflow, /load: true/);
	assert.match(workflow, /push: false/);
	assert.match(workflow, /image-ref: \$\{\{ env\.LOCAL_IMAGE \}\}/);
	assert.match(workflow, /aquasecurity\/trivy-action@v0\.36\.0/);
	assert.match(workflow, /version: "v0\.74\.0"/);
	assert.match(workflow, /scanners: "vuln"/);
	assert.match(workflow, /format: "sarif"/);
	assert.match(workflow, /limit-severities-for-sarif: true/);
	assert.match(workflow, /exit-code: "1"/);
	assert.match(workflow, /severity: "CRITICAL,HIGH"/);
	assert.doesNotMatch(workflow, /PG_MAJOR/);
	assert.doesNotMatch(workflow, /actions\/setup-node/);
	assert.doesNotMatch(workflow, /npm install/);
});

test("Docker fallback runtime stays non-root and keeps the protected static 404", async () => {
	const [workflow, dockerfile, dockerignore] = await Promise.all([
		read(".github/workflows/docker-build.yml"),
		read("Dockerfile"),
		read(".dockerignore"),
	]);

	assert.match(
		dockerfile,
		/FROM nginxinc\/nginx-unprivileged:1\.30\.4-alpine-slim/,
	);
	assert.match(dockerfile, /EXPOSE 8080/);
	assert.match(dockerfile, /USER 101/);
	assert.match(dockerfile, /COPY public\/ \/usr\/share\/nginx\/html\//);
	assert.doesNotMatch(dockerfile, /version="0\.0\.6"/);
	assert.equal(dockerignore, "**\n!public/\n!public/**\n");

	assert.match(workflow, /127\.0\.0\.1:18080:8080/);
	assert.match(workflow, /http:\/\/127\.0\.0\.1:18080\/404\.html/);
	assert.match(workflow, /docker exec "\$\{container_id\}" id -u/);
	assert.match(workflow, /runtime_uid.*== "0"/s);
});

test("Docker publication is master-only and publishes immutable SHA tags", async () => {
	const workflow = await read(".github/workflows/docker-build.yml");

	assert.match(
		workflow,
		/github\.event_name == 'push' && github\.ref == 'refs\/heads\/master'/,
	);
	assert.match(workflow, /DOCKERHUB_IMAGE: nabla\/nabla-site-alban/);
	assert.match(workflow, /GHCR_IMAGE: ghcr\.io\/albanandrieu\/nabla-site-alban/);
	assert.match(workflow, /docker push "\$\{image\}:latest"/);
	assert.match(workflow, /docker push "\$\{image\}:\$\{GITHUB_SHA\}"/);
});
