import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string): Promise<string> {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Cloudflare uncertainty stays explicit and non-degrading", async () => {
	const banner = await source(
		"app/components/homelab/CloudflareStatusWarning.tsx",
	);
	const section = await source("app/components/truenas/HomeLabSection.tsx");

	assert.match(banner, /fetch\("\/api\/homelab-observability"/);
	assert.match(banner, /cloudflare\.state === "unknown"/);
	assert.match(banner, /cloudflare\.reachable === null/);
	assert.match(banner, /cloudflare\.state === "fail"/);
	assert.match(banner, /cloudflare\.reachable === false/);
	assert.match(banner, /data-cloudflare-status-unconfirmed/);
	assert.match(banner, /does not mark services down or degraded/);
	assert.match(banner, /ne passe pas les services en panne ou en état dégradé/);
	assert.match(section, /<CloudflareStatusWarning \/>/);
});
