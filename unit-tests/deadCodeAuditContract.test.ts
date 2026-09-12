import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = (path: string) => new URL(`../${path}`, import.meta.url);

const retiredFiles = [
	"app/404.module.css",
	"app/[locale]/architecture/ArchitectureExplorer.module.css",
	"app/[locale]/architecture/ArchitectureExplorer.tsx",
	"app/actions/stripe.ts",
	"app/components/checkout.tsx",
	"app/components/nabla/OpenSourceGridSection.tsx",
	"app/components/nabla/PlatformsMatrixSection.tsx",
	"components/LocaleSwitcher.module.css",
	"components/LocaleSwitcher.tsx",
	"components/ResourceDirectory.tsx",
	"components/SiteFooter.tsx",
	"i18n/navigation.ts",
	"lib/legacyPageMetadata.ts",
	"lib/resourcePages.ts",
	"purgecss.config.js",
	"scripts/download-missing-icons.cjs",
	"scripts/generate-missing-icons-json.cjs",
] as const;

test("confirmed dead-code cluster stays retired", async () => {
	for (const path of retiredFiles) {
		await assert.rejects(access(projectUrl(path)), path);
	}
});

test("dead-code audit stays explicit and on-demand", async () => {
	const [pkgRaw, knip] = await Promise.all([
		readFile(projectUrl("package.json"), "utf8"),
		readFile(projectUrl("knip.jsonc"), "utf8"),
	]);
	const pkg = JSON.parse(pkgRaw) as {
		scripts?: Record<string, string>;
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};

	assert.equal(
		pkg.scripts?.["quality:fix"],
		"bash scripts/agent-quality-gate.sh --fix",
	);
	assert.equal(
		pkg.scripts?.["audit:dead-code"],
		"npx --yes --ignore-scripts knip@6.35.0 --config knip.jsonc --reporter compact --no-progress",
	);
	assert.equal(pkg.dependencies?.["@stripe/react-stripe-js"], undefined);
	assert.equal(pkg.dependencies?.["@stripe/stripe-js"], undefined);
	for (const name of [
		"eslint-config-next",
		"postcss-selector-parser",
		"typescript-eslint",
	]) {
		assert.equal(pkg.devDependencies?.[name], undefined);
	}
	assert.match(knip, /"ignoreFiles": \["public\/\*\*"\]/);
	assert.match(knip, /"eslint-formatter-gitlab"/);
	assert.match(knip, /"opencommit"/);
});
