// Fail-closed producer-side minimization. Never upload the raw ZAP report.
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ALLOWED_HOSTS = new Set(["albanandrieu.com", "www.albanandrieu.com"]);
const MAX_INPUT_BYTES = 8_000_000;
const MAX_OUTPUT_BYTES = 1_000_000;

export function minimizeZapReport(input) {
	if (
		!input ||
		typeof input !== "object" ||
		Array.isArray(input) ||
		!Array.isArray(input.site) ||
		input.site.length > 20
	) {
		throw new Error("invalid ZAP sites");
	}
	const sites = [];
	let totalAlerts = 0;
	for (const site of input.site) {
		if (
			!site ||
			typeof site !== "object" ||
			Array.isArray(site) ||
			typeof site["@name"] !== "string" ||
			!Array.isArray(site.alerts) ||
			site.alerts.length > 2000
		) {
			throw new Error("invalid ZAP site");
		}
		const target = new URL(site["@name"]);
		if (
			target.protocol !== "https:" ||
			!ALLOWED_HOSTS.has(target.hostname) ||
			target.username ||
			target.password ||
			(target.port && target.port !== "443") ||
			target.pathname !== "/" ||
			target.search ||
			target.hash
		) {
			throw new Error("ZAP target outside public allowlist");
		}
		const seen = new Set();
		const alerts = [];
		for (const alert of site.alerts) {
			if (!alert || typeof alert !== "object" || Array.isArray(alert)) {
				throw new Error("invalid ZAP alert");
			}
			if (String(alert.riskcode) !== "3") continue;
			const pluginid = String(alert.pluginid ?? "");
			if (!/^[0-9]{1,10}$/.test(pluginid)) {
				throw new Error("invalid ZAP rule ID");
			}
			if (seen.has(pluginid)) continue;
			seen.add(pluginid);
			totalAlerts++;
			if (totalAlerts > 500) throw new Error("too many high-risk alerts");
			// The original alert, instances, URLs, headers, evidence and HTML
			// are deliberately never copied, even when they look innocuous.
			alerts.push({
				pluginid,
				riskcode: "3",
				alert: `ZAP passive rule ${pluginid}`,
			});
		}
		sites.push({ "@name": target.origin, alerts });
	}
	return { site: sites };
}

function main() {
	if (process.argv.length !== 4)
		throw new Error("expected input and output filenames");
	const [inputPath, outputPath] = process.argv.slice(2);
	if (
		!statSync(inputPath).isFile() ||
		statSync(inputPath).size > MAX_INPUT_BYTES
	) {
		throw new Error("ZAP report exceeds budget");
	}
	const payload = JSON.parse(readFileSync(inputPath, "utf8"));
	const output = JSON.stringify(minimizeZapReport(payload)) + "\n";
	if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES)
		throw new Error("minimized ZAP report too large");
	writeFileSync(outputPath, output, { mode: 0o600, flag: "wx" });
	process.stdout.write(
		"PASS: minimized ZAP producer artifact (HIGH rule IDs and public origins only)\n",
	);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	try {
		main();
	} catch {
		process.stderr.write(
			"FAIL: ZAP report minimization rejected unsafe or malformed input\n",
		);
		process.exitCode = 1;
	}
}
