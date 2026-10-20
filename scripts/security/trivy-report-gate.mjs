// Fail closed on invalid Trivy reports; never print raw findings, source paths,
// environment variables or captured secrets in public CI output.
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path || process.argv.length !== 3) {
	console.error("TRIVY_REPORT_REQUIRED");
	process.exit(2);
}

let report;
try {
	report = JSON.parse(readFileSync(path, "utf8"));
} catch {
	console.error("TRIVY_REPORT_UNREADABLE");
	process.exit(2);
}

if (!report || !Array.isArray(report.Results) || report.Results.length === 0) {
	console.error("TRIVY_REPORT_INCOMPLETE: no scan targets were recorded");
	process.exit(2);
}

let critical = 0;
let high = 0;
let licenseReview = 0;
let targets = 0;
for (const result of report.Results) {
	if (!result || typeof result !== "object") {
		console.error("TRIVY_REPORT_INVALID_TARGET");
		process.exit(2);
	}
	targets++;
	for (const key of ["Vulnerabilities", "Misconfigurations"]) {
		const findings = result[key];
		if (findings === undefined || findings === null) continue;
		if (!Array.isArray(findings)) {
			console.error("TRIVY_REPORT_INVALID_FINDINGS");
			process.exit(2);
		}
		for (const finding of findings) {
			const severity = String(finding?.Severity ?? "").toUpperCase();
			if (severity === "CRITICAL") critical++;
			if (severity === "HIGH") high++;
		}
	}
	const licenses = result.Licenses;
	if (licenses !== undefined && licenses !== null) {
		if (!Array.isArray(licenses)) {
			console.error("TRIVY_REPORT_INVALID_LICENSES");
			process.exit(2);
		}
		licenseReview += licenses.filter((license) =>
			["CRITICAL", "HIGH", "UNKNOWN"].includes(
				String(license?.Severity ?? "").toUpperCase(),
			),
		).length;
	}
}

const summary = `Trivy filesystem: ${targets} scan targets; CRITICAL=${critical}, HIGH=${high}, licenses-for-review=${licenseReview}`;
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) {
	const { appendFileSync } = await import("node:fs");
	appendFileSync(
		process.env.GITHUB_STEP_SUMMARY,
		`\n## Trivy filesystem policy\n\n${summary}\n\nCritical vulnerabilities and misconfigurations block this gate. License review does not yet block.\n`,
	);
}
if (critical > 0) {
	console.error(
		"TRIVY_CRITICAL_BLOCKED: resolve or review the specific results privately",
	);
	process.exit(1);
}
