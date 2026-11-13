import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	homelabServiceDisplayName,
	homelabServiceId,
} from "../lib/homelabServices";
import { SITE_CATALOG_V2_URL } from "../lib/homelabSiteCatalog";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("canonical homelab SERVICE upstream is Backstage v2, never legacy services", () => {
	assert.equal(
		SITE_CATALOG_V2_URL,
		"https://fastapi-sample.fastapicloud.dev/api/site/catalog/v2",
	);
});

test("legacy catalog routes, loaders and static fallbacks are removed", () => {
	for (const path of [
		"app/api/homelab-services/route.ts",
		"app/api/homelab-topology/route.ts",
		"lib/homelabServicesServer.ts",
		"public/service-topology.json",
		"public/homelab-services.json",
		"config/homelab-navigation-overrides.json",
		"unit-tests/helpers/homelabLegacyCatalogFixture.ts",
	]) {
		assert.equal(
			existsSync(new URL(`../${path}`, import.meta.url)),
			false,
			path,
		);
	}
});

test("every catalog-driven view reads only the Backstage v2 route", async () => {
	const views = await Promise.all(
		[
			"app/[locale]/architecture/ArchitecturePrivateViews.tsx",
			"app/[locale]/architecture/useArchitectureLiveData.ts",
			"app/components/homelab/useHomelabHealth.ts",
			"app/components/homelab/HomelabOperationsDisclosure.tsx",
			"lib/homelabTroubleshootingClient.ts",
		].map(read),
	);
	for (const source of views) {
		assert.match(source, /"\/api\/homelab-catalog-v2"/);
		assert.doesNotMatch(
			source,
			/\/api\/homelab-(?:services|topology)|getStatic(?:HomelabServicesCatalog|ServiceTopology)/,
		);
	}
});

test("the canonical service identity is the full entity ref", () => {
	const entityRef = "component:default/prometheus";
	assert.equal(
		homelabServiceId({ id: "prometheus", entityRef, name: "Prometheus" }),
		entityRef,
	);
	// OWNER probe rows carry no entity ref and keep their FastAPI slug.
	assert.equal(homelabServiceId({ name: "pfSense" }), "pfsense");
	assert.equal(
		homelabServiceDisplayName({
			id: "component:default/gatus",
			entityRef: "component:default/gatus",
			name: "Gatus",
		}),
		"Gatus UI",
	);
});

test("canonical Home Assistant and Open WebUI IDs retain DNS and container slugs", () => {
	assert.equal(
		homelabServiceId({ id: "home-assistant", name: "Home Assistant" }),
		"homeassistant",
	);
	assert.equal(
		homelabServiceId({ id: "open-webui", name: "Open WebUI" }),
		"openwebui",
	);
	assert.equal(
		homelabServiceId({ id: "garage-webui", name: "Garage Web UI" }),
		"garage-webui",
	);
});

test("explicitly typed endpoint roles do not duplicate UI, API or MCP", () => {
	assert.equal(
		homelabServiceDisplayName({ id: "gatus", name: "Gatus" }),
		"Gatus UI",
	);
	assert.equal(
		homelabServiceDisplayName({ id: "bichon", name: "Bichon" }),
		"Bichon UI",
	);
	assert.equal(
		homelabServiceDisplayName({ id: "home-assistant", name: "Home Assistant" }),
		"Home Assistant UI",
	);
	assert.equal(
		homelabServiceDisplayName({ id: "openwebui", name: "Open WebUI" }),
		"Open WebUI",
	);
	assert.equal(
		homelabServiceDisplayName({ id: "garage-webui", name: "Garage Web UI" }),
		"Garage Web UI",
	);
	assert.equal(
		homelabServiceDisplayName({
			id: "garage",
			name: "Garage S3 API",
			kind: "object-storage",
		}),
		"Garage S3 API",
	);
	assert.equal(
		homelabServiceDisplayName({
			id: "mcp-cyberbro",
			name: "Cyberbro",
			kind: "mcp-server",
		}),
		"Cyberbro MCP",
	);
	assert.equal(
		homelabServiceDisplayName({ id: "traefik", name: "Traefik", kind: "edge" }),
		"Traefik",
	);
});
