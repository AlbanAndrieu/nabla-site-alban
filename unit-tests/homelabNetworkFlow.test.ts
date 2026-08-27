import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("shared homelab React Flow documents direct, DNS-only and tunnel ingress paths", async () => {
	const flow = await source("app/components/truenas/HomeLabNetworkFlow.tsx");
	assert.match(flow, /name: "HAProxy"/);
	assert.match(flow, /name: "cloudflared"/);
	assert.match(flow, /Docker container on TrueNAS/);
	assert.match(flow, /name: "Homarr"/);
	assert.match(flow, /Native TrueNAS community App/);
	assert.match(flow, /garage\.int\.albandrieu\.com/);
	assert.match(flow, /DNS ONLY · NO TUNNEL/);
	assert.match(flow, /open-webui\.albandrieu\.com/);
	assert.match(flow, /CLOUDFLARE TUNNEL/);
	assert.match(flow, /"haproxy-garage"/);
	assert.match(flow, /"cloudflare-tunnel-cloudflared"/);
	assert.match(flow, /"cloudflared-openwebui"/);
	assert.doesNotMatch(flow, /"cloudflare-tunnel-garage"/);
});

test("TrueNAS and architecture pages reuse the same HomeLabNetworkFlow component", async () => {
	const truenas = await source("app/components/truenas/HomeLabSection.tsx");
	const architecture = await source("app/[locale]/architecture/page.tsx");
	assert.match(truenas, /import HomeLabNetworkFlow from "\.\/HomeLabNetworkFlow"/);
	assert.match(truenas, /<HomeLabNetworkFlow \/>/);
	assert.match(
		architecture,
		/import HomeLabNetworkFlow from "@\/app\/components\/truenas\/HomeLabNetworkFlow"/,
	);
	assert.match(architecture, /id="homelab-network-architecture"/);
	assert.match(architecture, /<HomeLabNetworkFlow \/>/);
});
