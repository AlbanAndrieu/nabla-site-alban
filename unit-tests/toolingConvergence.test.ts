import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = (path: string) => new URL(`../${path}`, import.meta.url);
const read = (path: string) => readFile(projectUrl(path), "utf8");

test("retired deployment tooling stays absent while OpenCommit remains available", async () => {
	const packageJson = JSON.parse(await read("package.json")) as {
		scripts?: Record<string, string>;
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	for (const name of ["@datadog/browser-rum", "@vercel/analytics", "@vercel/speed-insights", "@vercel/toolbar"]) {
		assert.equal(packageJson.dependencies?.[name], undefined);
	}
	for (const name of ["d3", "next-devtools-mcp", "vercel", "wrangler"]) {
		assert.equal(packageJson.devDependencies?.[name], undefined);
	}
	assert.ok(packageJson.devDependencies?.opencommit);
	assert.equal(packageJson.scripts?.oco, "node scripts/run-opencommit.mjs");
	assert.equal(packageJson.scripts?.opencommit, "node scripts/run-opencommit.mjs");
	await access(projectUrl(".opencommit-commitlint"));
	await access(projectUrl("scripts/run-opencommit.mjs"));
	await assert.rejects(access(projectUrl("wrangler.jsonc")));
	await assert.rejects(access(projectUrl("build.sh")));
	await assert.rejects(access(projectUrl("public/package.json")));
	await access(projectUrl("public/d3.v3.min.js"));
	const vercelDocs = await read(".github/vercel-deployment-instructions.md");
	assert.match(vercelDocs, /Vercel \*\*Git Integration\*\* owns deployments/);
	assert.match(vercelDocs, /local Vercel CLI dependency.*intentionally retired/i);
	assert.doesNotMatch(vercelDocs, /npm install -g vercel/i);
	assert.doesNotMatch(vercelDocs, /^vercel (?:dev|deploy|--prod)\b/m);
	assert.doesNotMatch(vercelDocs, /Wrangler/);
});

test("Node and Next toolchain stay aligned with the reviewed targets", async () => {
	const packageJson = JSON.parse(await read("package.json")) as {
		engines?: { node?: string };
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const [setup, ci, release, playwright, envrc, nvmrc, mise, cicdDocs, architectureDocs] = await Promise.all([
		read(".github/workflows/copilot-setup-steps.yml"),
		read(".github/workflows/ci.yml"),
		read(".github/workflows/release.yml"),
		read(".github/workflows/playwright.yml"),
		read(".envrc"),
		read(".nvmrc"),
		read("mise.toml"),
		read(".github/copilot-instructions-cicd.md"),
		read("docs/architecture.md"),
	]);
	assert.equal(packageJson.engines?.node, ">=24.11.0 <26");
	assert.equal(packageJson.dependencies?.next, "16.3.4");
	assert.equal(packageJson.devDependencies?.["eslint-config-next"], "16.3.4");
	assert.equal(packageJson.devDependencies?.["@types/node"], "^25.9.5");
	for (const workflow of [setup, ci, release, playwright]) {
		assert.match(workflow, /node-version-file:\s*"\.nvmrc"/);
		assert.match(workflow, /npm@11\.17\.0/);
		assert.doesNotMatch(workflow, /node-version:\s*"24"/);
		assert.doesNotMatch(workflow, /node-version:\s*"25"/);
	}
	assert.match(envrc, /NODE_VERSIONS=.*v25\.9\.0/);
	assert.equal(nvmrc.trim(), "25.9.0");
	assert.match(mise, /node = "25\.9\.0"/);
	for (const docs of [cicdDocs, architectureDocs]) {
		assert.match(docs, /25\.9\.0/);
		assert.doesNotMatch(docs, /25\.4\.0/);
	}
});

test("active Alban-specific runtime dependencies remain explicit", async () => {
	const packageJson = JSON.parse(await read("package.json")) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const [instrumentation, checkout, mcp] = await Promise.all([
		read("instrumentation.ts"),
		read("app/components/checkout.tsx"),
		read(".mcp.json"),
	]);
	for (const name of [
		"@opentelemetry/api",
		"@opentelemetry/api-logs",
		"@opentelemetry/instrumentation",
		"@opentelemetry/sdk-logs",
		"@vercel/otel",
		"@stripe/react-stripe-js",
		"@stripe/stripe-js",
		"stripe",
		"@xyflow/react",
	]) {
		assert.ok(packageJson.dependencies?.[name], `${name} must stay installed while consumed`);
	}
	assert.ok(packageJson.devDependencies?.["lodash-es"]);
	assert.equal(packageJson.dependencies?.["lodash-es"], undefined);
	assert.match(instrumentation, /from "@vercel\/otel"/);
	assert.match(checkout, /from "@stripe\/react-stripe-js"/);
	assert.match(checkout, /from "@stripe\/stripe-js"/);
	assert.match(mcp, /next-devtools-mcp@latest/);
});
