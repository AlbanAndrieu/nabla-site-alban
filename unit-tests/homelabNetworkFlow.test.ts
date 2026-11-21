import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

// The flow component delegates its static topology and pure node/edge builders
// to sibling modules; the source contract covers the whole set.
async function flowSource() {
	const parts = await Promise.all(
		[
			"app/components/truenas/HierarchicalHomeLabNetworkFlow.tsx",
			"app/components/truenas/homelabNetworkFlowTypes.ts",
			"app/components/truenas/homelabNetworkFlowNodes.ts",
			"app/components/truenas/homelabNetworkFlowEdges.ts",
			"app/components/truenas/homelabNetworkFlowGraph.ts",
		].map(source),
	);
	return parts.join("\n");
}

test("shared homelab React Flow documents the Freebox → R7000 WAN, DNS and tunnel paths", async () => {
	const flow = await flowSource();
	// Since pfSense left on 18/11/2026: Freebox WAN router, R7000 LAN router, Pi-hole LAN DNS.
	assert.match(flow, /name: "Freebox"/);
	assert.match(flow, /no DMZ · no port forward/);
	assert.match(flow, /"internet-freebox"/);
	assert.match(flow, /"cloudflare-tunnel-freebox"/);
	assert.match(flow, /"freebox-r7000"/);
	assert.match(flow, /double NAT · no DMZ/);
	assert.match(flow, /name: "Netgear R7000"/);
	assert.match(
		flow,
		/LAN router · DHCP · Wi-Fi · double NAT behind the Freebox/,
	);
	assert.match(flow, /address: "172\.17\.0\.1"/);
	assert.match(flow, /"r7000-switch"/);
	assert.match(flow, /"r7000-pihole"/);
	assert.match(flow, /DNS relay → :53 · \*\.int split DNS/);
	assert.match(flow, /"workstation-r7000"/);
	assert.match(flow, /"s24-r7000"/);
	assert.match(flow, /upstreams AdGuard :553 \(Quad9 DoH\) · 9\.9\.9\.9/);
	// The retired pfSense path is gone from the topology, not just badged.
	for (const retired of [
		/id: "pfsense"/,
		/id: "unbound"/,
		/id: "haproxy"/,
		/id: "wan-switch"/,
		/"pfsense-haproxy"/,
		/"haproxy-switch"/,
		/"unbound-pihole"/,
		/badge: "RETIRED"/,
		/82\.66\.4\.247/,
	])
		assert.doesNotMatch(flow, retired);
	assert.match(flow, /name: "Traefik"/);
	assert.match(flow, /Docker reverse proxy on TrueNAS/);
	assert.match(flow, /172\.17\.0\.24:80 \/ :443/);
	assert.match(flow, /traefik_network · Let's Encrypt/);
	assert.match(flow, /DOCKER · LAN ONLY/);
	assert.doesNotMatch(flow, /OUTGOING ALL · FORWARDING OFF/);
	assert.match(flow, /name: "Pi-hole"/);
	assert.match(flow, /172\.17\.0\.24:53/);
	assert.match(flow, /name: "Pi-hole DNS Sync"/);
	assert.match(flow, /eligible \*\.int labels/);
	assert.match(flow, /name: "cloudflared"/);
	assert.match(flow, /Docker container on TrueNAS/);
	assert.match(flow, /name: "Homarr"/);
	assert.match(flow, /Native TrueNAS community App/);
	assert.match(flow, /s3\.int\.albandrieu\.com → :3900/);
	assert.match(flow, /garage\.albandrieu\.com → :3909/);
	assert.match(flow, /garage-admin\.albandrieu\.com → :3903/);
	assert.match(flow, /TRAEFIK · DNS ONLY/);
	assert.match(flow, /open-webui\.albandrieu\.com/);
	assert.match(flow, /TUNNEL · NO TRAEFIK/);
	assert.match(flow, /open-webui\.albandrieu\.com → :31028 · no Traefik/);
	assert.match(flow, /"truenas-traefik"/);
	assert.match(flow, /"traefik-garage"/);
	assert.match(flow, /s3\.int → S3 :3900/);
	assert.match(flow, /"cloudflared-garage-webui"/);
	assert.match(flow, /"cloudflared-garage-admin"/);
	assert.match(flow, /"cloudflared-openwebui"/);
	assert.doesNotMatch(flow, /garage\.int\.albandrieu\.com/);
	assert.doesNotMatch(flow, /garage-admin\.int\.albandrieu\.com/);
	assert.doesNotMatch(flow, /"cloudflare-tunnel-cloudflared"/);
	assert.doesNotMatch(flow, /"traefik-openwebui"/);
});

test("network diagram is grouped by failure domain and can isolate DNS and ingress paths", async () => {
	const flow = await flowSource();
	assert.match(
		flow,
		/type FailureDomain = "external" \| "gateway" \| "lan" \| "truenas"/,
	);
	assert.match(flow, /data-failure-domain=\{item\.domain\}/);
	assert.match(flow, /4 · TrueNAS failure domain/);
	assert.match(flow, /Traefik, cloudflared, Pi-hole/);
	assert.match(flow, /type PathMode = "all" \| "tunnel" \| "dns" \| "lan"/);
	assert.doesNotMatch(flow, /Direct ingress|Ingress direct|"direct", "tunnel"/);
	assert.match(flow, /DNS \/ split DNS/);
	assert.match(flow, /LAN reverse proxy \(Traefik\)/);
	assert.match(flow, /DNS resolution \/ split DNS/);
	assert.match(flow, /LAN \/ Wi-Fi/);
	assert.match(flow, /PATH_NODE_IDS/);
	assert.match(flow, /"freebox"/);
	assert.match(flow, /"pihole-dns-sync"/);
	assert.match(flow, /"garage-webui"/);
	assert.match(flow, /"garage-admin"/);
	assert.match(flow, /"openwebui"/);
	assert.match(flow, /nodesDraggable=\{false\}/);
});

test("network flow is retained as private-only component and not mounted publicly", async () => {
	const [entryPoint, truenas, architecture] = await Promise.all([
		source("app/components/truenas/HomeLabNetworkFlow.tsx"),
		source("app/components/truenas/HomeLabSection.tsx"),
		source("app/[locale]/architecture/page.tsx"),
	]);
	assert.match(entryPoint, /HierarchicalHomeLabNetworkFlow/);
	assert.doesNotMatch(truenas, /<HomeLabNetworkFlow|import HomeLabNetworkFlow/);
	assert.doesNotMatch(
		architecture,
		/<HomeLabNetworkFlow|import HomeLabNetworkFlow/,
	);
	assert.match(architecture, /ops\.albandrieu\.com/);
});
