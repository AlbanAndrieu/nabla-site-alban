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
	controls: [{ id: "access-anonymous", scope: "site", status: "not-run", reason: "No operator credentials" }],
});

test("accepts explicit not-run controls without claiming success", () => {
	assert.deepEqual(validateAudit(valid(), HEAD), []);
});
test("rejects missing upstream provenance and SHA mismatch", () => {
	const evidence = valid();
	evidence.upstreamSha = "latest";
	assert.match(validateAudit(evidence, "c".repeat(40)).join(" "), /upstreamSha/);
	assert.match(validateAudit(evidence, "c".repeat(40)).join(" "), /headSha differs/);
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
	evidence.controls.push({ id: "access-anonymous", scope: "site", status: "not-applicable" });
	const errors = validateAudit(evidence).join(" ");
	assert.match(errors, /duplicated/);
	assert.match(errors, /reason required/);
});
test("rejects malformed evidence payload", () => {
	assert.match(validateAudit([]).join(" "), /JSON object/);
	assert.match(validateAudit({}).join(" "), /controls/);
});
