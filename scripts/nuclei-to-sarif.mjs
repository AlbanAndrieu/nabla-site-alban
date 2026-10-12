import { readFileSync, writeFileSync } from "node:fs";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
	console.error(
		"Usage: node scripts/nuclei-to-sarif.mjs <nuclei.jsonl> <nuclei.sarif>",
	);
	process.exitCode = 2;
} else {
	const levels = {
		critical: "error",
		high: "error",
		medium: "warning",
		low: "note",
		info: "note",
	};
	const rows = readFileSync(input, "utf8").split(/\r?\n/).filter(Boolean);
	const findings = rows.map((line) => JSON.parse(line));
	const rules = new Map();
	const results = [];
	for (const finding of findings) {
		const id = String(finding["template-id"] ?? "unknown");
		const severity = String(finding.info?.severity ?? "unknown").toLowerCase();
		const description = String(finding.info?.name ?? id).slice(0, 300);
		if (!rules.has(id)) {
			rules.set(id, {
				id,
				shortDescription: { text: description },
				properties: { "security-severity": severity },
			});
		}
		// Avoid leaking URLs, hostnames, responses, cookies and matched payloads.
		results.push({
			ruleId: id,
			level: levels[severity] ?? "note",
			message: { text: description },
			properties: { severity },
		});
	}
	const report = {
		version: "2.1.0",
		$schema: "https://json.schemastore.org/sarif-2.1.0.json",
		runs: [
			{
				tool: { driver: { name: "Nuclei", rules: [...rules.values()] } },
				results,
			},
		],
	};
	writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
