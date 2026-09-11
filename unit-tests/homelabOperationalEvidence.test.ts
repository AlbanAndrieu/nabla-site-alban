import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseFastApiHealthBoard } from "../lib/fastApiHealthBoard";
import { parseHomelabOperationalEvidence } from "../lib/homelabOperationalEvidence";

test("operational evidence surfaces pfSense, Cloudflare, freshness and source-aware exposure", () => {
	const board = parseFastApiHealthBoard({
		schema_version: 1,
		state: "fresh",
		refreshing: false,
		generated_at: "2026-09-02T21:00:00Z",
		age_seconds: 4,
		error: null,
		runtime: null,
		healthz: {},
		homelab: {
			components_status: "degraded",
			refresh_elapsed_ms: 912,
			components: {
				truenas: { reachable: true, state: "ok", tls_trusted: true },
				pfsense: {
					reachable: true,
					stale: true,
					refresh_error: "read timeout",
					last_success_at: "2026-09-02T20:59:30Z",
					credential_mode: "dedicated_posture",
				},
				cloudflare: {
					reachable: true,
					degraded: true,
					tunnel_count: 2,
					healthy_tunnels: 1,
					unhealthy_tunnels: 1,
					tunnel_statuses: ["healthy", "down"],
				},
			},
			provider_credentials: {
				pfsense_security: {
					provider: "pfsense_security",
					configured: true,
					configuration_stage: "configured",
					credential_mode: "dedicated",
					required_privilege: "api-v2-diagnostics-table-get",
					write_privileges_required: false,
					api_key: "MUST_NOT_ESCAPE",
				},
			},
			pfsense: {
				dns: {
					configured: true,
					reachable: true,
					policy_state: "ok",
					reason:
						"pfSense DNS Resolver is running with a TrueNAS-independent path",
					security_filters: [
						{
							id: "firewall",
							label: "pfSense/PF firewall",
							state: "blocked",
							detail: "PF is enforcing the snort2c block",
						},
						{
							id: "snort",
							label: "Snort",
							state: "blocked",
							detail: "Observed FastAPI egress is present in snort2c",
						},
					],
					ingress_block: {
						state: "blocked",
						telemetry_available: true,
						attribution_available: true,
						engine: "snort",
						firewall: "pfSense/PF",
						mechanism: "snort2c",
						source: { ip: "203.0.113.10" },
						destination: { ip: "198.51.100.20", port: 7000 },
						evidence:
							"Exact observed egress IP is present in pfSense table snort2c",
						control_path: {
							mode: "shared_wan",
							independent_from_wan_filter: false,
							blind_spot: false,
						},
					},
				},
			},
			services: [
				{
					id: "api",
					name: "API",
					observation_stale: true,
					observation_age_seconds: 120,
					dependency_cycle: ["api", "database"],
				},
				{
					id: "database",
					name: "Database",
					dependency_cycle: ["database", "api"],
				},
			],
		},
		sickz: {
			checks: {
				pfsense: {
					pfsense_tcp_ports: { "7000": true, "10443": true },
					pfsense_tcp_port_policy: {
						"7000": {
							service: "TrueNAS via pfSense HAProxy",
							expected_reachable: true,
							access_policy: "trusted_sources_only",
							default_action: "deny",
							expected_from: ["fastapi_cloud", "approved_admin_sources"],
							negative_probe_required: true,
						},
						"10443": {
							service: "pfSense Admin/API",
							expected_reachable: true,
							access_policy: "trusted_sources_only",
							default_action: "deny",
							negative_probe_required: true,
						},
					},
				},
			},
		},
	});
	assert.ok(board);

	const evidence = parseHomelabOperationalEvidence(board);
	assert.equal(evidence.troubleshootingFocus, "pfsense_block");
	assert.equal(evidence.pfsense?.ingressBlock?.sourceIp, "203.0.113.10");
	assert.equal(evidence.pfsense?.securityFilters.length, 2);
	assert.equal(
		evidence.components.find((item) => item.id === "pfsense")?.state,
		"warn",
	);
	assert.equal(
		evidence.components.find((item) => item.id === "cloudflare")?.state,
		"warn",
	);
	assert.equal(evidence.exposurePorts.length, 2);
	assert.equal(evidence.exposurePorts[0]?.state, "warn");
	assert.equal(evidence.staleServices[0]?.name, "API");
	assert.deepEqual(evidence.dependencyCycles, [
		{ members: ["API", "Database"] },
	]);
	assert.equal(
		evidence.providerCredentials[0]?.requiredPrivilege,
		"api-v2-diagnostics-table-get",
	);
	assert.doesNotMatch(JSON.stringify(evidence), /MUST_NOT_ESCAPE/);
});

