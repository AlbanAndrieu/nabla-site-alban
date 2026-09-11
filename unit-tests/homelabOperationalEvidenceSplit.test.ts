import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string): Promise<string> {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("operational evidence keeps a thin compatibility facade over cohesive parsers", async () => {
	const [
		facade,
		components,
		pfsense,
		exposure,
		credentials,
		freshness,
		types,
	] = await Promise.all([
		source("lib/homelabOperationalEvidence.ts"),
		source("lib/homelabOperationalComponents.ts"),
		source("lib/homelabOperationalPfSense.ts"),
		source("lib/homelabOperationalExposure.ts"),
		source("lib/homelabOperationalCredentials.ts"),
		source("lib/homelabOperationalFreshness.ts"),
		source("lib/homelabOperationalEvidenceTypes.ts"),
	]);

	for (const parser of [
		"parseOperationalComponents",
		"parsePfSensePosture",
		"parseExposurePorts",
		"parseProviderCredentials",
		"parseFreshnessEvidence",
		"deriveTroubleshootingFocus",
	]) {
		assert.match(facade, new RegExp(parser));
	}
	assert.match(facade, /homelabOperationalEvidenceTypes/);
	assert.doesNotMatch(facade, /function parseIngressBlock/);
	assert.doesNotMatch(facade, /pfsense_tcp_port_policy/);
	assert.doesNotMatch(facade, /dependency_cycle/);
	assert.doesNotMatch(facade, /provider_credentials/);

	assert.match(components, /function deriveComponentState/);
	assert.match(pfsense, /function parseIngressBlock/);
	assert.match(exposure, /pfsense_tcp_port_policy/);
	assert.match(credentials, /provider_credentials/);
	assert.match(freshness, /dependency_cycle/);
	assert.match(types, /export type HomelabOperationalEvidence/);
});
