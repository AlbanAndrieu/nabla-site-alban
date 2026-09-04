import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("homelab service grid keeps endpoints clickable and matches FastAPI health by stable identity", async () => {
	const page = await source("app/components/homelab/HomelabServiceGrid.tsx");
	assert.match(page, /const endpointUrl = homelabServiceEndpointUrl\(svc\)/);
	assert.match(page, /const endpointEnabled = svc\.endpointEnabled !== false/);
	assert.match(page, /const stableId = homelabServiceId\(service\)/);
	assert.match(page, /index\.byId\.get\(stableId\)/);
	assert.match(page, /index\.byName\.get\(normalizedName\(service\.name\)\)/);
	assert.match(
		page,
		/serviceHealthEvidence\(serviceHealth, svc, endpointUrl, snapshot\)/,
	);
	assert.doesNotMatch(page, /isExternal \|\| isInternalEndpointUrl/);
	assert.match(page, /tunnelSecure=\{svc\.tunnelSecure === true\}/);
	assert.match(page, /snapshotCheckedAt=\{snapshot\?\.checked_at\}/);
});

test("schema-v4 service state remains authoritative and older snapshots keep local reconciliation fallback", async () => {
	const page = await source("app/components/homelab/HomelabServiceGrid.tsx");
	assert.match(page, /if \(\(schemaVersion \?\? 0\) >= 4\) return entry/);
	assert.match(page, /snapshot\?\.schema_version/);
	assert.match(page, /reconcileHomelabHealth\(entry, \{/);
	assert.match(page, /external: service\.external === true/);
	assert.match(page, /tunnelExpected: service\.tunnelSecure === true/);
	assert.match(page, /state: reconciliation\.state/);
});

test("TrueNAS card uses only the dedicated public port-7000 probe for link color", async () => {
	const page = await source("app/components/homelab/HomelabServiceGrid.tsx");
	assert.match(page, /function serviceHealthEvidence/);
	assert.match(page, /homelabServiceId\(service\) !== "truenas"/);
	assert.match(page, /snapshot\?\.truenas\?\.public/);
	assert.match(page, /const publicHealth = snapshot\.truenas\.public/);
	assert.match(page, /state: publicHealth\.state/);
	assert.match(page, /direct_state: publicHealth\.state/);
	assert.doesNotMatch(page, /state: snapshot\.truenas\.state/);
	assert.match(
		page,
		/generic\?\.internal_state \?\? snapshot\.truenas\.internal\?\.state \?\? null/,
	);
});

test("TrueNAS runtime/API failures are explicit even when the public UI remains reachable", async () => {
	const page = await source("app/components/homelab/HomelabServiceGrid.tsx");
	const block = await source("app/components/homelab/HomelabServicesBlock.tsx");
	const health = await source("lib/homelabHealth.ts");
	assert.match(page, /healthUnavailable \|\|/);
	assert.match(page, /truenasApi\?\.reachable === false/);
	assert.match(page, /snapshot\?\.truenas_runtime_reachable === false/);
	assert.match(page, /snapshot\?\.truenas_runtime_stale === true/);
	assert.match(page, /data-truenas-runtime-warning/);
	assert.match(block, /healthUnavailable: health\.snapshot === null/);
	assert.match(block, /healthStatus: health\.status/);
	assert.match(block, /snapshot: health\.snapshot \?\? current\.snapshot/);
	assert.match(health, /export type TrueNasApiHealth/);
	assert.match(health, /api\?: TrueNasApiHealth \| null/);
	assert.match(health, /validTrueNasApiHealth/);
});

test("TrueNAS application cards show runtime icons and a legend", async () => {
	const page = await source("app/components/homelab/HomelabServiceGrid.tsx");
	assert.match(page, /function runtimePresentationState/);
	assert.match(page, /runtimeHealthState\(entry\?\.runtime_state\) \?\? "missing"/);
	assert.match(page, /"fas fa-circle-check"/);
	assert.match(page, /"fas fa-triangle-exclamation"/);
	assert.match(page, /"fas fa-circle-xmark"/);
	assert.match(page, /"fas fa-skull-crossbones"/);
	assert.match(page, /data-truenas-runtime-state=\{runtimeState\}/);
	assert.match(page, /data-truenas-runtime-legend/);
	assert.match(page, /t\("runtime\.legendMissing"\)/);
});

test("service cards promote effective health above runtime and troubleshooting details", async () => {
	const page = await source("app/components/homelab/HomelabServiceGrid.tsx");
	const css = await source("app/components/homelab/HomelabServicesBlock.module.css");

	assert.match(page, /EFFECTIVE_HEALTH_LABEL_KEY/);
	assert.match(page, /data-effective-health=\{resolvedHealth\.effectiveState\}/);
	assert.match(page, /className=\{styles\.serviceHealthBadge\}/);
	assert.match(page, /data-health-state=\{resolvedHealth\.effectiveState\}/);
	assert.match(page, /data-health-stale/);
	assert.match(css, /\.serviceHealthBadge\[data-health-state="fail"\]/);
	assert.match(css, /\.serviceCard\[data-effective-health="warn"\]/);
});

test("TrueNAS dependency failures only affect services hosted on TrueNAS", async () => {
	const page = await source("app/components/homelab/HomelabServiceGrid.tsx");
	assert.match(page, /const dependsOnTrueNas =/);
	assert.match(page, /svc\.internalHost === "172\.17\.0\.24"/);
	assert.match(page, /initialHealth\?\.runtime_app != null/);
	assert.match(page, /truenasDown=\{truenasDown && dependsOnTrueNas\}/);
});

test("internal links inherit FastAPI or TrueNAS runtime colors", async () => {
	const page = await source("app/components/homelab/HomelabServiceGrid.tsx");
	assert.match(page, /internalPresentationState\(initialHealth\)/);
	assert.match(page, /runtimeHealthState\(entry\?\.runtime_state\)/);
	assert.match(page, /INTERNAL_HEALTH_CLASS\[internalState\]/);
	assert.match(
		page,
		/style=\{\{ color: internalColor, borderColor: internalColor \}\}/,
	);
	assert.match(page, /data-health-state=\{internalState\}/);
});

test("endpoint action treats FastAPI runtime evidence as authoritative", async () => {
	const page = await source("app/components/homelab/EndpointAction.tsx");
	assert.match(page, /function hasAuthoritativeEvidence/);
	assert.match(page, /entry\.direct_state != null/);
	assert.match(page, /entry\.internal_state != null/);
	assert.match(page, /entry\.runtime_state != null/);
	assert.match(page, /entry\.tunnel_status\?\.trim\(\)/);
	assert.match(page, /entry\.state !== "unknown"/);
	assert.match(
		page,
		/const authoritativeSnapshot = hasAuthoritativeEvidence\(initialHealth\)/,
	);
	assert.match(page, /configured && !external && !authoritativeSnapshot/);
	assert.match(page, /authoritativeSnapshot && snapshotState/);
	assert.match(page, /privateProbeIsAuthoritative/);
	assert.match(
		page,
		/style=\{\{ color: healthColor, borderColor: healthColor \}\}/,
	);
	assert.match(page, /data-health-state=\{health\}/);
});

test("health evidence shows HTTP, TrueNAS, Cloudflare and snapshot age", async () => {
	const page = await source("app/components/homelab/EndpointAction.tsx");
	assert.match(page, /snapshotAgeSeconds/);
	assert.match(page, /HTTP \$\{initialHealth\.http_status\}/);
	assert.match(page, /TrueNAS \$\{initialHealth\.runtime_state\}/);
	assert.match(page, /Cloudflare \$\{initialHealth\.tunnel_status\}/);
	assert.match(page, /data-health-evidence/);
	assert.match(page, /t\("snapshotAge", \{ seconds: ageSeconds \}\)/);
});

test("Cloudflare indicator requires tunnel intent and observed API evidence", async () => {
	const page = await source("app/components/homelab/EndpointAction.tsx");
	const presentation = await source("lib/homelabHealthPresentation.ts");
	assert.match(
		page,
		/showCloudflare = tunnelSecure && hasCloudflareEvidence\(initialHealth\)/,
	);
	assert.match(page, /\{showCloudflare && \(/);
	assert.match(page, /cloudflareIndicatorColor\(initialHealth\)/);
	assert.match(
		presentation,
		/entry\?\.tunnel_status\?\.trim\(\) \|\| entry\?\.tunnel_name\?\.trim\(\)/,
	);
	assert.match(
		presentation,
		/\["healthy", "active", "up", "ok"\]\.includes\(status\)/,
	);
	assert.match(
		presentation,
		/status === "degraded" \? HEALTH_COLORS\.warn : HEALTH_COLORS\.fail/,
	);
});

test("TLS indicator is shown for HTTPS and follows API trust evidence", async () => {
	const page = await source("app/components/homelab/EndpointAction.tsx");
	const presentation = await source("lib/homelabHealthPresentation.ts");
	assert.match(page, /const https = isHttpsEndpoint\(url\)/);
	assert.match(page, /className="fas fa-lock"/);
	assert.match(page, /tlsIndicatorColor\(tlsTrusted\)/);
	assert.match(presentation, /trusted === true\) return HEALTH_COLORS\.ok/);
	assert.match(presentation, /trusted === false\) return HEALTH_COLORS\.fail/);
});

test("pending endpoint state is explicit and motion-safe", async () => {
	const page = await source("app/components/homelab/EndpointAction.tsx");
	const css = await source("app/components/homelab/EndpointAction.module.css");
	assert.match(page, /health === "pending"/);
	assert.match(page, /t\("pending"\)/);
	assert.match(css, /endpoint-pending-blink/);
	assert.match(css, /prefers-reduced-motion: reduce/);
});

test("homelab health refreshes every thirty seconds, preserves context and exposes failed refreshes", async () => {
	const page = await source("app/components/homelab/HomelabServicesBlock.tsx");
	assert.match(page, /HEALTH_REFRESH_MS = 30_000/);
	assert.match(page, /setInterval/);
	assert.match(page, /visibilitychange/);
	assert.match(page, /snapshot: health\.snapshot \?\? current\.snapshot/);
	assert.match(page, /healthUnavailable: health\.snapshot === null/);
	assert.match(page, /healthHttpStatus=\{state\.healthStatus\}/);
});
