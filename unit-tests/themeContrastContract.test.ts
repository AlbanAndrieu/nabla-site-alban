import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("global Bootstrap bridge keeps text tables and form controls theme-aware", async () => {
	const globals = await source("app/globals.css");

	assert.match(globals, /html body \.text-muted/);
	assert.match(globals, /html body \.text-secondary/);
	assert.match(globals, /--bs-table-color: var\(--ui-text-primary\)/);
	assert.match(globals, /\.table > :not\(caption\) > \* > \*/);
	assert.match(globals, /:is\(\.form-control, \.form-select\)/);
	assert.match(globals, /\.form-select option/);
	assert.match(globals, /color-scheme: light dark/);
});

test("TrueNAS homelab keeps its palette while GPU options retain the classic Bootstrap card UX", async () => {
	const [globals, gpu, homelab] = await Promise.all([
		source("app/globals.css"),
		source("app/components/truenas/GpuUpgradePlan.tsx"),
		source("app/components/truenas/HomeLabSection.module.css"),
	]);

	for (const token of [
		"--truenas-accent-blue",
		"--truenas-accent-red",
		"--truenas-accent-cyan",
		"--truenas-blue-surface",
		"--truenas-red-surface",
	]) {
		assert.ok(
			globals.includes(token),
			`missing TrueNAS palette token ${token}`,
		);
	}
	assert.match(globals, /\.page-truenas \.table/);
	assert.doesNotMatch(gpu, /GpuUpgradePlan\.module\.css/);
	assert.match(gpu, /card h-100/);
	assert.match(gpu, /border-primary/);
	assert.match(gpu, /border-secondary/);
	assert.match(gpu, /badge text-bg-primary/);
	assert.match(gpu, /alert alert-info/);
	assert.match(homelab, /var\(--truenas-accent-blue/);
	assert.match(homelab, /var\(--truenas-accent-red/);
	assert.match(homelab, /var\(--truenas-accent-cyan/);
});

test("fastpool and Cloudflare warnings use accessible semantic state colors", async () => {
	const [fastPool, cloudflare, cloudflareCss] = await Promise.all([
		source("app/components/truenas/FastPoolPlan.tsx"),
		source("app/components/homelab/CloudflareStatusWarning.tsx"),
		source("app/components/homelab/CloudflareStatusWarning.module.css"),
	]);

	assert.match(fastPool, /var\(--ui-danger-text\)/);
	assert.match(cloudflare, /CloudflareStatusWarning\.module\.css/);
	assert.doesNotMatch(cloudflare, /alert alert-warning/);
	assert.match(cloudflareCss, /background: var\(--ui-warning-surface\)/);
	assert.match(cloudflareCss, /color: var\(--ui-warning-text\)/);
	assert.match(
		cloudflareCss,
		/border-left: 4px solid var\(--ui-warning-text\)/,
	);
});
