import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("shared homelab React Flow documents direct, DNS-only and tunnel ingress paths", async () => {
	const flow = await source(
		"app/components/truenas/HierarchicalHomeLabNetworkFlow.tsx",
	);
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

test("network diagram is grouped by failure domain and can isolate ingress paths", async () => {
	const flow = await source(
		"app/components/truenas/HierarchicalHomeLabNetworkFlow.tsx",
	);
	assert.match(flow, /type FailureDomain = "external" \| "gateway" \| "lan" \| "truenas"/);
	assert.match(flow, /data-failure-domain=\{item\.domain\}/);
	assert.match(flow, /4 · TrueNAS failure domain/);
	assert.match(flow, /type PathMode = "all" \| "direct" \| "tunnel" \| "lan"/);
	assert.match(flow, /Direct HAProxy/);
	assert.match(flow, /LAN \/ Wi-Fi/);
	assert.match(flow, /PATH_NODE_IDS/);
	assert.match(flow, /nodesDraggable=\{false\}/);
});

test("TrueNAS and architecture pages reuse the hierarchical HomeLabNetworkFlow entry point", async () => {
	const [entryPoint, truenas, architecture] = await Promise.all([
		source("app/components/truenas/HomeLabNetworkFlow.tsx"),
		source("app/components/truenas/HomeLabSection.tsx"),
		source("app/[locale]/architecture/page.tsx"),
	]);
	assert.match(entryPoint, /HierarchicalHomeLabNetworkFlow/);
	assert.match(truenas, /import HomeLabNetworkFlow from "\.\/HomeLabNetworkFlow"/);
	assert.match(truenas, /<HomeLabNetworkFlow \/>/);
	assert.match(
		architecture,
		/import HomeLabNetworkFlow from "@\/app\/components\/truenas\/HomeLabNetworkFlow"/,
	);
	assert.match(architecture, /id="homelab-network-architecture"/);
	assert.match(architecture, /<HomeLabNetworkFlow \/>/);
});
