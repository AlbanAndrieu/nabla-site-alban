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

test("TrueNAS AI and homelab surfaces share the blue red cyan palette", async () => {
	const [globals, gpu, homelab] = await Promise.all([
		source("app/globals.css"),
		source("app/components/truenas/GpuUpgradePlan.module.css"),
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
	assert.match(gpu, /data-recommended="true"/);
	assert.match(gpu, /var\(--truenas-accent-blue/);
	assert.match(gpu, /var\(--truenas-accent-red/);
	assert.match(homelab, /var\(--truenas-accent-blue/);
	assert.match(homelab, /var\(--truenas-accent-red/);
	assert.match(homelab, /var\(--truenas-accent-cyan/);
});
