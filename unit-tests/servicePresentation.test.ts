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
		{
			id: "experiment",
			name: "Experiment",
			kind: "application",
			category: "lab",
		},
		{
			id: "postgresql",
			name: "PostgreSQL",
			kind: "database",
			category: "data",
		},
		{
			id: "crowdsec",
			name: "CrowdSec",
			kind: "security-agent",
			category: "security",
		},
		{
			id: "prometheus",
			name: "Prometheus",
			kind: "observability",
			category: "observability",
		},
		{
			id: "talos",
			name: "Talos",
			kind: "kubernetes-os",
			category: "infrastructure",
		},
		{
			id: "keycloak",
			name: "Keycloak",
			kind: "identity-provider",
			category: "security",
			presentationRole: "core",
			criticality: "critical",
		},
		{
			id: "homarr",
			name: "Homarr",
			kind: "dashboard",
			category: "operations",
			presentationRole: "support",
			criticality: "medium",
		},
		{
			id: "pfsense",
			name: "pfSense",
			kind: "firewall",
			category: "security",
			presentationRole: "core",
			criticality: "critical",
		},
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
		{
			id: "experiment",
			name: "Experiment",
			kind: "application",
			category: "lab",
		},
		{
			id: "postgresql",
			name: "PostgreSQL",
			kind: "database",
			category: "data",
		},
		{
			id: "crowdsec",
			name: "CrowdSec",
			kind: "security-agent",
			category: "security",
		},
		{
			id: "prometheus",
			name: "Prometheus",
			kind: "observability",
			category: "observability",
		},
		{
			id: "talos",
			name: "Talos",
			kind: "kubernetes-os",
			category: "infrastructure",
			presentationRole: "core",
			criticality: "critical",
		},
		{
			id: "keycloak",
			name: "Keycloak",
			kind: "identity-provider",
			category: "security",
			presentationRole: "core",
			criticality: "critical",
		},
		{
			id: "homarr",
			name: "Homarr",
			kind: "dashboard",
			category: "operations",
			presentationRole: "support",
			criticality: "medium",
		},
		{
			id: "pfsense",
			name: "pfSense",
			kind: "firewall",
			category: "security",
			presentationRole: "core",
			criticality: "critical",
		},
		{
			id: "explicit-service",
			name: "Explicit service",
			kind: "database",
			category: "data",
		},
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
			target: "prometheus",
			type: "dependsOn",
			strength: "required",
			evidence: ["fixture"],
		},
		{
			source: "experiment",
			target: "homarr",
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
	assert.equal(analysis.get("homarr")?.group, "support");
	assert.equal(analysis.get("explicit-service")?.group, "services");
});

test("canonical security category can group critical controls without weakening criticality", () => {
	const analysis = analyzeServicePresentation(catalog, topology);

	assert.equal(analysis.get("keycloak")?.role, "core");
	assert.equal(analysis.get("keycloak")?.criticality, "critical");
	assert.equal(analysis.get("keycloak")?.group, "security-controls");
	assert.equal(analysis.get("keycloak")?.metricsProfile, "security");

	assert.equal(analysis.get("pfsense")?.criticality, "critical");
	assert.equal(analysis.get("pfsense")?.group, "core-critical");
});

test("canonical support and observability presentation wins over blast radius", () => {
	const analysis = analyzeServicePresentation(catalog, topology);

	assert.equal(analysis.get("homarr")?.transitiveDependents, 1);
	assert.equal(analysis.get("homarr")?.role, "support");
	assert.equal(analysis.get("homarr")?.group, "support");

	assert.equal(analysis.get("prometheus")?.transitiveDependents, 1);
	assert.equal(analysis.get("prometheus")?.role, "core");
	assert.equal(analysis.get("prometheus")?.group, "support");
});

test("service-first grouping keeps user outcomes first while lifecycle priority orders peers", () => {
	const groups = groupCatalogByPresentation(catalog, topology);
	assert.deepEqual(
		groups.map((group) => group.group),
		[
			"services",
			"core-critical",
			"security-controls",
			"shared-core",
			"support",
		],
	);
	assert.deepEqual(
		groups[0]?.catalog.services.map((service) => service.id),
		["explicit-service", "experiment"],
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
		assert.match(
			source,
			/service-first|Services stay first|services restent la finalité/i,
		);
	}
	assert.match(truenasSource, /data-service-presentation-group/);
	assert.match(styles, /metricsProfileBadge/);
	assert.match(styles, /data-needs-attention/);
});
