import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("homelab service grid keeps private endpoints clickable and matches health by id", async () => {
	const page = await source("app/components/homelab/HomelabServiceGrid.tsx");
	assert.match(page, /const endpointUrl = homelabServiceEndpointUrl\(svc\)/);
	assert.match(page, /const endpointEnabled = svc\.endpointEnabled !== false/);
	assert.match(page, /lookupHealth\(serviceHealth, svc, endpointUrl\)/);
	assert.match(page, /if \(service\.id\)/);
	assert.doesNotMatch(page, /isExternal \|\| isInternalEndpointUrl/);
	assert.match(page, /tunnelSecure=\{svc\.tunnelSecure === true\}/);
});

test("endpoint action follows FastAPI state and supplements unverified private endpoints", async () => {
	const page = await source("app/components/homelab/EndpointAction.tsx");
	assert.match(page, /return entry\.state/);
	assert.match(page, /\[401, 403, 407, 429\]\.includes\(status\)/);
	assert.match(page, /supplementWithPrivateProbe/);
	assert.match(page, /initialHealth\?\.direct_state != null/);
	assert.match(page, /initialHealth\?\.internal_state != null/);
	assert.match(page, /initialHealth\?\.state === "fail"/);
	assert.match(page, /privateProbeIsAuthoritative/);
	assert.match(page, /runtime_state/);
	assert.match(page, /tunnel_status/);
	assert.match(page, /style=\{\{ color: healthColor, borderColor: healthColor \}\}/);
	assert.match(page, /data-health-state=\{health\}/);
});

test("Cloudflare indicator requires tunnel intent and observed API evidence", async () => {
	const page = await source("app/components/homelab/EndpointAction.tsx");
	const presentation = await source("lib/homelabHealthPresentation.ts");
	assert.match(page, /showCloudflare = tunnelSecure && hasCloudflareEvidence\(initialHealth\)/);
	assert.match(page, /\{showCloudflare && \(/);
	assert.match(page, /cloudflareIndicatorColor\(initialHealth\)/);
	assert.match(presentation, /entry\?\.tunnel_status\?\.trim\(\) \|\| entry\?\.tunnel_name\?\.trim\(\)/);
	assert.match(presentation, /\["healthy", "active", "up", "ok"\]\.includes\(status\)/);
	assert.match(presentation, /status === "degraded" \? HEALTH_COLORS\.warn : HEALTH_COLORS\.fail/);
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

test("homelab health refreshes every thirty seconds and on tab visibility", async () => {
	const page = await source("app/components/homelab/HomelabServicesBlock.tsx");
	assert.match(page, /HEALTH_REFRESH_MS = 30_000/);
	assert.match(page, /setInterval/);
	assert.match(page, /visibilitychange/);
	assert.match(page, /snapshot: snapshot \?\? current\.snapshot/);
});
