import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("homelab health facade keeps contracts, parsing and transport separated", async () => {
	const facade = await source("lib/homelabHealth.ts");
	const parser = await source("lib/homelabHealthParser.ts");
	const transport = await source("lib/homelabHealthTransport.ts");

	assert.match(facade, /export \* from "\.\/homelabHealthTypes"/);
	assert.match(facade, /from "\.\/homelabHealthParser"/);
	assert.match(facade, /from "\.\/homelabHealthTransport"/);
	assert.doesNotMatch(facade, /homelabHealthBase/);
	assert.match(parser, /parseProbeSummary/);
	assert.match(parser, /parsePfSenseDnsPosture/);
	assert.doesNotMatch(parser, /fetch\(/);
	assert.match(transport, /fetch\(primaryUrl/);
	assert.match(transport, /parseHomelabHealthSnapshot/);
});

test("temporary homelabHealthBase module is removed", async () => {
	await assert.rejects(
		access(new URL("../lib/homelabHealthBase.ts", import.meta.url)),
	);
});
