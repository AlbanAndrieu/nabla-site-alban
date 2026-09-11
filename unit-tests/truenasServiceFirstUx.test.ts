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

	for (const secondarySignal of [
		"data-homelab-observer-summary",
		"data-homelab-operator-diagnostics",
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

test("TrueNAS service presentation borrows the hardware card language", async () => {
	const section = await source(
		"app/components/homelab/HomelabServicesSection.tsx",
	);
	const styles = await source(
		"app/components/homelab/HomelabServicesSection.module.css",
	);

	assert.match(section, /fa-cubes-stacked/);
	assert.match(section, /fa-heart-pulse/);
	assert.match(section, /fa-diagram-project/);
	assert.match(styles, /service-card-ux/);
	assert.match(styles, /data-effective-health="ok"/);
	assert.match(styles, /data-effective-health="warn"/);
	assert.match(styles, /data-effective-health="fail"/);
	assert.match(styles, /data-homelab-health-filter="ok"/);
	assert.match(styles, /box-shadow/);
});
