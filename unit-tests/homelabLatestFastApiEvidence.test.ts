import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string): Promise<string> {
	return readFile(path, "utf8");
}

test("operations UI consumes the latest FastAPI runtime and pfSense evidence", async () => {
	const [
		component,
		runtimeParser,
		observability,
		observabilityTypes,
		controlPlane,
		enRaw,
		frRaw,
	] = await Promise.all([
		source("app/components/homelab/HomelabOperationalEvidence.tsx"),
		source("lib/runtimeTopology.ts"),
		source("lib/homelabObservability.ts"),
		source("lib/homelabObservabilityTypes.ts"),
		source("lib/homelabObservabilityControlPlane.ts"),
		source("messages/operations/en.json"),
		source("messages/operations/fr.json"),
	]);

	assert.match(runtimeParser, /RuntimeRedisEvidence/);
	assert.match(runtimeParser, /runtime_mode/);
	assert.match(runtimeParser, /keyspace_hit_rate_percent/);
	assert.match(observabilityTypes, /PfSenseIngressPolicyEvidence/);
	assert.match(controlPlane, /possible_causes/);
	assert.match(controlPlane, /http_evidence_skipped/);
	assert.match(observability, /parsePfSenseIngressPolicy/);

	assert.match(component, /data-runtime-redis-evidence/);
	assert.match(component, /data-pfsense-ingress-policy/);
	assert.match(component, /data-edge-evidence-skips/);
	assert.doesNotMatch(component, /<h3>FastAPI Cloud<\/h3>/);

	for (const raw of [enRaw, frRaw]) {
		const messages = JSON.parse(raw) as {
			operations?: {
				runtime?: { fastapi?: string; redis?: { title?: string } };
				pfsense?: { ingressPolicy?: { title?: string; noAttribution?: string } };
				serviceExposure?: { skippedEdge?: string };
			};
		};
		assert.ok(messages.operations?.runtime?.fastapi);
		assert.ok(messages.operations?.runtime?.redis?.title);
		assert.ok(messages.operations?.pfsense?.ingressPolicy?.title);
		assert.ok(messages.operations?.pfsense?.ingressPolicy?.noAttribution);
		assert.ok(messages.operations?.serviceExposure?.skippedEdge);
	}
});
