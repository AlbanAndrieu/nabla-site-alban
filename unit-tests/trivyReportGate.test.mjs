import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const script = new URL(
	"../scripts/security/trivy-report-gate.mjs",
	import.meta.url,
).pathname;

function check(report) {
	const directory = mkdtempSync(join(tmpdir(), "trivy-gate-"));
	try {
		const filename = join(directory, "report.json");
		writeFileSync(filename, JSON.stringify(report));
		return spawnSync(process.execPath, [script, filename], {
			encoding: "utf8",
			env: { ...process.env, GITHUB_STEP_SUMMARY: "" },
		});
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}

test("Trivy report rejects absent or empty result arrays", () => {
	assert.equal(check({ Results: [] }).status, 2);
	assert.equal(check({}).status, 2);
});

test("Critical vulnerabilities block PRs, without logging identifiers", () => {
	const finding = {
		VulnerabilityID: "CVE-TEST-PRIVATE-DO-NOT-LOG",
		Severity: "CRITICAL",
	};
	const outcome = check({
		Results: [{ Target: "package-lock.json", Vulnerabilities: [finding] }],
	});
	assert.equal(outcome.status, 1);
	assert.doesNotMatch(
		outcome.stdout + outcome.stderr,
		/CVE-TEST-PRIVATE-DO-NOT-LOG/,
	);
});

test("High-only vulnerabilities and restricted license reviews are visible but not blocked", () => {
	const outcome = check({
		Results: [
			{
				Target: "package-lock.json",
				Vulnerabilities: [{ Severity: "HIGH" }],
				Licenses: [{ Severity: "HIGH" }],
			},
		],
	});
	assert.equal(outcome.status, 0);
	assert.match(outcome.stdout, /HIGH=1, licenses-for-review=1/);
});

test("Critical misconfigurations also block", () => {
	assert.equal(
		check({
			Results: [
				{ Target: "Dockerfile", Misconfigurations: [{ Severity: "CRITICAL" }] },
			],
		}).status,
		1,
	);
});

test("Malformed Trivy finding containers are fail closed", () => {
	assert.equal(
		check({ Results: [{ Target: "package-lock.json", Vulnerabilities: {} }] })
			.status,
		2,
	);
});
