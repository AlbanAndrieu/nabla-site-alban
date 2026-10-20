import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const ALLOWED_HOSTS = new Set(["albanandrieu.com", "www.albanandrieu.com"]);

export function minimizeNucleiJsonl(raw) {
	const kept = [];
	for (const line of raw.split(/\r?\n/)) {
		if (!line.trim()) continue;
		const finding = JSON.parse(line);
		if (!finding || typeof finding !== "object" || !finding.info) {
			throw new Error("NUCLEI_REPORT_INVALID");
		}
		const severity = String(finding.info.severity ?? "").toLowerCase();
		if (severity !== "high" && severity !== "critical") continue;
		const id = finding["template-id"] ?? finding.templateID;
		// Names returned by templates may contain reflected URLs or response material.
		// The verified template ID is sufficient for a stable finding title.
		const name = id;
		if (
			typeof id !== "string" ||
			!/^[\w.-]{1,160}$/.test(id) ||
			typeof name !== "string" ||
			name.length < 1 ||
			name.length > 200
		) {
			throw new Error("NUCLEI_FINDING_IDENTITY_INVALID");
		}
		const url = new URL(finding["matched-at"] ?? finding.host);
		if (
			url.protocol !== "https:" ||
			!ALLOWED_HOSTS.has(url.hostname) ||
			url.username ||
			url.password ||
			url.port
		) {
			throw new Error("NUCLEI_TARGET_NOT_ALLOWLISTED");
		}
		kept.push(
			JSON.stringify({
				"template-id": id,
				type: "http",
				info: { name, severity },
				"matched-at": url.origin,
			}),
		);
	}
	return kept.length ? `${kept.join("\n")}\n` : "";
}

if (
	process.argv[1] &&
	basename(process.argv[1]) === "minimize-nuclei-report.mjs"
) {
	const [input, output] = process.argv.slice(2);
	if (!input || !output) {
		console.error("NUCLEI_REPORT_INPUT_OUTPUT_REQUIRED");
		process.exitCode = 2;
	} else {
		try {
			const result = minimizeNucleiJsonl(readFileSync(input, "utf8"));
			writeFileSync(output, result, { mode: 0o600 });
			console.log("NUCLEI_APPROVED_REPORT_READY");
		} catch {
			console.error("NUCLEI_REPORT_REJECTED");
			process.exitCode = 1;
		}
	}
}
