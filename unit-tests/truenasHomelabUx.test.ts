import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("TrueNAS keeps homelab topology before services and moves Nabla project near the footer", async () => {
	const page = await source("app/[locale]/truenas/page.tsx");
	const visualIndex = page.indexOf("<HomeLabSection");
	const servicesIndex = page.indexOf("<HomelabServicesSection");
	const toolsIndex = page.indexOf("<ToolsSection");
	const nablaIndex = page.indexOf("<NablaProjectSection");

	assert.ok(visualIndex >= 0);
	assert.ok(servicesIndex >= 0);
	assert.ok(toolsIndex >= 0);
	assert.ok(nablaIndex >= 0);
	assert.ok(visualIndex < servicesIndex);
	assert.ok(nablaIndex > toolsIndex);
});

test("homelab network policy details are enriched but collapsed by default", async () => {
	const section = await source("app/components/truenas/HomeLabSection.tsx");

	assert.match(section, /<details className=\{styles\.networkDetails\}>/);
	assert.doesNotMatch(section, /<details[^>]*\sopen(?:=|\s|>)/);
	assert.match(section, /network\.tcp10443/);
	assert.match(section, /network\.tcp9922/);
	assert.match(section, /network\.sourcesNote/);
});

test("service tiers are filterable and collapsible while criticality details are opt-in", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const hierarchy = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);

	assert.match(block, /data-homelab-tier-filter/);
	assert.match(block, /data-homelab-health-filter/);
	assert.match(block, /data-service-criticality-group/);
	assert.match(block, /setExpandedTiers/);
	assert.match(block, /useState\(false\)/);
	assert.match(block, /<CriticalDependencyHierarchy/);
	assert.match(hierarchy, /data-criticality-toggle/);
	assert.match(hierarchy, /critical-dependency-hierarchy/);

	const hierarchyIndex = block.indexOf("data-homelab-service-hierarchy");
	const criticalityIndex = block.indexOf("<CriticalDependencyHierarchy");
	assert.ok(hierarchyIndex >= 0);
	assert.ok(criticalityIndex > hierarchyIndex);
});

test("critical dependency hierarchy keeps the disclosure arrow next to its label", async () => {
	const hierarchy = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);
	const css = await source(
		"app/components/homelab/CriticalDependencyHierarchy.module.css",
	);

	assert.match(hierarchy, /ServiceCriticalityOverview/);
	assert.match(hierarchy, /criticality\.showHierarchy/);
	assert.match(hierarchy, /criticality\.hideHierarchy/);
	assert.match(hierarchy, /styles\.chevron/);
	assert.match(css, /justify-content:\s*flex-start/);
	assert.match(css, /\.chevron/);
	assert.match(css, /\.details\[open\] \.chevron/);
	assert.doesNotMatch(css, /\.summary::after/);
	assert.doesNotMatch(css, /\.summary[\s\S]*justify-content:\s*space-between/);
});

test("runtime legend is promoted before service groups and links to criticality details", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const overview = await source("app/components/homelab/HomelabStatusOverview.tsx");

	assert.ok(
		block.indexOf("<HomelabStatusOverview") <
			block.indexOf("data-homelab-service-hierarchy"),
	);
	assert.match(overview, /data-truenas-runtime-legend/);
	assert.match(overview, /data-dependency-health-legend/);
	assert.match(overview, /href="#critical-dependency-hierarchy"/);
});

test("health refresh has a transient status distinct from unavailable runtime evidence", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const overview = await source("app/components/homelab/HomelabStatusOverview.tsx");

	assert.match(block, /healthRefreshing: true/);
	assert.match(block, /healthRefreshing: false/);
	assert.match(overview, /data-homelab-health-refreshing/);
	assert.match(overview, /runtimeObservationIncomplete/);
});

test("DNS posture remains sanitized while Operations owns the active presentation", async () => {
	const posture = await source("app/components/homelab/PfSenseDnsPosture.tsx");
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const operations = await source("app/components/homelab/HomelabOperationalEvidence.tsx");

	assert.match(posture, /data-pfsense-dns-evidence/);
	assert.doesNotMatch(block, /PfSenseDnsPosture/);
	assert.match(operations, /evidence\.pfsense\.reason/);
	assert.match(operations, /data-pfsense-security-evidence/);
});
