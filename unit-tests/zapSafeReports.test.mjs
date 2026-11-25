import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	parseMinimizedZap,
	renderMinimizedZap,
} from "../scripts/security/render-zap-safe-report.mjs";

const site = (alerts = [], origin = "https://www.albanandrieu.com") => ({
	"@name": origin,
	alerts,
});
const alert = (pluginid = "10020") => ({
	pluginid,
	riskcode: "3",
	alert: "ZAP passive rule " + pluginid,
});

test("no HIGH alerts yields valid empty SARIF without claiming full coverage", () => {
	const input = { site: [site()] };
	assert.equal(parseMinimizedZap(input).highCount, 0);
	const output = renderMinimizedZap(input);
	assert.equal(JSON.parse(output.sarif).version, "2.1.0");
	assert.deepEqual(JSON.parse(output.sarif).runs[0].results, []);
	assert.match(output.html, /0<\/strong> identifiant/);
	assert.match(output.summary, /WARN\/LOW/);
});

test("HIGH alerts become SARIF rule IDs, not HTTP request evidence", () => {
	const output = renderMinimizedZap({
		site: [site([alert(), alert("10021")])],
	});
	assert.deepEqual(
		JSON.parse(output.sarif).runs[0].results.map((r) => r.ruleId),
		["ZAP-10020", "ZAP-10021"],
	);
	assert.match(output.html, /ZAP-10021/);
	assert.doesNotMatch(
		output.html + output.sarif,
		/Authorization|requestHeader|responseBody|instance/,
	);
});

test("unknown fields, non-HIGH data, duplicate IDs and private hosts are rejected", () => {
	for (const input of [
		{ site: [] },
		{ site: [site()], secret: "NEVER_PRINT" },
		{ site: [{ ...site(), secret: "NEVER_PRINT" }] },
		{ site: [site([alert()], "https://evil.example")] },
		{ site: [site([{ ...alert(), evidence: "NEVER_PRINT" }])] },
		{ site: [site([{ ...alert(), riskcode: "2" }])] },
		{ site: [site([{ ...alert(), alert: "secret" }])] },
		{ site: [site([alert(), alert()])] },
	])
		assert.throws(() => renderMinimizedZap(input));
});

test("CLI writes only redacted files, rejects repeat writes", () => {
	const dir = mkdtempSync(join(tmpdir(), "zap-safe-"));
	try {
		const input = join(dir, "sanitized.json");
		writeFileSync(input, JSON.stringify({ site: [site([alert()])] }), {
			mode: 0o600,
		});
		const program = new URL(
			"../scripts/security/render-zap-safe-report.mjs",
			import.meta.url,
		).pathname;
		const execute = () =>
			spawnSync(process.execPath, [program, input, dir], { encoding: "utf8" });
		assert.equal(execute().status, 0);
		for (const name of ["report.html", "report.sarif", "summary.md"]) {
			assert.ok(readFileSync(join(dir, name), "utf8").length > 40);
		}
		assert.equal(execute().status, 1);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test("production workflow publishes only sanitized HTML, SARIF and JSON", async () => {
	const { readFile } = await import("node:fs/promises");
	const workflow = await readFile(
		new URL("../.github/workflows/master-dast.yml", import.meta.url),
		"utf8",
	);
	for (const name of [
		"render-zap-safe-report.mjs",
		"report.html",
		"report.sarif",
		"summary.md",
		"retention-days: 3",
	]) {
		assert.ok(workflow.includes(name), name);
	}
	assert.doesNotMatch(workflow, /uses:\s*zaproxy\/action-baseline/);
});

test("production DAST keeps the TrueNAS JSON-only ZIP contract", async () => {
	const { readFile } = await import("node:fs/promises");
	const workflow = await readFile(new URL("../.github/workflows/master-dast.yml", import.meta.url), "utf8");
	const collector = workflow.split("name: zap-production-report\n")[1]?.split("- name: Upload sanitized ZAP visual evidence")[0] ?? "";
	assert.ok(collector, "must publish the collector artifact");
	assert.ok(collector.includes("path: zap-production-safe/report_json.json"));
	for (const forbidden of ["report.html", "report.sarif", "summary.md"]) {
		assert.ok(!collector.includes(forbidden), "collector ZIP must not contain " + forbidden);
	}
	const visual = workflow.split("name: zap-production-visual-report\n")[1]?.split("- name: Present sanitized ZAP HTML")[0] ?? "";
	for (const name of ["report.html", "report.sarif", "summary.md"]) {
		assert.ok(visual.includes("zap-production-safe/" + name), name + " must be in the visual artifact");
	}
	assert.ok(!visual.includes("report_json.json"), "do not duplicate collector payload");
	assert.match(workflow, /steps\.safe-zap-artifact\.outputs\.artifact-id/);
	assert.match(workflow, /steps\.visual-zap-artifact\.outputs\.artifact-id/);
});
