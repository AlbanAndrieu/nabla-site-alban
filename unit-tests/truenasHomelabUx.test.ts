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

test("service views are searchable and collapsible while technical criticality stays opt-in", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const hierarchy = await source(
		"app/components/homelab/CriticalDependencyHierarchy.tsx",
	);

	assert.match(block, /data-homelab-presentation-filter/);
	assert.match(block, /data-homelab-service-search/);
	assert.match(block, /data-homelab-health-filter/);
	assert.match(block, /data-homelab-environment-filter/);
	assert.match(block, /non-dev/);
	assert.match(block, /resolveHomelabServiceEnvironments/);
	assert.match(block, /homelabServiceMatchesEnvironment/);
	assert.match(block, /defaulted/);
	assert.match(
		await source("lib/homelabEnvironments.ts"),
		/node\?\.environments/,
	);
	assert.match(block, /setEnvironmentFilter\("all"\)/);
	assert.doesNotMatch(
		await source("lib/homelabServices.ts"),
		/DEV_NAME_SUFFIX_RE/,
	);
	assert.match(block, /data-service-presentation-group/);
	assert.match(block, /setExpandedGroups/);
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
	const overview = await source(
		"app/components/homelab/HomelabStatusOverview.tsx",
	);

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
	const overview = await source(
		"app/components/homelab/HomelabStatusOverview.tsx",
	);

	assert.match(block, /healthRefreshing: true/);
	assert.match(block, /healthRefreshing: false/);
	assert.match(overview, /data-homelab-health-refreshing/);
	assert.match(overview, /runtimeObservationIncomplete/);
});

test("DNS posture remains sanitized while Operations owns the active presentation", async () => {
	const posture = await source("app/components/homelab/PfSenseDnsPosture.tsx");
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const operations = await source(
		"app/components/homelab/HomelabOperationalEvidence.tsx",
	);

	assert.match(posture, /data-pfsense-dns-evidence/);
	assert.doesNotMatch(block, /PfSenseDnsPosture/);
	assert.match(operations, /evidence\.pfsense\.reason/);
	assert.match(operations, /data-pfsense-security-evidence/);
});

test("TrueNAS exposes runtime observation and internal probe coverage", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const coverage = await source(
		"app/components/homelab/HomelabObservationCoverage.tsx",
	);

	assert.match(block, /HomelabObservationCoverage/);
	assert.match(block, /catalogServiceCount={state\.catalog\.services\.length}/);
	assert.match(coverage, /data-homelab-observer-summary/);
	assert.match(coverage, /data-internal-probe-count/);
	assert.match(coverage, /internal_services\?\.length/);
	assert.match(coverage, /probe_summary/);
	assert.match(coverage, /sampled/);
	assert.match(coverage, /eligible/);
	assert.match(coverage, /rotating_sample/);
	assert.match(coverage, /scheduled/);
	assert.match(coverage, /completed/);
	assert.match(coverage, /timed_out/);
	assert.match(coverage, /max_concurrency/);
	assert.match(coverage, /budget_seconds/);
	assert.match(coverage, /data-public-probe-count/);
	assert.match(coverage, /data-probe-cache-freshness/);
	assert.match(coverage, /data-health-board-freshness/);
	assert.match(coverage, /data-reconciliation-provenance/);
	assert.match(coverage, /cloudflare_tunnels_observed/);
	assert.match(coverage, /refresh_elapsed_ms/);
	assert.match(coverage, /dependency_evidence/);
});

test("homelab renders bounded probes before aggregate enrichment", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const probeProxy = await source("app/api/homelab-probes/route.ts");

	const probeStart = block.indexOf(
		"const probesPromise = fetchProbeHealth(signal)",
	);
	const probeRender = block.indexOf("const probes = await probesPromise");
	const aggregateRender = block.indexOf(
		"const aggregate = await aggregatePromise",
	);
	assert.ok(probeStart >= 0);
	assert.ok(probeRender > probeStart);
	assert.ok(aggregateRender > probeRender);
	assert.match(block, /fetch\("\/api\/homelab-probes"/);
	assert.match(block, /"Cache-Control": "no-cache"/);
	assert.match(probeProxy, /loadHomelabProbeSnapshot/);
	assert.match(probeProxy, /"Cache-Control": "no-store, max-age=0"/);
});

test("homelab exposes rolling probe evidence coverage from FastAPI", async () => {
	const coverage = await source(
		"app/components/homelab/HomelabObservationCoverage.tsx",
	);
	assert.match(coverage, /data-internal-probe-evidence/);
	assert.match(coverage, /data-public-probe-evidence/);
	assert.match(coverage, /coverage_percent/);
	assert.match(coverage, /evidence_ttl_seconds/);
	assert.match(coverage, /fresh/);
	assert.match(coverage, /cached/);
});
