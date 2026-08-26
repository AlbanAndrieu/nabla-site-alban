import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("homelab service grid uses backend health for private and public endpoints", async () => {
	const page = await source("app/components/homelab/HomelabServiceGrid.tsx");
	assert.match(page, /const initialHealth = lookupHealth\(serviceHealth, svc\.tunnelUrl\)/);
	assert.doesNotMatch(page, /const initialHealth = isExternal/);
	assert.match(page, /tunnelSecure=\{svc\.tunnelSecure === true\}/);
});

test("endpoint action prefers reconciled backend evidence before browser probing", async () => {
	const page = await source("app/components/homelab/EndpointAction.tsx");
	assert.match(page, /if \(external \|\| initialHealth \|\| !url \|\| !enabled\) return/);
	assert.match(page, /initialHealth\?\.state/);
	assert.match(page, /runtime_state/);
	assert.match(page, /tunnel_status/);
});

test("Cloudflare indicator follows tunnelSecure intent and observed health", async () => {
	const page = await source("app/components/homelab/EndpointAction.tsx");
	assert.match(page, /tunnelSecure && \(/);
	assert.match(page, /state === "healthy"\) return "limegreen"/);
	assert.match(page, /state === "missing"\) return "red"/);
	assert.match(page, /state === "degraded"\) return "orange"/);
	assert.match(page, /if \(!normalized\) return "missing"/);
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
