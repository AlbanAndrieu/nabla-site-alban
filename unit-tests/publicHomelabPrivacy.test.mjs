import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
	readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const privateRoutes = [
	"homelab-diagnostics",
	"homelab-health",
	"homelab-observability",
	"homelab-probes",
	"homelab-services",
	"homelab-status",
	"homelab-topology",
	"runtime-topology",
];

test("public homelab APIs fail closed without proxying FastAPI", () => {
	for (const path of privateRoutes) {
		const source = read(`app/api/${path}/route.ts`);
		assert.match(source, /privateHomelabResponse\(\)/);
		assert.doesNotMatch(source, /loadHomelab|loadFastApi|loadRuntime|fetch\(/);
	}
	const deny = read("lib/privateHomelabResponse.ts");
	assert.match(deny, /status: 404/);
	assert.match(deny, /no-store/);
	assert.doesNotMatch(deny, /internalHost|internalPort|172\.17/);
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

test("public page entrypoints do not mount privileged components", () => {
	for (const path of [
		"app/components/truenas/HomeLabSection.tsx",
		"app/components/homelab/HomelabServicesSection.tsx",
		"app/[locale]/architecture/page.tsx",
	]) {
		assert.doesNotMatch(
			read(path),
			/<HomelabServicesBlock|<HomelabOperationalEvidence|<HomelabOperationsDisclosure|<HomeLabNetworkFlow|<ArchitectureTopologyView|<ArchitectureImpactInspector/,
		);
	}
	assert.match(
		read("app/components/homelab/HomelabServicesSection.tsx"),
		/https:\/\/ops\.albandrieu\.com/,
	);
});