test("same-origin health proxy prefers fresh health-board evidence without letting stale data mask fresher paths", async () => {
	const source = await readFile(
		new URL("../app/api/homelab-health/route.ts", import.meta.url),
		"utf8",
	);
	assert.match(source, /loadFastApiHealthBoard/);
	assert.match(
		source,
		/parseHomelabHealthSnapshot\(boardResult\.board\?\.homelab\)/,
	);
	assert.match(source, /fastapi-health-board/);
	assert.match(source, /boardResult\.board\?\.state === "fresh"/);
	assert.match(source, /loadHomelabHealthSnapshot/);
	assert.match(source, /loadHomelabProbeSnapshot/);
	assert.match(source, /fastapi-health-board-stale/);
	assert.match(
		source,
		/must never overwrite a newer aggregate or bounded probe snapshot/,
	);
});

test("TrueNAS keeps unified operational evidence behind its disclosure while Architecture renders it directly", async () => {
	const source = (path: string) =>
		readFile(new URL(`../${path}`, import.meta.url), "utf8");
	const [
		section,
		disclosure,
		architecturePage,
		architectureNav,
		facade,
		controlPlane,
		runtime,
		deepDiagnostics,
		pfsenseDetails,
		exposure,
		freshness,
	] = await Promise.all([
		source("app/components/homelab/HomelabServicesSection.tsx"),
		source("app/components/homelab/HomelabOperationsDisclosure.tsx"),
		source("app/[locale]/architecture/page.tsx"),
		source("app/[locale]/architecture/ArchitectureSectionNav.tsx"),
		source("app/components/homelab/HomelabOperationalEvidence.tsx"),
		source("app/components/homelab/HomelabOperationalControlPlane.tsx"),
		source("app/components/homelab/HomelabOperationalRuntime.tsx"),
		source("app/components/homelab/HomelabOperationalDeepDiagnostics.tsx"),
		source("app/components/homelab/HomelabOperationalPfSenseDetails.tsx"),
		source("app/components/homelab/HomelabOperationalExposure.tsx"),
		source("app/components/homelab/HomelabOperationalFreshness.tsx"),
	]);

	assert.match(section, /HomelabOperationsDisclosure/);
	assert.doesNotMatch(section, /HomelabOperationalEvidence/);
	assert.match(disclosure, /HomelabOperationalEvidence/);
	assert.match(disclosure, /data-homelab-operations-disclosure/);
	assert.match(architecturePage, /HomelabOperationalEvidence/);
	assert.doesNotMatch(architectureNav, /HomelabOperationalEvidence/);

	for (const sectionName of [
		"HomelabOperationalControlPlane",
		"HomelabOperationalMetrics",
		"HomelabOperationalRuntime",
		"HomelabOperationalDeepDiagnostics",
		"HomelabOperationalPfSenseDetails",
		"HomelabOperationalExposure",
		"HomelabOperationalFreshness",
	]) {
		assert.match(facade, new RegExp(sectionName));
	}
	assert.match(facade, /fetch\("\/api\/homelab-observability"/);
	assert.match(facade, /window\.setInterval/);
	assert.match(facade, /new AbortController/);
	for (const presentationSource of [
		controlPlane,
		runtime,
		deepDiagnostics,
		pfsenseDetails,
		exposure,
		freshness,
	]) {
		assert.doesNotMatch(presentationSource, /fetch\(/);
		assert.doesNotMatch(presentationSource, /setInterval\(/);
		assert.doesNotMatch(presentationSource, /new AbortController/);
	}

	assert.match(runtime, /data-runtime-transport-evidence/);
	assert.match(deepDiagnostics, /data-deep-diagnostics/);
	assert.match(pfsenseDetails, /data-pfsense-security-evidence/);
	assert.match(exposure, /data-service-exposure-diagnostics/);
	assert.match(exposure, /data-trusted-source-exposure/);
	assert.match(freshness, /data-evidence-freshness/);
	assert.match(freshness, /data-provider-credential-evidence/);
});
