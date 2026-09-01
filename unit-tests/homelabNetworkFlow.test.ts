import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("shared homelab React Flow documents HAProxy, Traefik, DNS-only and tunnel ingress paths", async () => {
	const flow = await source(
		"app/components/truenas/HierarchicalHomeLabNetworkFlow.tsx",
	);
	assert.match(flow, /name: "HAProxy"/);
	assert.match(flow, /Traefik backend 172\.17\.0\.24:443/);
	assert.match(flow, /name: "Traefik"/);
	assert.match(flow, /Docker reverse proxy on TrueNAS/);
	assert.match(flow, /172\.17\.0\.24:80 \/ :443/);
	assert.match(flow, /traefik_network · Let's Encrypt/);
	assert.match(flow, /name: "cloudflared"/);
	assert.match(flow, /Docker container on TrueNAS/);
	assert.match(flow, /name: "Homarr"/);
	assert.match(flow, /Native TrueNAS community App/);
	assert.match(flow, /s3\.int\.albandrieu\.com → :3900/);
	assert.match(flow, /garage\.int\.albandrieu\.com → :3909/);
	assert.match(flow, /TRAEFIK · DNS ONLY/);
	assert.match(flow, /open-webui\.albandrieu\.com/);
	assert.match(flow, /CLOUDFLARE TUNNEL/);
	assert.match(flow, /"pfsense-haproxy"/);
	assert.match(flow, /"haproxy-traefik"/);
	assert.match(flow, /"truenas-traefik"/);
	assert.match(flow, /"traefik-garage"/);
	assert.match(flow, /S3 :3900 · WebUI :3909/);
	assert.match(flow, /"cloudflare-tunnel-cloudflared"/);
	assert.match(flow, /"cloudflared-openwebui"/);
	assert.doesNotMatch(flow, /"pfsense-traefik"/);
	assert.doesNotMatch(flow, /"haproxy-garage"/);
	assert.doesNotMatch(flow, /"cloudflare-tunnel-garage"/);
});

test("network diagram is grouped by failure domain and can isolate ingress paths", async () => {
	const flow = await source(
		"app/components/truenas/HierarchicalHomeLabNetworkFlow.tsx",
	);
	assert.match(flow, /type FailureDomain = "external" \| "gateway" \| "lan" \| "truenas"/);
	assert.match(flow, /data-failure-domain=\{item\.domain\}/);
	assert.match(flow, /4 · TrueNAS failure domain/);
	assert.match(flow, /Traefik\/cloudflared Docker ingress/);
	assert.match(flow, /type PathMode = "all" \| "direct" \| "tunnel" \| "lan"/);
	assert.match(flow, /Direct ingress/);
	assert.match(flow, /Direct reverse proxy \(HAProxy \/ Traefik\)/);
	assert.match(flow, /LAN \/ Wi-Fi/);
	assert.match(flow, /PATH_NODE_IDS/);
	assert.match(flow, /"traefik", "garage"/);
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
