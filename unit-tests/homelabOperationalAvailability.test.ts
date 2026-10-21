import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { operationalEvidenceFailure } from "../lib/homelabOperationalAvailability";

test("operational evidence exposes only approved owner boundary diagnostic", () => {
	assert.equal(
		operationalEvidenceFailure(503, { reason: "owner-boundary" }),
		"owner-boundary",
	);
	assert.equal(
		operationalEvidenceFailure(503, { reason: "upstream-unavailable" }),
		"upstream-unavailable",
	);
	assert.equal(
		operationalEvidenceFailure(503, {
			reason: "owner-boundary ",
			key: "SECRET",
		}),
		"upstream-unavailable",
	);
	assert.equal(
		operationalEvidenceFailure(401, { reason: "owner-boundary" }),
		"upstream-unavailable",
	);
	assert.equal(operationalEvidenceFailure(404, null), "access-denied");
	assert.equal(operationalEvidenceFailure(502, null), "upstream-unavailable");
	assert.equal(operationalEvidenceFailure(503, null), "upstream-unavailable");
});

test("the owner-only observability route never returns raw upstream errors", async () => {
	const source = await readFile(
		new URL("../app/api/homelab-observability/route.ts", import.meta.url),
		"utf8",
	);
	const browser = await readFile(
		new URL(
			"../app/components/homelab/HomelabOperationalEvidence.tsx",
			import.meta.url,
		),
		"utf8",
	);
	assert.match(
		source,
		/gatedHomelabResponse\(request, observabilityResponse\)/,
	);
	assert.match(source, /error === "owner-upstream-disabled"/);
	assert.match(source, /"owner-boundary"/);
	assert.doesNotMatch(source, /detail: error/);
	assert.match(browser, /operationalEvidenceFailure\(response.status, body\)/);
	assert.match(browser, /data-operational-evidence-reason/);
	assert.match(browser, /failure !== "owner-boundary"/);
	assert.doesNotMatch(browser, /HOMELAB_OWNER_RAW_UPSTREAM_ENABLED/);
});
