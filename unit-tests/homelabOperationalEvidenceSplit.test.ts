import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string): Promise<string> {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("operational evidence keeps its public contract while delegating heavy domains", async () => {
	const [facade, parsing, pfsense, exposure, freshness] = await Promise.all([
		source("lib/homelabOperationalEvidence.ts"),
		source("lib/homelabOperationalEvidenceParsing.ts"),
		source("lib/homelabOperationalPfSense.ts"),
		source("lib/homelabOperationalExposure.ts"),
		source("lib/homelabOperationalFreshness.ts"),
	]);

	assert.match(facade, /export type HomelabOperationalEvidence/);
	assert.match(facade, /function deriveComponentState/);
	assert.match(facade, /function parseProviderCredentials/);
	for (const parser of [
		"parsePfSensePosture",
		"parseExposurePorts",
		"parseFreshnessEvidence",
		"deriveTroubleshootingFocus",
	]) {
		assert.match(facade, new RegExp(parser));
	}
	assert.doesNotMatch(facade, /function parseIngressBlock/);
	assert.doesNotMatch(facade, /pfsense_tcp_port_policy/);
	assert.doesNotMatch(facade, /dependency_cycle/);

	assert.match(parsing, /export function isRecord/);
	assert.match(parsing, /export function healthState/);
	assert.match(pfsense, /function parseIngressBlock/);
	assert.match(exposure, /pfsense_tcp_port_policy/);
	assert.match(freshness, /dependency_cycle/);
});
