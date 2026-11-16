import assert from "node:assert/strict";
import test from "node:test";
import { homelabHealthColor } from "../lib/homelabHealthPresentation";
import { parseSiteHealthV2, siteHealthIndex } from "../lib/siteHealthV2";

const REVISION = "sha256:" + "a".repeat(64);

test("a night-window App outside its window stays scheduled and purple", () => {
	const parsed = parseSiteHealthV2({
		schemaVersion: 2,
		model: "backstage-health",
		catalogRevision: REVISION,
		boardState: "fresh",
		services: [{ entityRef: "component:default/bitcoind", state: "scheduled" }],
	});
	assert.ok(parsed);
	const state = siteHealthIndex(parsed, REVISION).get(
		"component:default/bitcoind",
	);
	assert.equal(state, "scheduled");
	assert.equal(homelabHealthColor("scheduled"), "#a78bfa");
});
