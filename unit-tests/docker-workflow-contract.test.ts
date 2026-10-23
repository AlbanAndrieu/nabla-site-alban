import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Docker CI builds the one real Next.js image on Ready and master only", async () => {
	const workflow = await read(".github/workflows/docker-build.yml");
	assert.match(workflow, /name: Build Next.js standalone image/);
	assert.match(workflow, /branches: \[master\]/);
	assert.match(workflow, /ready_for_review/);
	assert.match(workflow, /github\.event\.pull_request\.draft == false/);
	assert.match(workflow, /"Dockerfile"/);
	assert.match(workflow, /"\.dockerignore"/);
	assert.match(workflow, /"package-lock\.json"/);
	assert.match(workflow, /"app\/\*\*"/);
	assert.doesNotMatch(workflow, /schedule:|nginx|fallback|Dockerfile\.k8s/);
});

test("image is smoke-tested and scanned before any registry publication", async () => {
	const workflow = await read(".github/workflows/docker-build.yml");
	const build = workflow.indexOf("- name: Build Next.js standalone image");
	const smoke = workflow.indexOf("- name: Smoke test Next.js runtime");
	const trivy = workflow.indexOf("- name: Run Trivy vulnerability scanner");
	const publish = workflow.indexOf("- name: Publish validated Next.js image");
	assert.ok(build >= 0 && smoke > build && trivy > smoke && publish > trivy);
	assert.match(workflow, /scripts\/k8s\/smoke-standalone\.sh/);
	assert.match(workflow, /cache-to: type=gha,mode=min/);
	assert.match(workflow, /load: true/);
	assert.match(workflow, /image-ref: \$\{\{ env\.LOCAL_IMAGE \}\}/);
	assert.match(workflow, /aquasecurity\/trivy-action@[0-9a-f]{40}/);
	assert.match(workflow, /exit-code: "1"/);
	assert.match(workflow, /severity: "CRITICAL,HIGH"/);
	assert.match(workflow, /retention-days: 1/);
	assert.doesNotMatch(workflow, /run-trivy=false|steps\.trivy-policy/);
});

test("single Dockerfile packages SSR/API and stays non-root", async () => {
	const [dockerfile, ignore] = await Promise.all([read("Dockerfile"), read(".dockerignore")]);
	assert.match(dockerfile, /NABLA_K8S_BUILD=1/);
	assert.match(dockerfile, /npm ci --no-audit --no-fund/);
	assert.match(dockerfile, /\.next\/standalone/);
	assert.match(dockerfile, /EXPOSE 3000/);
	assert.match(dockerfile, /USER 10001:10001/);
	assert.match(dockerfile, /CMD \["node", "server.js"\]/);
	assert.doesNotMatch(dockerfile, /FROM nginx|DIAGNOSTICS_ACCESS_KEY/);
	for (const value of [".git", "node_modules", ".env.*", "**/.env.*", "**/*.pem"]) {
		assert.ok(ignore.split("\n").includes(value), value);
	}
});

test("publication remains limited to trusted master commits and SHA tags", async () => {
	const workflow = await read(".github/workflows/docker-build.yml");
	assert.match(workflow, /github\.event_name == 'push' && github\.ref == 'refs\/heads\/master'/);
	assert.match(workflow, /GHCR_IMAGE: ghcr\.io\/albanandrieu\/nabla-site-alban/);
	assert.match(workflow, /docker push "\$\{GHCR_IMAGE\}:\$\{GITHUB_SHA\}"/);
	assert.match(workflow, /steps\.registry_policy\.outputs\.dockerhub_enabled == 'true'/);
	assert.match(workflow, /docker push "\$\{DOCKERHUB_IMAGE\}:\$\{GITHUB_SHA\}"/);
});

test("image workflow security actions stay pinned to immutable SHAs", async () => {
	const workflow = await read(".github/workflows/docker-build.yml");
	assert.doesNotMatch(workflow, /^\s*uses:\s+[^\s#]+@v\d+(?:\.\d+\.\d+)?\s*$/m);
	for (const action of ["actions/checkout","docker/setup-buildx-action","docker/build-push-action","aquasecurity/trivy-action","actions/upload-artifact","github/codeql-action/upload-sarif","docker/login-action"]) {
		assert.match(workflow, new RegExp(`uses: ${action.replace("/", "\\/")}@[0-9a-f]{40}`));
	}
});
