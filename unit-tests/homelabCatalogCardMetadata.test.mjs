import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("Backstage v2 metadata renders in the canonical service card, not a legacy script", () => {
	const card = read("app/components/homelab/HomelabServiceCard.tsx");
	const metadata = read("app/components/homelab/HomelabCatalogMetadata.tsx");
	assert.match(card, /<HomelabCatalogMetadata service=\{svc\}/);
	assert.match(card, /data-catalog-without-fresh-evidence/);
	for (const field of ["catalogEntityKind", "lifecycle", "criticality", "businessCriticality"])
		assert.ok(metadata.includes(field), field);
	assert.match(metadata, /data-backstage-v2-metadata/);
	assert.doesNotMatch(metadata, /endpointUrl|internalHost|tunnelUrl|DATA_SOURCE_NAME/);
});

test("French and English catalog badges explain declaration rather than measured health", () => {
	for (const locale of ["fr", "en"]) {
		const catalog = JSON.parse(read(`messages/homelab/${locale}.json`)).homelab.catalog;
		for (const key of [
			"entityKind", "lifecycleLabel", "operationalCriticality", "businessCriticality",
			"declarativeOnly", "noFreshEvidence",
		]) {
			assert.equal(typeof catalog[key], "string", `${locale}.${key}`);
			assert.ok(catalog[key].length > 0);
		}
		for (const key of ["component", "resource", "api"]) assert.ok(catalog.kinds[key]);
		for (const key of ["critical", "high", "medium", "low"]) assert.ok(catalog.levels[key]);
	}
});
