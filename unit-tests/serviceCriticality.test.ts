import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import topologyJson from "../public/service-topology.json";
import {
	analyzeServiceCriticality,
	compareServiceCriticality,
	criticalityTierOrder,
	findRequiredDependencyPath,
	transitiveDependentsOf,
} from "../lib/serviceCriticality";
import { parseServiceTopology } from "../lib/serviceTopology";

const topology = parseServiceTopology(topologyJson);
assert.ok(topology);

test("criticality ranks foundations and shared state ahead of leaf applications", () => {
	const analysis = analyzeServiceCriticality(topology);
	assert.equal(analysis.get("truenas")?.tier, "foundation");
	assert.equal(analysis.get("postgresql")?.tier, "shared-data");
	assert.equal(analysis.get("ollama")?.tier, "shared-platform");
	assert.equal(analysis.get("openwebui")?.tier, "application");
	assert.equal(analysis.get("prometheus")?.tier, "support");
	assert.ok(criticalityTierOrder("foundation") < criticalityTierOrder("application"));
});

test("semantic data kinds stay shared-data even when their category is not data", () => {
	const analysis = analyzeServiceCriticality(topology);
	for (const id of ["postgresql", "redis", "minio", "opensearch", "qdrant"]) {
		assert.equal(analysis.get(id)?.tier, "shared-data");
	}
});

test("blast radius includes direct and transitive required dependents", () => {
	const analysis = analyzeServiceCriticality(topology);
	assert.ok((analysis.get("truenas")?.transitiveDependents ?? 0) > 0);
	assert.ok((analysis.get("postgresql")?.transitiveDependents ?? 0) > 0);
	assert.ok(
		(analysis.get("litellm")?.transitiveDependents ?? 0) >=
			(analysis.get("litellm")?.directDependents ?? 0),
	);
});

test("impact drill-down separates direct and indirect blast radius and exposes dependency path", () => {
	const impact = transitiveDependentsOf("postgresql", topology);
	assert.ok(impact.direct.length > 0);
	assert.ok(impact.all.length >= impact.direct.length);
	assert.ok(impact.all.some((id) => id === "openwebui"));
	assert.ok(impact.indirect.some((id) => id === "openwebui"));
	const path = findRequiredDependencyPath("openwebui", "postgresql", topology);
	assert.ok(path);
	assert.equal(path?.[0], "openwebui");
	assert.equal(path?.at(-1), "postgresql");
});

test("required observability links do not inflate startup criticality", () => {
	const analysis = analyzeServiceCriticality(topology);
	assert.equal(analysis.get("prometheus")?.directDependents, 0);
	assert.equal(analysis.get("prometheus")?.transitiveDependents, 0);
});

test("criticality sorting is deterministic and impact-first within a tier", () => {
	const analysis = analyzeServiceCriticality(topology);
	const ids = topology.nodes
		.map((node) => node.id)
		.sort((left, right) =>
			compareServiceCriticality(left, right, topology, analysis),
		);

	assert.equal(ids[0], "truenas");
	assert.ok(ids.indexOf("postgresql") < ids.indexOf("openwebui"));
	assert.ok(ids.indexOf("ollama") < ids.indexOf("litellm"));
	assert.ok(ids.indexOf("litellm") < ids.indexOf("openwebui"));
});

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("TrueNAS grid is grouped by the same criticality tiers and health semantics", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");

	assert.match(block, /data-homelab-service-hierarchy/);
	assert.match(block, /data-service-criticality-group/);
	assert.match(block, /criticalityTierOrder/);
	assert.match(block, /compareServiceCriticality/);
	assert.match(block, /parseHomelabHealthSnapshot/);
	assert.match(block, /resolveEffectiveServiceState/);
	assert.match(block, /data-homelab-health-filter/);
	assert.doesNotMatch(block, /PfSenseDnsPosture/);
});

test("architecture and TrueNAS share dependency, optional-edge and blast-radius semantics", async () => {
	const architecture = await source(
		"app/[locale]/architecture/ArchitectureTopologyView.tsx",
	);
	const explorer = await source(
		"app/[locale]/architecture/ArchitectureExplorer.tsx",
	);
	const hierarchy = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);
	const overview = await source(
		"app/components/homelab/ServiceCriticalityOverview.tsx",
	);

	assert.match(architecture, /CriticalDependencyHierarchy/);
	assert.match(hierarchy, /ServiceCriticalityOverview/);
	assert.match(architecture, /\/api\/homelab-topology/);
	assert.match(explorer, /requiredEdgeHealthState/);
	assert.match(explorer, /resolveEffectiveServiceState/);
	assert.match(explorer, /showOptional/);
	assert.match(overview, /transitiveDependents/);
});

test("same-origin topology API keeps live topology out of static prerender", async () => {
	const route = await source("app/api/homelab-topology/route.ts");
	assert.match(route, /loadServiceTopology/);
	assert.match(route, /force-dynamic/);
});

test("shared criticality overview exposes dependency impact drill-down", async () => {
	const overview = await source(
		"app/components/homelab/ServiceCriticalityOverview.tsx",
	);
	assert.match(overview, /transitiveDependentsOf/);
	assert.match(overview, /findRequiredDependencyPath/);
	assert.match(overview, /impact\.directConsumers/);
	assert.match(overview, /impact\.indirectConsumers/);
});

test("dependency impact drill-down labels stay aligned in English and French", async () => {
	const en = JSON.parse(await source("messages/homelab/en.json"));
	const fr = JSON.parse(await source("messages/homelab/fr.json"));
	assert.deepEqual(Object.keys(en.homelab.criticality.impact), Object.keys(fr.homelab.criticality.impact));
});
