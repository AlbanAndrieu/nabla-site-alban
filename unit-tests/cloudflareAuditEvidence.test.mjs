import assert from "node:assert/strict";
import test from "node:test";
import { validateAudit } from "../scripts/validate-cloudflare-audit.mjs";

const HEAD = "a".repeat(40);
const UPSTREAM = "b".repeat(40);
const valid = () => ({
	headSha: HEAD,
	upstreamSha: UPSTREAM,
	upstreamLicense: "MIT",
	auditedAt: "2026-10-10T21:00:00Z",
	controls: [
		{
			id: "access-anonymous",
			scope: "site",
			status: "not-run",
			reason: "No operator credentials",
		},
	],
});

test("accepts explicit not-run controls without claiming success", () => {
	assert.deepEqual(validateAudit(valid(), HEAD), []);
});
test("rejects missing upstream provenance and SHA mismatch", () => {
	const evidence = valid();
	evidence.upstreamSha = "latest";
	assert.match(
		validateAudit(evidence, "c".repeat(40)).join(" "),
		/upstreamSha/,
	);
	assert.match(
		validateAudit(evidence, "c".repeat(40)).join(" "),
		/headSha differs/,
	);
});
test("requires evidence for pass and fail", () => {
	for (const status of ["pass", "fail"]) {
		const evidence = valid();
		evidence.controls[0] = { id: status, scope: "site", status };
		assert.match(validateAudit(evidence).join(" "), /evidence required/);
	}
});
test("rejects duplicate control identifiers and unsubstantiated exclusion", () => {
	const evidence = valid();
	evidence.controls.push({
		id: "access-anonymous",
		scope: "site",
		status: "not-applicable",
	});
	const errors = validateAudit(evidence).join(" ");
	assert.match(errors, /duplicated/);
	assert.match(errors, /reason required/);
});
test("rejects malformed evidence payload", () => {
	assert.match(validateAudit([]).join(" "), /JSON object/);
	assert.match(validateAudit({}).join(" "), /controls/);
});

test("rejects an unknown status rather than treating it as successful", () => {
	const evidence = valid();
	evidence.controls[0].status = "success";
	assert.match(validateAudit(evidence).join(" "), /status invalid/);
});

test("rejects malformed DSOMM activity UUIDs", () => {
	const evidence = valid();
	evidence.controls[0].activityUuid = "00000000-0000-0000-0000-000000000000";
	assert.match(validateAudit(evidence).join(" "), /activityUuid invalid/);
});

test("accepts a documented failed control without upgrading it to pass", () => {
	const evidence = valid();
	evidence.controls[0] = {
		id: "access-anonymous",
		scope: "site",
		status: "fail",
		evidence: "redacted/report.json",
	};
	assert.deepEqual(validateAudit(evidence, HEAD), []);
});

test("rejects invalid evidence timestamp", () => {
	const evidence = valid();
	evidence.auditedAt = "2026-99-99T00:00:00Z";
	assert.match(validateAudit(evidence).join(" "), /auditedAt/);
});

test("rejects a missing reason for an unexecuted check", () => {
	const evidence = valid();
	delete evidence.controls[0].reason;
	assert.match(validateAudit(evidence).join(" "), /reason required/);
});

test("accepts a syntactically valid DSOMM UUID without attesting its provenance", () => {
	const evidence = valid();
	evidence.controls[0].activityUuid =
		"123e4567-e89b-42d3-a456-426614174000";
	assert.deepEqual(validateAudit(evidence, HEAD), []);
});
