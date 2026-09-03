import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseHomelabHealthSnapshot } from "../lib/homelabHealth";

test("homelab health parser preserves troubleshooting evidence from FastAPI schema v5", () => {
	const parsed = parseHomelabHealthSnapshot({
		schema_version: 5,
		checked_at: "2026-09-02T20:00:00Z",
		refresh_elapsed_ms: 431,
		services: [
			{
				id: "openwebui",
				name: "Open WebUI",
				url: "https://openwebui.example.com/",
				reachable: true,
				http_status: 200,
				state: "warn",
				local_state: "ok",
				dependency_state: "unknown",
				effective_state: "warn",
				required_dependencies: ["litellm"],
				blocked_by: ["litellm"],
				dependency_cycle: [],
				observed_at: "2026-09-02T19:59:50Z",
				observation_age_seconds: 10,
				observation_stale: false,
				tunnel_status: "healthy",
				tunnel_name: "homelab",
				dependency_evidence: [
					{
						target: "litellm",
						target_name: "LiteLLM",
						relation_type: "consumesApi",
						target_state: "unknown",
						target_effective_state: "ok",
						target_observation_age_seconds: 180,
						target_observation_stale: true,
						evidence: ["nabla-compose"],
					},
				],
			},
		],
		cloudflare_configured: true,
		cloudflare_tunnels_observed: 2,
		pfsense: {
			dns: {
				configured: true,
				reachable: true,
				policy_state: "ok",
				reason: "pfSense DNS Resolver is running with a TrueNAS-independent path",
				security_filters: [{ id: "snort", label: "Snort", state: "clear", detail: "snort2c telemetry is reachable" }],
				ingress_block: {
					state: "clear",
					telemetry_available: true,
					attribution_available: true,
					engine: "snort",
					firewall: "pfSense/PF",
					mechanism: "snort2c",
					evidence: "Exact observed egress IP is not present in pfSense table snort2c",
					source: { ip: "198.51.100.10", role: "FastAPI Cloud egress (observed)" },
					destination: { ip: "203.0.113.10", port: 7000, role: "pfSense WAN / homelab public endpoint" },
					control_path: { mode: "shared_wan", independent_from_wan_filter: false, blind_spot: false, detail: "Security telemetry shares the pfSense WAN path" },
				},
			},
		},
	});

	assert.ok(parsed);
	assert.equal(parsed.refresh_elapsed_ms, 431);
	assert.equal(parsed.services[0]?.observation_age_seconds, 10);
	assert.equal(parsed.services[0]?.dependency_evidence?.[0]?.target_observation_stale, true);
	assert.equal(parsed.pfsense?.dns?.security_filters?.[0]?.state, "clear");
	assert.equal(parsed.pfsense?.dns?.ingress_block?.control_path?.mode, "shared_wan");
});

test("unified homelab UI owns platform troubleshooting while service evidence stays per-service", async () => {
	const unified = await readFile(new URL("../app/components/homelab/HomelabOperationalEvidence.tsx", import.meta.url), "utf8");
	const overview = await readFile(new URL("../app/components/homelab/HomelabStatusOverview.tsx", import.meta.url), "utf8");
	const service = await readFile(new URL("../app/components/homelab/ServiceTroubleshootingEvidence.tsx", import.meta.url), "utf8");
	const endpoint = await readFile(new URL("../app/components/homelab/EndpointAction.tsx", import.meta.url), "utf8");

	assert.match(unified, /data-runtime-transport-evidence/);
	assert.match(unified, /data-deep-diagnostics/);
	assert.match(unified, /data-pfsense-ingress-diagnostics/);
	assert.match(unified, /data-service-exposure-diagnostics/);
	assert.doesNotMatch(overview, /HomelabPlatformEvidence/);
	assert.match(service, /data-service-troubleshooting-evidence/);
	assert.match(service, /target_observation_stale/);
	assert.match(service, /dependency_cycle/);
	assert.match(endpoint, /ServiceTroubleshootingEvidence/);
});
