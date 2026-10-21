import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string): string {
	return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("v2 health adapter uses SERVICE key exclusively in Next server code", () => {
	const route = source("app/api/homelab-health-v2/route.ts");
	const server = source("lib/siteHealthV2Server.ts");
	assert.match(route, /gatedHomelabResponse\(request, healthResponse\)/);
	assert.match(server, /process\.env\.DIAGNOSTICS_ACCESS_KEY/);
	assert.match(server, /cache: "no-store"/);
	assert.match(server, /redirect: "error"/);
	assert.doesNotMatch(source("lib/siteHealthV2.ts"), /DIAGNOSTICS_ACCESS_KEY/);
	assert.match(
		source("app/components/homelab/HomelabServicesBlock.tsx"),
		/siteHealth=\{state.siteHealth\}/,
	);
});
