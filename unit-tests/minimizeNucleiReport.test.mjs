import assert from "node:assert/strict";
import test from "node:test";
import { minimizeNucleiJsonl } from "../scripts/security/minimize-nuclei-report.mjs";

test("Nuclei collector artifact contains only approved high findings", () => {
	const report = {
		"template-id": "cve-2026-1234",
		"matched-at": "https://www.albanandrieu.com/login?token=SENSITIVE_VALUE",
		info: {
			name: "Known security issue",
			severity: "high",
			description: "SENSITIVE_DESCRIPTION",
		},
		request: "Authorization: Bearer SENSITIVE_VALUE",
		response: "Set-Cookie: SENSITIVE_VALUE",
	};
	const minimal = minimizeNucleiJsonl(`${JSON.stringify(report)}\n`);
	const finding = JSON.parse(minimal.trim());
	assert.deepEqual(finding, {
		"template-id": "cve-2026-1234",
		type: "http",
		info: { name: "Known security issue", severity: "high" },
		"matched-at": "https://www.albanandrieu.com",
	});
	assert.doesNotMatch(minimal, /SENSITIVE_/);
});

test("Nuclei medium findings are not uploaded to collector", () => {
	assert.equal(
		minimizeNucleiJsonl(
			JSON.stringify({
				"template-id": "medium-test",
				"matched-at": "https://albanandrieu.com/",
				info: { name: "Nonblocking", severity: "medium" },
			}),
		),
		"",
	);
});

test("Nuclei off-domain, HTTP and invalid findings fail closed", () => {
	for (const target of [
		"http://www.albanandrieu.com/",
		"https://attacker.invalid/",
		"https://www.albanandrieu.com.evil.invalid/",
	]) {
		assert.throws(() =>
			minimizeNucleiJsonl(
				JSON.stringify({
					"template-id": "high-test",
					"matched-at": target,
					info: { name: "Security issue", severity: "critical" },
				}),
			),
		);
	}
	assert.throws(() => minimizeNucleiJsonl("{not json"));
});
