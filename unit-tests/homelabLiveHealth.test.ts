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
});

test("endpoint action prefers reconciled backend evidence before browser probing", async () => {
	const page = await source("app/components/homelab/EndpointAction.tsx");
	assert.match(page, /if \(external \|\| initialHealth \|\| !url \|\| !enabled\) return/);
	assert.match(page, /initialHealth\?\.state/);
	assert.match(page, /runtime_state/);
	assert.match(page, /tunnel_status/);
});

test("homelab health refreshes every thirty seconds and on tab visibility", async () => {
	const page = await source("app/components/homelab/HomelabServicesBlock.tsx");
	assert.match(page, /HEALTH_REFRESH_MS = 30_000/);
	assert.match(page, /setInterval/);
	assert.match(page, /visibilitychange/);
	assert.match(page, /snapshot: snapshot \?\? current\.snapshot/);
});
