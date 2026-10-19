import assert from "node:assert/strict";
import test from "node:test";
import { minimizeZapReport } from "../scripts/security/minimize-zap-report.mjs";

test("ZAP producer exports only High rule IDs and allowlisted origins", () => {
	const raw = {
		site: [
			{
				"@name": "https://www.albanandrieu.com",
				alerts: [
					{
						pluginid: "10020",
						riskcode: "3",
						alert: "secret token=fixture-sensitive-123",
						evidence: "cookie=fixture-sensitive-123",
						instances: [
							{
								uri: "https://www.albanandrieu.com/secret?token=fixture-sensitive-123",
								requestHeader: "Authorization: fixture-sensitive-123",
								responseBody: "PII",
							},
						],
					},
					{ pluginid: "10038", riskcode: "1", alert: "Low severity" },
					{ pluginid: "10020", riskcode: "3", alert: "Duplicate" },
				],
			},
		],
	};
	const minimized = minimizeZapReport(raw);
	assert.deepEqual(minimized, {
		site: [
			{
				"@name": "https://www.albanandrieu.com",
				alerts: [
					{ pluginid: "10020", riskcode: "3", alert: "ZAP passive rule 10020" },
				],
			},
		],
	});
	assert.doesNotMatch(
		JSON.stringify(minimized),
		/fixture-sensitive|Authorization|responseBody|instances|secret|PII/,
	);
});

test("ZAP producer refuses unapproved hosts, credentials and path/query", () => {
	for (const target of [
		"http://www.albanandrieu.com",
		"https://defectdojo.int.albandrieu.com",
		`https://${["example-user", "example-passphrase"].join(":")}@www.albanandrieu.com`,
		"https://www.albanandrieu.com/internal",
		"https://www.albanandrieu.com/?token=sensitive",
		"https://www.albanandrieu.com:8443",
	]) {
		assert.throws(() =>
			minimizeZapReport({ site: [{ "@name": target, alerts: [] }] }),
		);
	}
});

test("ZAP producer rejects invalid report and High finding identities", () => {
	for (const input of [
		{},
		{ site: "invalid" },
		{ site: [{ "@name": "https://albanandrieu.com", alerts: "invalid" }] },
		{
			site: [
				{
					"@name": "https://albanandrieu.com",
					alerts: [{ pluginid: "123<cookie>", riskcode: "3" }],
				},
			],
		},
	])
		assert.throws(() => minimizeZapReport(input));
});

test("ZAP producer treats no High alerts as an explicit empty report", () => {
	assert.deepEqual(
		minimizeZapReport({
			site: [
				{
					"@name": "https://albanandrieu.com",
					alerts: [{ riskcode: "1", pluginid: "10020" }],
				},
			],
		}),
		{
			site: [{ "@name": "https://albanandrieu.com", alerts: [] }],
		},
	);
});
