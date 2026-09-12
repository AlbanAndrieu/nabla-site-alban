import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Node runtime policy separates development Current from production compatibility", async () => {
	const [nvmrc, productionNvmrc, envrc, packageRaw, lockRaw, workflow] =
		await Promise.all([
			read(".nvmrc"),
			read(".nvmrc-production"),
			read(".envrc"),
			read("package.json"),
			read("package-lock.json"),
			read(".github/workflows/node24-compat.yml"),
		]);
	const packageJson = JSON.parse(packageRaw) as {
		engines?: { node?: string; npm?: string };
	};
	const lock = JSON.parse(lockRaw) as {
		packages?: { ""?: { engines?: { node?: string; npm?: string } } };
	};

	assert.equal(nvmrc.trim(), "v26.8.2");
	assert.equal(productionNvmrc.trim(), "v24.11.0");
	assert.equal(packageJson.engines?.node, ">=24.11.0 <27");
	assert.deepEqual(
		lock.packages?.[""]?.engines,
		packageJson.engines,
		"package-lock root engines must stay synchronized with package.json",
	);
	assert.match(envrc, /NODE_VERSIONS=\$\{NODE_VERSIONS:-"v26\.8\.2"\}/);

	assert.match(workflow, /node-version-file:\s*"\.nvmrc-production"/);
	assert.doesNotMatch(workflow, /node-version:\s*"?\d/);
	assert.match(workflow, /github\.event\.pull_request\.draft == false/);
	assert.match(workflow, /npm ci --no-audit --no-fund/);
	assert.match(workflow, /npm run test:unit/);
	assert.doesNotMatch(workflow, /npm run build|npm run check(?!:)/);
});

test("Node 24 CI follows production runtime inputs instead of generic maintenance changes", async () => {
	const workflow = await read(".github/workflows/node24-compat.yml");

	for (const path of [
		".nvmrc-production",
		"package.json",
		"package-lock.json",
		"tsconfig.json",
		"next.config.mjs",
		"proxy.ts",
		"vercel.json",
		"app/**",
		"components/**",
		"i18n/**",
		"lib/**",
		"messages/**",
	]) {
		assert.match(
			workflow,
			new RegExp(`- "${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`),
		);
	}

	assert.match(workflow, /unit-tests\/nodeRuntimeCompatibility\.test\.ts/);
	assert.match(workflow, /\.github\/workflows\/node24-compat\.yml/);
	assert.doesNotMatch(workflow, /- "unit-tests\/\*\*"/);
	assert.doesNotMatch(workflow, /- "scripts\/\*\*"/);
	assert.doesNotMatch(workflow, /- "\.nvmrc"/);
});
