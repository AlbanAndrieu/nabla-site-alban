import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
	readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Backstage v2 runtime service model imports no legacy v1 catalog", () => {
	const runtime = read("lib/homelabServices.ts");
	assert.doesNotMatch(
		runtime,
		/homelab-services\.json|homelab-navigation-overrides\.json/,
	);
	assert.doesNotMatch(
		runtime,
		/getStaticHomelabServicesCatalog|parseHomelabServicesCatalog/,
	);
	assert.doesNotMatch(
		read("lib/serviceTopology.ts"),
		/service-topology\.json|LOCAL_FALLBACK|fetch\(/,
	);
});

test("no legacy compatibility module or fixture remains", () => {
	for (const path of [
		"lib/homelabServicesServer.ts",
		"unit-tests/helpers/homelabLegacyCatalogFixture.ts",
	]) {
		assert.equal(
			existsSync(new URL("../" + path, import.meta.url)),
			false,
			path,
		);
	}
	assert.doesNotMatch(
		read("app/components/homelab/HomelabServiceGrid.tsx"),
		/homelabServiceEndpointUrl/,
	);
});
