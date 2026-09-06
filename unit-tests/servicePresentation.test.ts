import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { HomelabServicesCatalog } from "../lib/homelabServices";
import {
	analyzeServicePresentation,
	groupCatalogByPresentation,
	metricsProfileForGroup,
} from "../lib/servicePresentation";
import type { ServiceTopology } from "../lib/serviceTopology";

const catalog: HomelabServicesCatalog = {
	version: 1,
	services: [
		{ id: "experiment", name: "Experiment", kind: "application", category: "lab" },
		{ id: "postgresql", name: "PostgreSQL", kind: "database", category: "data" },
		{ id: "crowdsec", name: "CrowdSec", kind: "security-agent", category: "security" },
		{ id: "prometheus", name: "Prometheus", kind: "observability", category: "observability" },
		{ id: "talos", name: "Talos", kind: "kubernetes-os", category: "infrastructure" },
		{
			id: "explicit-service",
			name: "Explicit service",
			kind: "database",
			category: "data",
			presentationRole: "service",
			criticality: "medium",
		},
	],
};

const topology: ServiceTopology = {
	version: 1,
	name: "service presentation fixture",
	nodes: [
		{ id: "experiment", name: "Experiment", kind: "application", category: "lab" },
		{ id: "postgresql", name: "PostgreSQL", kind: "database", category: "data" },
		{ id: "crowdsec", name: "CrowdSec", kind: "security-agent", category: "security" },
		{ id: "prometheus", name: "Prometheus", kind: "observability", category: "observability" },
		{
			id: "talos",
			name: "Talos",
			kind: "kubernetes-os",
			category: "infrastructure",
			presentationRole: "core",
			criticality: "critical",
		},
		{ id: "explicit-service", name: "Explicit service", kind: "database", category: "data" },
	],
	relations: [
		{
			source: "experiment",
			target: "postgresql",
			type: "dependsOn",
			strength: "required",
			evidence: ["fixture"],
		},
		{
			source: "experiment",
			target: "crowdsec",
			type: "observedBy",
			strength: "optional",
			evidence: ["fixture"],
		},
	],
};

test("service presentation separates role, criticality and dependency impact", () => {
	const analysis = analyzeServicePresentation(catalog, topology);

	assert.deepEqual(
		{
			role: analysis.get("experiment")?.role,
			criticality: analysis.get("experiment")?.criticality,
			group: analysis.get("experiment")?.group,
			metrics: analysis.get("experiment")?.metricsProfile,
		},
		{
			role: "service",
			criticality: "medium",
			group: "services",
			metrics: "red",
		},
	);

	assert.equal(analysis.get("talos")?.role, "core");
	assert.equal(analysis.get("talos")?.criticality, "critical");
	assert.equal(analysis.get("talos")?.group, "core-critical");
	assert.equal(analysis.get("talos")?.metricsProfile, "use");

	assert.equal(analysis.get("crowdsec")?.criticality, "high");
	assert.equal(analysis.get("crowdsec")?.group, "security-controls");
	assert.equal(analysis.get("crowdsec")?.metricsProfile, "security");

	assert.equal(analysis.get("postgresql")?.criticality, "high");
	assert.equal(analysis.get("postgresql")?.group, "shared-core");
	assert.equal(analysis.get("postgresql")?.metricsProfile, "red-use");

	assert.equal(analysis.get("prometheus")?.group, "support");
	assert.equal(analysis.get("explicit-service")?.group, "services");
});

test("service-first grouping keeps user outcomes ahead of critical foundations", () => {
	const groups = groupCatalogByPresentation(catalog, topology);
	assert.deepEqual(
		groups.map((group) => group.group),
		["services", "core-critical", "security-controls", "shared-core", "support"],
	);
	assert.deepEqual(
		groups[0]?.catalog.services.map((service) => service.id),
		["experiment", "explicit-service"],
	);
});

test("metric profiles stay role-specific instead of becoming one universal health score", () => {
	assert.equal(metricsProfileForGroup("services"), "red");
	assert.equal(metricsProfileForGroup("core-critical"), "use");
	assert.equal(metricsProfileForGroup("security-controls"), "security");
	assert.equal(metricsProfileForGroup("shared-core"), "red-use");
	assert.equal(metricsProfileForGroup("support"), "support");
});

test("TrueNAS and Architecture expose the same scalable service-first controls", async () => {
	const [truenasSource, architectureSource, styles] = await Promise.all([
		readFile("app/components/homelab/HomelabServicesBlock.tsx", "utf8"),
		readFile("app/[locale]/architecture/ArchitectureTopologyView.tsx", "utf8"),
		readFile("app/components/homelab/HomelabServicesBlock.module.css", "utf8"),
	]);

	for (const source of [truenasSource, architectureSource]) {
		assert.match(source, /presentation\.searchLabel/);
		assert.match(source, /presentation\.filterLabel/);
		assert.match(source, /service-first|Services stay first|services restent la finalité/i);
	}
	assert.match(truenasSource, /data-service-presentation-group/);
	assert.match(styles, /metricsProfileBadge/);
	assert.match(styles, /data-needs-attention/);
});
