import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { homelabCatalogIconSrc } from "../lib/homelabCatalogIcons";

test("canonical SERVICE cards recover known icons without any OWNER evidence", () => {
	assert.equal(homelabCatalogIconSrc("prometheus"), "assets/selfh-icons/prometheusio-icon.svg");
	assert.equal(homelabCatalogIconSrc("postgres"), "assets/selfh-icons/postgresql-original-wordmark.svg");
	assert.equal(homelabCatalogIconSrc("unmapped-service"), "assets/selfh-icons/generic-app.svg");
	const source = readFileSync(new URL("../lib/homelabCatalogV2Projection.ts", import.meta.url), "utf8");
	assert.match(source, /iconSrc: homelabCatalogIconSrc\(id\)/);
	for (const id of ["prometheus", "postgres", "grafana", "redis", "kafka", "sentry", "unmapped-service"]) {
		assert.ok(existsSync(new URL(`../public/${homelabCatalogIconSrc(id)}`, import.meta.url)), id);
	}
});
