import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Node 24.22.1 LTS is the single development and production runtime", async () => {
	const [nvmrc, envrc, packageRaw, lockRaw, workflow, preCommit] =
		await Promise.all([
			read(".nvmrc"),
			read(".envrc"),
			read("package.json"),
			read("package-lock.json"),
			read(".github/workflows/node24-compat.yml"),
			read(".pre-commit-config.yaml"),
		]);
	const packageJson = JSON.parse(packageRaw) as {
		engines?: { node?: string; npm?: string };
		devEngines?: { runtime?: { version?: string } };
		dependencies?: { next?: string };
		devDependencies?: { "@types/node"?: string };
	};
	const lock = JSON.parse(lockRaw) as {
		packages?: Record<
			string,
			{
				engines?: { node?: string; npm?: string };
				version?: string;
				dependencies?: Record<string, string>;
				optionalDependencies?: Record<string, string>;
				integrity?: string;
				resolved?: string;
			}
		>;
	};

	assert.equal(nvmrc.trim(), "24.22.1");
	assert.match(
		preCommit,
		/^default_language_version:\n(?:\s+#.*\n)*\s+node:\s*"24\.22\.1"\s*$/m,
		"pre-commit Node hooks must use the .nvmrc runtime",
	);
	assert.equal(packageJson.engines?.node, ">=24.22.1 <25");
	assert.deepEqual(
		lock.packages?.[""]?.engines,
		packageJson.engines,
		"package-lock root engines must stay synchronized with package.json",
	);
	assert.match(envrc, /NODE_VERSIONS=\$\{NODE_VERSIONS:-"v24\.22\.1"\}/);
	assert.equal(packageJson.devEngines?.runtime?.version, "24.22.1");
	assert.equal(packageJson.dependencies?.next, "16.4.2");
	assert.equal(lock.packages?.[""]?.dependencies?.next, "16.4.2");
	assert.equal(lock.packages?.["node_modules/next"]?.version, "16.4.2");
	assert.equal(lock.packages?.["node_modules/@next/env"]?.version, "16.4.2");
	assert.equal(packageJson.devDependencies?.["@types/node"], "^24.13.3");
	assert.equal(lock.packages?.["node_modules/@types/node"]?.version, "24.13.3");
	const [dockerfile, dagger] = await Promise.all([
		read("Dockerfile"),
		read(".dagger/src/index.ts"),
	]);
	assert.match(dockerfile, /ARG NODE_IMAGE=node:24\.22\.1-alpine3\.24/);
	assert.match(dagger, /const NODE_DEVELOPMENT = "24\.22\.1"/);
	assert.match(dagger, /const NODE_VERCEL = "24\.22\.1"/);
	for (const [name, version] of Object.entries(
		lock.packages?.["node_modules/next"]?.optionalDependencies ?? {},
	)) {
		if (!name.startsWith("@next/swc-")) continue;
		assert.equal(lock.packages?.[`node_modules/${name}`]?.version, version);
	}

	// The minimum production runtime is the package.json engines floor.
	assert.match(workflow, /jq -r '\.engines\.node' package\.json/);
	assert.match(
		workflow,
		/node-version: \$\{\{ steps\.node-floor\.outputs\.version \}\}/,
	);
	assert.doesNotMatch(workflow, /node-version:\s*"?\d/);
	assert.doesNotMatch(workflow, /nvmrc-production/);
	assert.match(workflow, /github\.event\.pull_request\.draft == false/);
	assert.match(workflow, /npm ci --no-audit --no-fund/);
	assert.match(workflow, /npm run test:unit/);
	assert.doesNotMatch(workflow, /npm run build|npm run check(?!:)/);
});

test("Node 24 CI follows production runtime inputs instead of generic maintenance changes", async () => {
	const workflow = await read(".github/workflows/node24-compat.yml");

	for (const path of [
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

test("Node 24 CI keeps logs compact and retains evidence without hiding failures", async () => {
	const workflow = await read(".github/workflows/node24-compat.yml");

	assert.match(workflow, /QUALITY_LOG_TAIL: "20"/);
	assert.match(workflow, /npm run test:unit >"\$\{log\}" 2>&1/);
	assert.match(workflow, /grep -E.*head -n 20/);
	assert.match(workflow, /QUALITY_VERBOSE:-0/);
	assert.match(workflow, /exit "\$\{rc\}"/);
	assert.match(workflow, /Upload failed Node 24 unit-test evidence/);
	assert.match(workflow, /if: failure\(\)/);
	assert.match(workflow, /retention-days: 1/);
	assert.match(workflow, /actions\/upload-artifact@[0-9a-f]{40}/);
});
