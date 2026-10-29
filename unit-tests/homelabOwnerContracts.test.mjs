import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
	readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("OWNER data routes gate the visitor before reading upstream", () => {
	for (const path of [
		"app/api/homelab-health/route.ts",
		"app/api/homelab-probes/route.ts",
		"app/api/homelab-observability/route.ts",
		"app/api/homelab-diagnostics/route.ts",
		"app/api/runtime-topology/route.ts",
	]) {
		assert.match(read(path), /gatedHomelabResponse\(request,/);
	}
	assert.match(read("lib/privateHomelabResponse.ts"), /private, no-store/);
});

test("FastAPI OWNER egress requires a server key and never follows redirects", () => {
	const guard = read("lib/homelabOwnerBoundary.ts");
	assert.match(
		guard,
		/Boolean\(vercelEnvironment\) && !diagnosticsKey\?\.trim\(\)/,
	);
	assert.match(guard, /rawOwnerEnabled === "false"/);
	for (const path of [
		"lib/fastApiHealthBoard.ts",
		"lib/homelabHealthTransport.ts",
		"lib/homelabDiagnostics.ts",
		"lib/runtimeTopology.ts",
	]) {
		const source = read(path);
		assert.match(source, /ownerUpstreamBlocked\(/);
		assert.match(
			source,
			/ownerDiagnosticHeaders\(process\.env\.DIAGNOSTICS_ACCESS_KEY\)/,
		);
		assert.match(source, /redirect: "error"/);
	}
});

test("catalog v2 uses public SVG icons even when probes are unavailable", () => {
	const projection = read("lib/homelabCatalogV2Projection.ts");
	assert.match(projection, /iconSrc: homelabCatalogIconSrc\(id\)/);
	const icons = read("lib/homelabCatalogIcons.generated.ts");
	assert.match(
		read("lib/homelabCatalogIcons.ts"),
		/homelabCatalogIcons\.generated\.ts/,
	);
	const paths = [...icons.matchAll(/"([a-z0-9-]+\.svg)"/g)].map(
		(match) => match[1],
	);
	assert.ok(paths.length >= 10);
	for (const icon of paths) {
		assert.ok(
			existsSync(
				new URL(`../public/assets/selfh-icons/${icon}`, import.meta.url),
			),
		);
	}
});
