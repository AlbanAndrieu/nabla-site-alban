import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("operational evidence facade composes cohesive parser owners", async () => {
	const [
		facade,
		types,
		shared,
		components,
		pfsense,
		exposure,
		providers,
		freshness,
		troubleshooting,
	] = await Promise.all([
		source("lib/homelabOperationalEvidence.ts"),
		source("lib/homelabOperationalEvidenceTypes.ts"),
		source("lib/homelabOperationalEvidenceShared.ts"),
		source("lib/homelabOperationalComponents.ts"),
		source("lib/homelabOperationalPfSense.ts"),
		source("lib/homelabOperationalExposure.ts"),
		source("lib/homelabOperationalProviders.ts"),
		source("lib/homelabOperationalFreshness.ts"),
		source("lib/homelabOperationalTroubleshooting.ts"),
	]);

	for (const owner of [
		"parseOperationalComponents",
		"parsePfSensePosture",
		"parseExposurePorts",
		"parseProviderCredentials",
		"parseOperationalFreshness",
		"deriveTroubleshootingFocus",
	]) {
		assert.match(facade, new RegExp(owner));
	}
	assert.match(types, /export type HomelabOperationalEvidence/);
	assert.match(shared, /export function isRecord/);
	assert.match(components, /export function parseOperationalComponents/);
	assert.match(pfsense, /export function parsePfSensePosture/);
	assert.match(exposure, /export function parseExposurePorts/);
	assert.match(providers, /export function parseProviderCredentials/);
	assert.match(freshness, /export function parseOperationalFreshness/);
	assert.match(troubleshooting, /export function deriveTroubleshootingFocus/);

	assert.doesNotMatch(facade, /function parseIngressBlock/);
	assert.doesNotMatch(facade, /function componentEvidence/);
	assert.doesNotMatch(facade, /function exposureState/);
	assert.doesNotMatch(facade, /function freshnessEvidence/);
	assert.doesNotMatch(facade, /function troubleshootFocus/);
});
