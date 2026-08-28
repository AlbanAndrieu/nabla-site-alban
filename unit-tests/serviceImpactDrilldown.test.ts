import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("shared criticality overview exposes dependency impact drill-down", async () => {
	const overview = await source(
		"app/components/homelab/ServiceCriticalityOverview.tsx",
	);

	assert.match(overview, /buildServiceImpactFocus/);
	assert.match(overview, /data-impact-drilldown/);
	assert.match(overview, /data-dependency-path/);
	assert.match(overview, /data-direct-impact/);
	assert.match(overview, /data-indirect-impact/);
	assert.match(overview, /dependencyPath\.join\(" → "\)/);
});

test("dependency impact drill-down labels stay aligned in English and French", async () => {
	const [enRaw, frRaw] = await Promise.all([
		source("messages/homelab/en.json"),
		source("messages/homelab/fr.json"),
	]);
	const en = JSON.parse(enRaw) as { homelab: { criticality: Record<string, unknown> } };
	const fr = JSON.parse(frRaw) as { homelab: { criticality: Record<string, unknown> } };

	for (const key of [
		"details",
		"dependencyPath",
		"directImpact",
		"transitiveImpact",
	]) {
		assert.equal(typeof en.homelab.criticality[key], "string", `missing EN ${key}`);
		assert.equal(typeof fr.homelab.criticality[key], "string", `missing FR ${key}`);
	}
});
