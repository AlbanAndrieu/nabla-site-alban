import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseHomelabDiagnostics } from "../lib/homelabDiagnostics";
import type { HomelabHealthEntry } from "../lib/homelabHealth";
import {
	affectedDependents,
	explainHealth,
	incidentDependencyPath,
} from "../lib/homelabImpact";
import { parseRuntimeTopology } from "../lib/runtimeTopology";
import type { ServiceTopology } from "../lib/serviceTopology";

const topology: ServiceTopology = {
	version: 1,
	name: "test",
	nodes: [
		{ id: "postgresql", name: "PostgreSQL", kind: "database", category: "data" },
		{ id: "langfuse", name: "Langfuse", kind: "app", category: "app" },
		{ id: "gateway", name: "Gateway", kind: "app", category: "app" },
	],
	relations: [
		{
			source: "langfuse",
			target: "postgresql",
			type: "dependsOn",
			strength: "required",
			evidence: ["compose"],
		},
		{
			source: "gateway",
			target: "langfuse",
			type: "consumesApi",
			strength: "required",
			evidence: ["topology"],
		},
	],
};

const postgresql: HomelabHealthEntry = {
	id: "postgresql",
	name: "PostgreSQL",
	url: "https://postgresql.example.com",
	reachable: false,
	http_status: 0,
	state: "fail",
	local_state: "fail",
	effective_state: "fail",
};
const langfuse: HomelabHealthEntry = {
	id: "langfuse",
	name: "Langfuse",
	url: "https://langfuse.example.com",
	reachable: true,
	http_status: 200,
	state: "warn",
	local_state: "ok",
	effective_state: "warn",
	blocked_by: ["postgresql"],
	dependency_evidence: [
		{
			target: "postgresql",
			target_name: "PostgreSQL",
			relation_type: "dependsOn",
			target_state: "fail",
			evidence: ["compose"],
		},
	],
};

test("runtime topology parser preserves observed-count semantics and egress sets", () => {
	const snapshot = parseRuntimeTopology({
		provider: "FastAPI Cloud",
		observed_at: "2026-09-03T00:00:00Z",
		platform_replica_count: null,
		platform_replica_count_available: false,
		count_semantics: "Observed active application runtimes; not control-plane replicas.",
		observed_instance_count: 2,
		instances: [
			{ id: "runtime-a", egress_ip: "52.1.1.1", egress_observed: true },
			{ id: "runtime-b", egress_ip: "34.2.2.2", egress_observed: true },
		],
		active_egress_ips: ["52.1.1.1", "34.2.2.2"],
		recent_egress_ips: ["52.1.1.1", "34.2.2.2"],
		aggregation: "redis_heartbeat",
		degraded: false,
	});

	assert.ok(snapshot);
	assert.equal(snapshot.observed_instance_count, 2);
	assert.equal(snapshot.platform_replica_count_available, false);
	assert.deepEqual(snapshot.active_egress_ips, ["52.1.1.1", "34.2.2.2"]);
});

test("diagnostic parser preserves current failures separately from stale last-good evidence", () => {
	const diagnostics = parseHomelabDiagnostics({
		checked_at: "2026-09-03T00:00:00Z",
		truenas: {
			api: {
				reachable: false,
				phase: "connect",
				stage: "tls_handshake_timeout",
				error: "TLS handshake timed out",
				exception_type: "TimeoutError",
				cached: true,
				cache_layer: "redis",
				cache_age_seconds: 42,
				stale: true,
				refresh_in_progress: false,
				redis_available: true,
				last_success_at: "2026-09-02T23:59:00Z",
				last_good: {
					version: "26.0",
					last_success_at: "2026-09-02T23:59:00Z",
					apps: [
						{ name: "open-webui", state: "RUNNING" },
						{ name: "langfuse", state: "STOPPED" },
					],
				},
			},
		},
		pfsense: {
			dns: {
				ingress_block: {
					state: "telemetry_stale",
					telemetry_available: true,
					attribution_available: false,
					stale: true,
					cached: true,
					cache_layer: "redis",
					refresh_in_progress: false,
					redis_available: true,
					attempts: 2,
					failure_stage: "response",
					error_kind: "read_timeout",
					exception_type: "ReadTimeout",
					refresh_error: "timeout",
					last_success_at: "2026-09-02T23:58:00Z",
					last_known_match: true,
					evidence: "Last-known-good snort2c table retained; current attribution withheld",
				},
			},
		},
		services: [],
	});

	assert.ok(diagnostics);
	assert.equal(diagnostics.truenas_api?.stage, "tls_handshake_timeout");
	assert.equal(diagnostics.truenas_api?.error, "TLS handshake timed out");
	assert.equal(diagnostics.truenas_api?.cache_layer, "redis");
	assert.equal(diagnostics.truenas_api?.last_good_available, true);
	assert.equal(diagnostics.truenas_api?.last_good?.version, "26.0");
	assert.equal(diagnostics.truenas_api?.last_good?.app_count, 2);
	assert.equal(diagnostics.truenas_api?.last_good?.running_app_count, 1);
	assert.equal(diagnostics.truenas_api?.last_good?.non_running_app_count, 1);
	assert.equal(diagnostics.pfsense_ingress?.state, "telemetry_stale");
	assert.equal(diagnostics.pfsense_ingress?.attribution_available, false);
	assert.equal(diagnostics.pfsense_ingress?.error_kind, "read_timeout");
	assert.equal(diagnostics.pfsense_ingress?.cache_layer, "redis");
	assert.equal(diagnostics.pfsense_ingress?.last_known_match, true);
});

