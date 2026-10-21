import assert from "node:assert/strict";
import test from "node:test";
import { parseSiteHealthV2, siteHealthIndex } from "../lib/siteHealthV2";

const REVISION = "sha256:" + "a".repeat(64);
const DTO = {
	schemaVersion: 2,
	model: "backstage-health",
	catalogRevision: REVISION,
	boardState: "fresh",
	services: [
		{ entityRef: "component:default/garage", state: "ok" },
		{ entityRef: "resource:default/postgres", state: "unknown" },
	],
} as const;

test("site v2 machine health is accepted only with matching revision", () => {
	const parsed = parseSiteHealthV2(DTO);
	assert.ok(parsed);
	assert.equal(parsed.schemaVersion, 2);
	assert.equal(
		siteHealthIndex(parsed, REVISION).get("component:default/garage"),
		"ok",
	);
	assert.equal(siteHealthIndex(parsed, "sha256:" + "b".repeat(64)).size, 0);
});

test("stale board cannot claim service health and duplicate refs are denied", () => {
	const stale = parseSiteHealthV2({ ...DTO, boardState: "stale" });
	assert.ok(stale);
	assert.equal(stale.services[0].state, "unknown");
	assert.equal(siteHealthIndex(stale, REVISION).size, 0);
	assert.equal(parseSiteHealthV2({ ...DTO, model: "backstage" }), null);
	assert.equal(
		parseSiteHealthV2({
			...DTO,
			services: [DTO.services[0], DTO.services[0]],
		}),
		null,
	);
});

test("extra operational data is never preserved in the status projection", () => {
	const parsed = parseSiteHealthV2({
		...DTO,
		internalHost: "172.17.0.24",
		services: [
			{ ...DTO.services[0], url: "https://private.invalid", token: "SECRET" },
		],
	});
	assert.ok(parsed);
	const serialized = JSON.stringify(parsed);
	assert.doesNotMatch(
		serialized,
		/SECRET|internalHost|private\.invalid|172\.17/,
	);
});
