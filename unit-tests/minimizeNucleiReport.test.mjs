import assert from "node:assert/strict";
import test from "node:test";
import { minimizeNucleiJsonl } from "../scripts/security/minimize-nuclei-report.mjs";

test("Nuclei artifact removes captured HTTP evidence and URL paths", () => {
	const raw = JSON.stringify({
		"template-id": "cve-2026-1234",
		info: { name: "reflected SECRET from response", severity: "high" },
		"matched-at": "https://albanandrieu.com/login?token=SECRET",
		request: "Authorization: Bearer SECRET",
		response: "Set-Cookie: SESSION=SECRET",
	});
	const output = minimizeNucleiJsonl(raw);
	assert.doesNotMatch(output, /SECRET|Authorization|Set-Cookie|login/);
	assert.deepEqual(JSON.parse(output), {
		"template-id": "cve-2026-1234",
		type: "http",
		info: { name: "cve-2026-1234", severity: "high" },
		"matched-at": "https://albanandrieu.com",
	});
});

test("Nuclei publishes only high/critical findings", () => {
	const item = (severity) =>
		JSON.stringify({
			"template-id": "test-123",
			info: { name: "test", severity },
			host: "https://www.albanandrieu.com/",
		});
	const result = minimizeNucleiJsonl(
		["medium", "high", "critical", "low"].map(item).join("\n"),
	);
	assert.equal(result.trim().split("\n").length, 2);
});

test("Nuclei refuses nonallowlisted or credentialed origins and invalid identity", () => {
	for (const badUrl of [
		"http://albanandrieu.com/",
		"https://albanandrieu.com.evil.invalid/",
		"https://user:pass@albanandrieu.com/",
		"https://albanandrieu.com:10443/",
	]) {
		assert.throws(() =>
			minimizeNucleiJsonl(
				JSON.stringify({
					"template-id": "test-123",
					info: { name: "test", severity: "critical" },
					"matched-at": badUrl,
				}),
			),
		);
	}
	assert.throws(() => minimizeNucleiJsonl("{bad json"));
});
