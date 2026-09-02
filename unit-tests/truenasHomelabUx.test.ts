import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("TrueNAS shows the visual homelab topology before the service catalog", async () => {
	const page = await source("app/[locale]/truenas/page.tsx");
	const visualIndex = page.indexOf("<HomeLabSection");
	const servicesIndex = page.indexOf("<HomelabServicesSection");

	assert.ok(visualIndex >= 0);
	assert.ok(servicesIndex >= 0);
	assert.ok(visualIndex < servicesIndex);
});

test("service tiers are filterable and collapsible while criticality details are opt-in", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const hierarchy = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);

	assert.match(block, /data-homelab-tier-filter/);
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
	assert.match(css, /justify-content:\s*flex-start/);
	assert.match(css, /\.summary::after/);
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

test("DNS posture exposes expandable evidence and explains independence requirements", async () => {
	const posture = await source("app/components/homelab/PfSenseDnsPosture.tsx");
	const messages = JSON.parse(await source("messages/homelab/en.json"));

	assert.match(posture, /data-pfsense-dns-evidence/);
	assert.match(posture, /posture\.reason/);
	assert.match(messages.homelab.dns.incomplete, /independent of TrueNAS/);
	assert.match(messages.homelab.dns.evidenceNote, /synthetic DNS query/);
});
