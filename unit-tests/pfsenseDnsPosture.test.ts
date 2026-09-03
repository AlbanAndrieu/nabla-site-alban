import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseHomelabHealthSnapshot } from "../lib/homelabHealth";

const BASE_SNAPSHOT = {
	schema_version: 5,
	checked_at: "2026-08-28T01:00:00Z",
	services: [],
};

test("parser preserves only sanitized pfSense DNS posture fields", () => {
	const snapshot = parseHomelabHealthSnapshot({
		...BASE_SNAPSHOT,
		pfsense: {
			dns: {
				configured: true,
				reachable: true,
				policy_state: "warn",
				reason: "pfSense forwarding depends only on TrueNAS-hosted DNS",
				resolver: {
					enabled: true,
					running: true,
					forwarding: true,
					forward_tls_upstream: false,
					port: 53,
				},
				upstream: {
					count: 1,
					independent_from_truenas: false,
					truenas_only: true,
				},
				raw_config: { dnsserver: ["172.17.0.24"] },
				api_key: "must-never-reach-ui",
			},
		},
	});

	assert.ok(snapshot?.pfsense?.dns);
	assert.equal(snapshot.pfsense.dns.policy_state, "warn");
	assert.equal(snapshot.pfsense.dns.upstream?.truenas_only, true);
	assert.equal(snapshot.pfsense.dns.upstream?.count, 1);
	assert.equal("raw_config" in snapshot.pfsense.dns, false);
	assert.equal("api_key" in snapshot.pfsense.dns, false);
});

test("malformed optional pfSense posture is dropped without losing service health", () => {
	const snapshot = parseHomelabHealthSnapshot({
		...BASE_SNAPSHOT,
		pfsense: {
			dns: {
				configured: true,
				reachable: true,
				policy_state: "green",
				reason: "invalid state",
			},
		},
	});

	assert.ok(snapshot);
	assert.equal(snapshot.pfsense, undefined);
	assert.deepEqual(snapshot.services, []);
});

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("DNS resilience is rendered by unified operational evidence instead of a standalone service-grid panel", async () => {
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const operations = await source("app/components/homelab/HomelabOperationalEvidence.tsx");
	const observability = await source("lib/homelabObservability.ts");

	assert.match(block, /parseHomelabHealthSnapshot\(await response\.json\(\)\)/);
	assert.doesNotMatch(block, /PfSenseDnsPosture/);
	assert.equal(block.match(/setInterval\(/g)?.length, 1);
	assert.match(observability, /healthSnapshot:\s*HomelabHealthSnapshot/);
	assert.match(observability, /parseHomelabHealthSnapshot\(board\.homelab\)/);
	assert.match(operations, /import PfSenseDnsPosture/);
	assert.match(operations, /snapshot=\{evidence\.healthSnapshot\}/);
	assert.match(operations, /data-pfsense-security-evidence/);
});

test("DNS posture exposes explicit resilience states without raw network configuration", async () => {
	const component = await source("app/components/homelab/PfSenseDnsPosture.tsx");

	assert.match(component, /data-pfsense-dns-policy/);
	assert.match(component, /data-pfsense-dns-truenas-only/);
	assert.match(component, /dns\.independent/);
	assert.match(component, /dns\.truenasOnly/);
	assert.match(component, /dns\.resolverFailed/);
	assert.match(component, /dns\.unconfigured/);
	assert.match(component, /dns\.unreachable/);
	assert.match(component, /dns\.resolverRunning/);
	assert.match(component, /dns\.modeRecursive/);
	assert.match(component, /dns\.upstreamCount/);
	assert.doesNotMatch(component, /PFSENSE_API_KEY|dnsserver|172\.17\.0\.1/);
});