import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("TrueNAS service view keeps service hierarchy ahead of secondary operations", async () => {
	const section = await source("app/components/homelab/HomelabServicesSection.tsx");
	const disclosure = await source(
		"app/components/homelab/HomelabOperationsDisclosure.tsx",
	);
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");

	assert.match(section, /HomelabServicesBlock/);
	assert.match(section, /HomelabOperationsDisclosure/);
	assert.match(disclosure, /HomelabOperationalEvidence/);
	assert.match(disclosure, /data-homelab-operations-disclosure/);
	assert.match(block, /data-homelab-service-hierarchy/);
	assert.doesNotMatch(section, /HomelabOperationalEvidence/);
});

test("Operations keeps operational observer lazy until the disclosure is opened", async () => {
	const disclosure = await source(
		"app/components/homelab/HomelabOperationsDisclosure.tsx",
	);

	assert.match(disclosure, /const \[open, setOpen\] = useState\(false\)/);
	assert.match(disclosure, /\{open \? <HomelabOperationalEvidence \/> : null\}/);
	assert.match(disclosure, /loadHomelabHealthSnapshot/);
	assert.match(disclosure, /loadHomelabServicesCatalog/);
	assert.match(disclosure, /loadServiceTopology/);
});

test("Operations disclosure preserves the historical operational evidence anchor", async () => {
	const disclosure = await source(
		"app/components/homelab/HomelabOperationsDisclosure.tsx",
	);
	const operational = await source(
		"app/components/homelab/HomelabOperationalEvidence.tsx",
	);

	assert.match(disclosure, /operational-evidence-title/);
	assert.match(disclosure, /operational-evidence/);
	assert.match(disclosure, /useAnchoredDetails/);
	assert.match(operational, /id="operational-evidence"/);
	assert.match(operational, /id="operational-evidence-title"/);
});

test("Operations disclosure presents an attached critical-path badge", async () => {
	const disclosure = await source(
		"app/components/homelab/HomelabOperationsDisclosure.tsx",
	);
	const styles = await source(
		"app/components/homelab/HomelabOperationsDisclosure.module.css",
	);

	assert.match(disclosure, /data-operations-summary-critical-path/);
	assert.match(styles, /\.summary\s*\{/);
	assert.match(styles, /justify-content:\s*flex-start/);
	assert.doesNotMatch(styles, /justify-content:\s*space-between/);
});

test("TrueNAS status overview leads the service hierarchy and keeps runtime legends visible", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const overview = await source(
		"app/components/homelab/HomelabStatusOverview.tsx",
	);

	assert.match(block, /<HomelabStatusOverview/);
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
	const pfsenseDetails = await source(
		"app/components/homelab/HomelabOperationalPfSenseDetails.tsx",
	);

	assert.match(posture, /data-pfsense-dns-evidence/);
	assert.doesNotMatch(block, /PfSenseDnsPosture/);
	assert.match(operations, /HomelabOperationalPfSenseDetails/);
	assert.match(pfsenseDetails, /evidence\.pfsense\.reason/);
	assert.match(pfsenseDetails, /data-pfsense-security-evidence/);
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
});

test("healthy service rows stay compact while degraded rows expose reasons", async () => {
	const reasons = await source("app/components/homelab/ServiceHealthReasons.tsx");
	assert.match(reasons, /homelabHealthReasons/);
	assert.match(reasons, /if \(state === "ok"\)/);
	assert.match(reasons, /ServiceOperatorDiagnostics/);
});