test("exposure parser separates policy mismatch from functional health", () => {
	const diagnostics = parseHomelabDiagnostics({
		services: [
			{
				id: "openwebui",
				exposure: {
					state: "mismatch",
					reasons: ["Cloudflare Access is required but not observed"],
					declared: {
						external: true,
						edge_mode: "cloudflare",
						cloudflare_access_required: true,
					},
					observed: {
						public_https_reachable: true,
						cloudflare_tunnel_observed: true,
						cloudflare_access_observed: false,
					},
				},
			},
		],
	});

	assert.equal(diagnostics?.exposure_by_service.openwebui.state, "mismatch");
	assert.equal(
		diagnostics?.exposure_by_service.openwebui.observed.public_https_reachable,
		true,
	);
});

test("blast radius follows required health-bearing relations in reverse", () => {
	const impacts = affectedDependents(topology, "postgresql");
	assert.deepEqual(
		impacts.map(({ id, distance }) => ({ id, distance })),
		[
			{ id: "langfuse", distance: 1 },
			{ id: "gateway", distance: 2 },
		],
	);
});

test("root-cause helper separates observed cause path from structural impact", () => {
	assert.equal(explainHealth(langfuse)[0].code, "dependency_failure");
	assert.deepEqual(incidentDependencyPath(langfuse, [langfuse, postgresql]), [
		"langfuse",
		"postgresql",
	]);
});

async function source(path: string): Promise<string> {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("service troubleshooting exposes stable anchors, causal explanation and blast radius", async () => {
	const component = await source(
		"app/components/homelab/ServiceTroubleshootingEvidence.tsx",
	);
	assert.match(component, /const detailsId = `service-\$\{serviceId\}`/);
	assert.match(component, /useAnchoredDetails\(detailsId\)/);
	assert.match(component, /id=\{detailsId\}/);
	assert.match(component, /data-status-explanation/);
	assert.match(component, /data-service-exposure-evidence/);
	assert.match(component, /data-incident-dependency-path/);
	assert.match(component, /data-affected-dependents/);
});

test("operational evidence distinguishes current probe failure from historical last-good evidence", async () => {
	const component = await source(
		"app/components/homelab/HomelabOperationalEvidence.tsx",
	);
	assert.match(component, /data-current-probe-failure/);
	assert.match(component, /data-last-good-evidence/);
	assert.match(component, /data-pfsense-last-known-match/);
	assert.match(component, /pfsenseIngress\.evidence/);
});

test("architecture exposes an anchored impact and root-cause inspector", async () => {
	const page = await source("app/[locale]/architecture/page.tsx");
	const inspector = await source(
		"app/[locale]/architecture/ArchitectureImpactInspector.tsx",
	);
	const nav = await source("app/[locale]/architecture/ArchitectureSectionNav.tsx");
	assert.match(page, /ArchitectureImpactInspector/);
	assert.match(inspector, /id="service-impact-inspector"/);
	assert.match(inspector, /Show affected dependents/);
	assert.match(inspector, /#service-/);
	assert.match(nav, /service-impact-inspector/);
});
