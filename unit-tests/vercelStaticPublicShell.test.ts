import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("localized public pages are build-time static instead of per-request SSR", async () => {
	const layout = await read("app/[locale]/layout.tsx");
	assert.match(layout, /export const dynamicParams = false/);
	assert.match(layout, /generateStaticParams/);
	assert.match(layout, /routing\.locales\.map/);

	for (const path of [
		"app/[locale]/page.tsx",
		"app/[locale]/security/page.tsx",
		"app/[locale]/security/yubikey/page.tsx",
		"app/[locale]/truenas/page.tsx",
	]) {
		const page = await read(path);
		assert.match(page, /export const dynamic = "force-static"/, path);
		assert.match(page, /setRequestLocale\(locale\)/, path);
	}
});

test("server API authorization remains runtime-only and uncached", async () => {
	for (const path of [
		"app/api/homelab-health/route.ts",
		"app/api/homelab-services/route.ts",
		"app/api/homelab-health-v2/route.ts",
	]) {
		const source = await read(path);
		assert.match(source, /export const dynamic = "force-dynamic"/, path);
		assert.match(source, /gatedHomelabResponse|catalogUnavailableResponse/, path);
		assert.doesNotMatch(source, /export const dynamic = "force-static"/, path);
	}
});

test("TrueNAS page preserves dynamic authorized client diagnostics", async () => {
	const page = await read("app/[locale]/truenas/page.tsx");
	assert.match(page, /<HomelabServicesSection/, "TrueNAS has live SERVICE\/OWNER tiles");
	const hook = await read("app/components/homelab/useHomelabHealth.ts");
	assert.match(hook, /PUBLIC_HEALTH_REFRESH_MS = 120_000/);
	assert.match(hook, /readOnly \? PUBLIC_HEALTH_REFRESH_MS : HEALTH_REFRESH_MS/);
});
