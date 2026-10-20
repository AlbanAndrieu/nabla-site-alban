import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { sep } from "node:path";
import test from "node:test";

const read = (path) =>
	readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const privateRoutes = [
	"homelab-diagnostics",
	"homelab-health",
	"homelab-network-flow",
	"homelab-observability",
	"homelab-probes",
	"homelab-services",
	"homelab-status",
	"homelab-topology",
	"runtime-topology",
];

test("homelab APIs require the trusted owner CIDR and optionally Cloudflare Access", () => {
	for (const path of privateRoutes) {
		const source = read(`app/api/${path}/route.ts`);
		assert.match(source, /export function GET\(request: Request\)/, path);
		assert.match(source, /return gatedHomelabResponse\(request, \w+\);/, path);
		// Only GET (plus route config) is exported: no ungated handler.
		const exported = [
			...source.matchAll(/^export (?:async )?(?:function|const) (\w+)/gm),
		]
			.map((match) => match[1])
			.sort();
		assert.deepEqual(exported, ["GET", "dynamic", "runtime"], path);
		assert.match(source, /dynamic = "force-dynamic"/, path);
		// A shared CDN cache would replay owner data to anonymous visitors.
		assert.doesNotMatch(
			source,
			/s-maxage|stale-while-revalidate|public,/,
			path,
		);
	}
	const gate = read("lib/privateHomelabResponse.ts");
	assert.match(gate, /status: 404/);
	assert.match(gate, /"private, no-store, max-age=0"/);
	assert.doesNotMatch(gate, /internalHost|internalPort|172\.17/);
	const body = gate.slice(
		gate.indexOf("export async function gatedHomelabResponse"),
	);
	const trustCheck = body.indexOf("isTrustedHomelabRequest(request)");
	const handlerCall = body.indexOf("await handler()");
	assert.ok(
		trustCheck >= 0 && handlerCall > trustCheck,
		"gate runs before handler",
	);
	assert.match(body, /response\.headers\.set\(name, value\)/);

	const access = read("app/api/homelab-access/route.ts");
	assert.match(access, /\{ trusted: decision\.trusted \}/);
	assert.match(access, /no-store/);
});

test("fallback JSON and legacy documents have no operator-only fields", () => {
	for (const path of [
		"public/homelab-services.json",
		"public/service-topology.json",
		"config/homelab-navigation-overrides.json",
		"public/freenas.html",
		"public/locales/fr/freenas.html",
	]) {
		const source = read(path);
		assert.doesNotMatch(
			source,
			/internalHost|internalPort|internalUrl|sourcePath|endpointUrl|tunnelUrl|172\.17\./,
		);
		assert.doesNotMatch(source, /(?:10|172|192)\.\d+\.\d+\.\d+/);
		assert.doesNotMatch(source, /https?:\/\/[^\s"'<>]+:\d{2,5}\b/);
	}
	const services = JSON.parse(read("public/homelab-services.json"));
	const topology = JSON.parse(read("public/service-topology.json"));
	assert.equal(services.services.length, 1);
	assert.equal(topology.nodes.length, 1);
	assert.deepEqual(topology.relations, []);
});

const privilegedViews =
	/HomelabServicesBlock|HomelabOperationalEvidence|HomelabOperationsDisclosure|HomeLabNetworkFlow|ArchitectureTopologyView|ArchitectureImpactInspector|CloudflareStatusWarning/;

test("public pages only mount the client access gates", () => {
	const gates = {
		"app/components/truenas/HomeLabSection.tsx": "HomeLabPrivateNetwork",
		"app/components/homelab/HomelabServicesSection.tsx":
			"HomelabPrivateServices",
		"app/[locale]/architecture/page.tsx": "ArchitecturePrivateViews",
	};
	for (const [path, gate] of Object.entries(gates)) {
		const source = read(path);
		assert.doesNotMatch(source, privilegedViews, path);
		assert.match(source, new RegExp(`<${gate}\\b`), path);
		// Static pages must not bake the private catalog or topology.
		assert.doesNotMatch(
			source,
			/getStaticHomelabServicesCatalog|getStaticServiceTopology/,
		);
	}
	assert.match(
		read("app/components/homelab/HomelabPrivateServices.tsx"),
		/https:\/\/ops\.albandrieu\.com/,
	);
	assert.doesNotMatch(
		read("app/components/homelab/HomelabServicesSection.tsx"),
		/Espace opérations privé/,
	);
});

test("gates ask the server first and dynamically import the private views", () => {
	for (const path of [
		"app/components/truenas/HomeLabPrivateNetwork.tsx",
		"app/components/homelab/HomelabPrivateServices.tsx",
		"app/[locale]/architecture/ArchitecturePrivateViews.tsx",
	]) {
		const source = read(path);
		assert.match(source, /^"use client";/, path);
		assert.match(source, /useHomelabAccess\(\)/, path);
		// A static import would ship and render the view for every visitor.
		for (const line of source
			.split("\n")
			.filter((l) => l.startsWith("import "))) {
			assert.doesNotMatch(line, privilegedViews, `${path}: ${line}`);
		}
		assert.match(source, /dynamic\(\s*\(\) => import\(/, path);
		assert.doesNotMatch(source, /ssr: true/, path);
	}
	const hook = read("app/components/homelab/useHomelabAccess.ts");
	assert.match(hook, /fetch\("\/api\/homelab-access"/);
	assert.match(hook, /cache: "no-store"/);
	assert.match(hook, /useState<HomelabAccessState>\("pending"\)/);
	assert.match(hook, /setState\(trusted \? "trusted" : "denied"\)/);
});

test("owner cards preserve the historical #service-* link after async access", () => {
	const card = read("app/components/homelab/HomelabServiceCard.tsx");
	const block = read("app/components/homelab/HomelabServicesBlock.tsx");
	const gate = read("app/components/homelab/HomelabPrivateServices.tsx");
	assert.match(card, /anchorId\.replace\(\/\^homelab-service-\//);
	assert.match(block, /getElementById\(hash\.slice\(1\)\)/);
	assert.match(block, /scrollIntoView\(/);
	assert.match(gate, /if \(access === "denied"\)/);
	assert.match(gate, /data-homelab-private-view/);
});

test("network topology data never reaches a client bundle", () => {
	const dataModules = /homelabNetworkFlow(?:Nodes|Edges)/;
	const allowed = new Set([
		"app/api/homelab-network-flow/route.ts",
		"app/components/truenas/homelabNetworkFlowNodes.ts",
		"app/components/truenas/homelabNetworkFlowEdges.ts",
	]);
	const files = ["app", "components", "lib"].flatMap((root) =>
		readdirSync(new URL(`../${root}/`, import.meta.url), { recursive: true })
			.map((path) => `${root}/${String(path).split(sep).join("/")}`)
			.filter((path) => /\.tsx?$/.test(path)),
	);
	for (const path of files) {
		if (allowed.has(path)) continue;
		assert.doesNotMatch(read(path), dataModules, path);
	}
	assert.match(
		read("app/components/truenas/HomeLabNetworkFlow.tsx"),
		/fetch\("\/api\/homelab-network-flow"/,
	);
});
