import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string): Promise<string> {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Cloudflare uncertainty stays explicit, diagnostic and non-degrading", async () => {
	const banner = await source(
		"app/components/homelab/CloudflareStatusWarning.tsx",
	);
	const helper = await source("lib/cloudflareStatus.ts");
	const section = await source("app/components/truenas/HomeLabSection.tsx");

	assert.match(banner, /fetch\("\/api\/homelab-health"/);
	assert.match(banner, /parseCloudflareControlPlaneStatus/);
	assert.match(banner, /data-cloudflare-error-kind/);
	assert.match(banner, /data-cloudflare-backend-detail/);
	assert.match(banner, /does not mark services down or degraded/);
	assert.match(banner, /ne passe pas les services en panne ou en état dégradé/);
	assert.doesNotMatch(banner, /setInterval/);
	assert.match(helper, /status_confirmed/);
	assert.match(helper, /api_reachable/);
	assert.match(helper, /empty_inventory/);
	assert.match(helper, /last_known_reachable/);
	assert.match(section, /<CloudflareStatusWarning \/>/);
});

test("pfSense diagnostic actions use the canonical home endpoint", async () => {
	const actions = await source(
		"app/components/homelab/PfSenseAttentionActions.tsx",
	);
	assert.match(actions, /https:\/\/home\.albandrieu\.com:10443\//);
	assert.match(
		actions,
		/https:\/\/home\.albandrieu\.com:10443\/api\/v2\/system\/version/,
	);
	assert.doesNotMatch(actions, /pfsense\.albandrieu\.com:10443/);
});
