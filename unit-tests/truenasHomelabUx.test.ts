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

	assert.match(block, /data-homelab-tier-filter/);
	assert.match(block, /data-service-criticality-group/);
	assert.match(block, /setExpandedTiers/);
	assert.match(block, /useState\(false\)/);
	assert.match(block, /data-criticality-toggle/);
	assert.match(block, /critical-dependency-hierarchy/);

	const hierarchyIndex = block.indexOf("data-homelab-service-hierarchy");
	const criticalityIndex = block.indexOf("data-criticality-toggle");
	assert.ok(hierarchyIndex >= 0);
	assert.ok(criticalityIndex > hierarchyIndex);
});

test("runtime legend is promoted before service groups and links to criticality details", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const overview = await source("app/components/homelab/HomelabStatusOverview.tsx");

	assert.ok(block.indexOf("<HomelabStatusOverview") < block.indexOf("data-homelab-service-hierarchy"));
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
