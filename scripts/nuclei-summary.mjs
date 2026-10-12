import { readFileSync } from "node:fs";

const file = process.argv[2];
const ignoreFile = process.argv[3];

function readReport(path) {
	try {
		const raw = readFileSync(path, "utf8");
		return raw
			.split(/\r?\n/)
			.filter(Boolean)
			.map((line, index) => {
				try {
					return JSON.parse(line);
				} catch {
					throw new Error(`Invalid Nuclei JSONL on line ${index + 1}`);
				}
			});
	} catch (error) {
		if (error.code === "ENOENT") return null;
		throw error;
	}
}

export function summarizeFindings(findings) {
	const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, unknown: 0 };
	for (const finding of findings) {
		const severity = String(finding.info?.severity ?? "unknown").toLowerCase();
		if (Object.hasOwn(counts, severity)) counts[severity] += 1;
		else counts.unknown += 1;
	}
	return counts;
}

if (file) {
	const findings = readReport(file);
	console.log("## Nuclei public DAST — albanandrieu.com");
	console.log("");
	if (findings === null) {
		console.log("**NOT RUN** — no report was produced; this is not zero vulnerabilities.");
		process.exitCode = 1;
	} else {
		const counts = summarizeFindings(findings);
		console.log(`Found ${findings.length} matched templates (not independently verified vulnerabilities).`);
		console.log("");
		console.log("| Severity | Findings |");
		console.log("| --- | ---: |");
		for (const [severity, count] of Object.entries(counts)) {
			console.log(`| ${severity} | ${count} |`);
		}
		console.log("");
		console.log("### Findings (template IDs only)");
		for (const finding of findings.slice(0, 25)) {
			const id = String(finding["template-id"] ?? "unknown").replace(/[^a-zA-Z0-9_.-]/g, "");
			const severity = String(finding.info?.severity ?? "unknown").replace(/[^a-zA-Z]/g, "");
			console.log(`- \`${id}\` — ${severity}`);
		}
		if (findings.length > 25) console.log(`- … ${findings.length - 25} additional findings in the private artifact`);
	}
	if (ignoreFile) {
		const exclusions = readFileSync(ignoreFile, "utf8")
			.split(/\r?\n/)
			.filter((line) => line.trim() && !line.trim().startsWith("#"));
		console.log("");
		console.log(`Reviewed template exclusions: ${exclusions.length}`);
		for (const id of exclusions) console.log(`- \`${id}\``);
	}
	console.log("");
	console.log("An absent report is NOT_RUN; a report with no matches is not proof of security.");
}
