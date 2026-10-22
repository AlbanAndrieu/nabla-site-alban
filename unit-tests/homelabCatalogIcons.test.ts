import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { homelabCatalogIconSrc } from "../lib/homelabCatalogIcons";

test("canonical SERVICE cards keep SVG icons without OWNER runtime evidence", () => {
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
