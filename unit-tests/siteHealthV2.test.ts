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

test("Backstage v2 health recognizes dot and underscore canonical references", () => {
	const parsed = parseSiteHealthV2({
		...DTO,
		services: [
			{ entityRef: "component:team_ops/service.v2", state: "ok" },
			{ entityRef: "resource:default/garage_admin", state: "warn" },
			{ entityRef: "api:default/service-api", state: "unknown" },
		],
	});
	assert.ok(parsed);
	const indexed = siteHealthIndex(parsed, REVISION);
	assert.equal(indexed.get("component:team_ops/service.v2"), "ok");
	assert.equal(indexed.get("resource:default/garage_admin"), "warn");
});

test("malformed SERVICE entity refs and non-string health values fail closed", () => {
	for (const entityRef of [
		"component:default/../secret",
		"component:default/name with spaces",
		"component:default/name/child",
		"component:/missing-namespace",
		`component:default/${"a".repeat(64)}`,
		"system:default/platform",
	]) {
		assert.equal(
			parseSiteHealthV2({
				...DTO,
				services: [{ entityRef, state: "ok" }],
			}),
			null,
			entityRef,
		);
	}
	assert.equal(
		parseSiteHealthV2({
			...DTO,
			services: [{ entityRef: "component:default/service", state: { toString: () => "ok" } }],
		}),
		null,
	);
	assert.equal(
		parseSiteHealthV2({
			...DTO,
			boardState: { toString: () => "fresh" },
		}),
		null,
	);
});
