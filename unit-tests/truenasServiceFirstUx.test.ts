import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string): Promise<string> {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("TrueNAS services are the primary surface and operations are secondary", async () => {
	const section = await source(
		"app/components/homelab/HomelabServicesSection.tsx",
	);
	const disclosure = await source(
		"app/components/homelab/HomelabOperationsDisclosure.tsx",
	);
	const styles = await source(
		"app/components/homelab/HomelabServicesSection.module.css",
	);

	const servicesIndex = section.indexOf("<HomelabServicesBlock");
	const operationsIndex = section.indexOf("<HomelabOperationsDisclosure");
	assert.ok(servicesIndex >= 0, "services block must be rendered");
	assert.ok(operationsIndex > servicesIndex, "operations must follow services");
	assert.match(section, /data-service-first-homelab-view/);
	assert.doesNotMatch(section, /<HomelabOperationalEvidence/);

	assert.match(disclosure, /<details/);
	assert.match(disclosure, /data-homelab-operations-disclosure/);
	assert.doesNotMatch(disclosure, /<details[^>]+open=/);
	assert.match(disclosure, /HomelabObservationCoverage/);
	assert.match(disclosure, /HomelabProbeDiagnostics/);
	assert.match(disclosure, /HomelabOperationalEvidence/);
	assert.match(disclosure, /if \(!open \|\| coverage\.loaded\) return/);
	assert.match(disclosure, /open \? <HomelabOperationalEvidence \/> : null/);
	assert.match(
		disclosure,
		/const OPERATIONS_ANCHOR = "operational-evidence-title"/,
	);
	assert.match(disclosure, /window\.location\.hash/);
	assert.match(disclosure, /detailsRef\.current\.open = true/);
	assert.match(disclosure, /id=\{open \? undefined : OPERATIONS_ANCHOR\}/);

	for (const secondarySignal of [
		"data-homelab-observer-summary",
		"data-homelab-operator-diagnostics",
		"data-homelab-status-legend",
		"data-truenas-runtime-legend",
		"data-dependency-health-legend",
	]) {
		assert.ok(
			styles.includes(secondarySignal),
			`primary service surface should hide ${secondarySignal}`,
		);
	}
	assert.match(styles, /display: none !important/);
});

test("TrueNAS service presentation borrows the shared hardware section language", async () => {
	const [section, sharedHeading, styles] = await Promise.all([
		source("app/components/homelab/HomelabServicesSection.tsx"),
		source("components/SectionHeading.module.css"),
		source("app/components/homelab/HomelabServicesSection.module.css"),
	]);

	assert.match(section, /<SectionHeading id=\{headingId\} iconClass="fa-server">/);
	assert.doesNotMatch(section, /fa-cubes-stacked/);
	assert.match(section, /fa-heart-pulse/);
	assert.match(section, /fa-diagram-project/);
	assert.match(sharedHeading, /color: var\(--ui-link\)/);
	assert.match(sharedHeading, /font-size: clamp\(2\.25rem, 4\.5vw, 3\.5rem\)/);
	assert.match(styles, /service-card-ux/);
	assert.match(styles, /data-effective-health="ok"/);
	assert.match(styles, /data-effective-health="warn"/);
	assert.match(styles, /data-effective-health="fail"/);
	assert.match(styles, /data-homelab-health-filter="ok"/);
	assert.match(styles, /box-shadow/);
});

test("critical hierarchy and operations disclosure use the same document surface language", async () => {
	const [hierarchy, hierarchyStyles, operationsStyles] = await Promise.all([
		source("app/components/homelab/CriticalDependencyHierarchy.tsx"),
		source("app/components/homelab/CriticalDependencyHierarchy.module.css"),
		source("app/components/homelab/HomelabOperationsDisclosure.module.css"),
	]);

	for (const marker of ["summaryIcon", "summaryText", "summaryHint"]) {
		assert.match(hierarchy, new RegExp(`styles\\.${marker}`));
		assert.match(hierarchyStyles, new RegExp(`\\.${marker}\\b`));
		assert.match(operationsStyles, new RegExp(`\\.${marker}\\b`));
	}
	assert.match(hierarchyStyles, /var\(--ui-surface-card\)/);
	assert.match(operationsStyles, /var\(--ui-surface-card\)/);
});

test("homelab status callouts use the shared high-contrast status surface", async () => {
	const [dns, reasons, overview, statusStyles] = await Promise.all([
		source("app/components/homelab/PfSenseDnsPosture.tsx"),
		source("app/components/homelab/ServiceHealthReasons.tsx"),
		source("app/components/homelab/HomelabStatusOverview.tsx"),
		source("app/components/homelab/HomelabStatusSurface.module.css"),
	]);

	for (const component of [dns, reasons, overview]) {
		assert.match(component, /HomelabStatusSurface\.module\.css/);
	}
	for (const stateClass of ["ok", "warn", "fail", "info", "unknown"]) {
		assert.match(statusStyles, new RegExp(`\\.${stateClass}\\b`));
	}
	assert.match(statusStyles, /border-left-width: 4px/);
	assert.match(statusStyles, /var\(--ui-text-primary\)/);
	assert.match(overview, /data-homelab-status-legend/);
});
