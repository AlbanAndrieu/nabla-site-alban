import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { HOMELAB_CATALOG_ICON_FILES, homelabCatalogIconSrc } from "../lib/homelabCatalogIcons";

test("canonical SERVICE cards keep local icons without OWNER runtime evidence", () => {
	assert.equal(
		homelabCatalogIconSrc("prometheus"),
		"assets/selfh-icons/prometheusio-icon.svg",
	);
	assert.equal(
		homelabCatalogIconSrc("postgres"),
		"assets/selfh-icons/postgresql-original-wordmark.svg",
	);
	assert.equal(
		homelabCatalogIconSrc("unmapped-service"),
		"assets/selfh-icons/generic-app.svg",
	);
	const projection = readFileSync(
		new URL("../lib/homelabCatalogV2Projection.ts", import.meta.url),
		"utf8",
	);
	assert.match(projection, /iconSrc: homelabCatalogIconSrc\(id\)/);
	for (const id of [
		"prometheus",
		"postgres",
		"grafana",
		"redis",
		"kafka",
		"sentry",
		"unmapped-service",
	]) {
		assert.ok(
			existsSync(new URL(`../public/${homelabCatalogIconSrc(id)}`, import.meta.url)),
			id,
		);
	}
});

test("Backstage v2 aliases use service-specific icons instead of generic fallback", () => {
	for (const [id, expected] of Object.entries({
		adguardhome: "adguard-home.png",
		openwebui: "open-webui.png",
		garage: "garage.png",
		homarr: "homarr.png",
		n8n: "n8n.png",
		gatus: "gatus.png",
		langfuse: "langfuse.png",
		litellm: "litellm.png",
		vaultwarden: "vaultwarden.png",
		pfsense: "pfsense.png",
		nexus: "sonatype-nexus-repository.png",
		"paperless-ngx": "paperless-ngx.png",
		truenas: "truenas-scale.png",
	})) {
		assert.equal(homelabCatalogIconSrc(id), `assets/selfh-icons/${expected}`);
	}
	assert.equal(homelabCatalogIconSrc("open_webui"), "assets/selfh-icons/open-webui.png");
});

test("all catalog icon mappings resolve to existing bundled, local-only assets", () => {
	assert.ok(Object.keys(HOMELAB_CATALOG_ICON_FILES).length >= 80);
	for (const [id, icon] of Object.entries(HOMELAB_CATALOG_ICON_FILES)) {
		assert.ok(!icon.includes("/") && !icon.includes(".."), id);
		assert.ok(
			existsSync(new URL(`../public/assets/selfh-icons/${icon}`, import.meta.url)),
			`${id} → ${icon}`,
		);
	}
});
