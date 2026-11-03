import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string): string {
	return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("v2 health adapter uses SERVICE key exclusively in Next server code", () => {
	const route = source("app/api/homelab-health-v2/route.ts");
	const server = source("lib/siteHealthV2Server.ts");
	assert.match(
		route,
		/gatedHomelabResponse\(\s*request,\s*\(\)\s*=>\s*healthResponse\(request\)\s*\)/,
	);
	assert.match(route, /catalogUnavailableResponse\(\s*request,\s*error/);
	assert.match(server, /process\.env\.DIAGNOSTICS_ACCESS_KEY/);
	assert.match(server, /cache: "no-store"/);
	assert.match(server, /redirect: "error"/);
	assert.doesNotMatch(source("lib/siteHealthV2.ts"), /DIAGNOSTICS_ACCESS_KEY/);
	assert.match(
		source("app/components/homelab/HomelabServicesBlock.tsx"),
		/siteHealth=\{state.siteHealth\}/,
	);
});

test("public v2 health 503 hides the SERVICE key state from visitors", async () => {
	const { GET } = await import("../app/api/homelab-health-v2/route");
	const saved = {
		HOMELAB_PUBLIC_READONLY_ENABLED:
			process.env.HOMELAB_PUBLIC_READONLY_ENABLED,
		DIAGNOSTICS_ACCESS_KEY: process.env.DIAGNOSTICS_ACCESS_KEY,
		VERCEL: process.env.VERCEL,
	};
	process.env.HOMELAB_PUBLIC_READONLY_ENABLED = "true";
	delete process.env.DIAGNOSTICS_ACCESS_KEY;
	delete process.env.VERCEL;
	try {
		const response = await GET(
			new Request("https://www.albanandrieu.com/api/homelab-health-v2"),
		);
		assert.equal(response.status, 503);
		assert.deepEqual(await response.json(), {
			error: "Backstage v2 health unavailable",
			reason: "unavailable",
		});
		assert.match(
			response.headers.get("X-Nabla-Trace-ID") ?? "",
			/^[a-f0-9]{32}$/,
		);
		assert.equal(response.headers.get("X-Nabla-Diagnostic-Stage"), null);
		assert.match(response.headers.get("cache-control") ?? "", /no-store/);
	} finally {
		for (const [name, value] of Object.entries(saved)) {
			if (value === undefined) delete process.env[name];
			else process.env[name] = value;
		}
	}
});
