import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public security feed list declares ten HTTPS sources with unique URLs", async () => {
	const file = new URL("../public/ciso-security-sources.json", import.meta.url);
	const config = JSON.parse(await readFile(file, "utf8")) as {
		sources: Array<{ title: string; url: string; scope: string }>;
	};
	assert.equal(config.sources.length, 10);
	assert.equal(new Set(config.sources.map((source) => source.url)).size, 10);
	assert.ok(config.sources.every((source) => new URL(source.url).protocol === "https:"));
	const opml = await readFile(new URL("../public/security-sources.opml", import.meta.url), "utf8");
	assert.equal((opml.match(/<outline /g) ?? []).length, 10);
	for (const source of config.sources) assert.ok(opml.includes(source.url.replaceAll("&", "&amp;")));
});

test("public security RSS route requires explicit publication opt-in", async () => {
	const route = await readFile(new URL("../lib/server/freshRssPublic.ts", import.meta.url), "utf8");
	assert.match(route, /FRESHRSS_PUBLICATION_ENABLED/);
	assert.match(route, /FRESHRSS_GREADER_AUTH/);
	assert.match(route, /redirect: "error"/);
	assert.ok(!route.includes("NEXT_PUBLIC_"));
});
