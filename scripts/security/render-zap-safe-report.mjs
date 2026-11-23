/**
 * Offline presentation of a producer-minimized OWASP ZAP JSON report.
 * Only allowlisted HTTPS origins and numeric HIGH rule IDs leave the runner.
 * Refuse unexpected keys rather than copying potentially private evidence.
 */
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ALLOWED = new Set([
	"https://albanandrieu.com",
	"https://www.albanandrieu.com",
]);
const INPUT_LIMIT = 1_000_000;
const ALERT_LIMIT = 500;
function exactKeys(value, keys) {
	return (
		value !== null &&
		typeof value === "object" &&
		!Array.isArray(value) &&
		Object.keys(value).length === keys.length &&
		keys.every((key) => Object.hasOwn(value, key))
	);
}

export function parseMinimizedZap(input) {
	if (
		!exactKeys(input, ["site"]) ||
		!Array.isArray(input.site) ||
		input.site.length < 1 ||
		input.site.length > 20
	) {
		throw new TypeError("ZAP_SANITIZED_SCHEMA_INVALID");
	}
	const sites = [];
	const findings = [];
	for (const site of input.site) {
		if (
			!exactKeys(site, ["@name", "alerts"]) ||
			!ALLOWED.has(site["@name"]) ||
			!Array.isArray(site.alerts) ||
			site.alerts.length > ALERT_LIMIT
		) {
			throw new TypeError("ZAP_SANITIZED_SITE_INVALID");
		}
		const seen = new Set();
		for (const a of site.alerts) {
			if (
				!exactKeys(a, ["pluginid", "riskcode", "alert"]) ||
				typeof a.pluginid !== "string" ||
				!/^[0-9]{1,10}$/.test(a.pluginid) ||
				a.riskcode !== "3" ||
				a.alert !== "ZAP passive rule " + a.pluginid ||
				seen.has(a.pluginid)
			) {
				throw new TypeError("ZAP_SANITIZED_ALERT_INVALID");
			}
			seen.add(a.pluginid);
			findings.push({ origin: site["@name"], id: a.pluginid });
			if (findings.length > ALERT_LIMIT)
				throw new TypeError("ZAP_TOO_MANY_HIGH_ALERTS");
		}
		sites.push({ origin: site["@name"], ruleIds: [...seen].sort() });
	}
	return { sites, findings, highCount: findings.length };
}

export function renderMinimizedZap(input) {
	const data = parseMinimizedZap(input);
	const ruleIds = [...new Set(data.findings.map((f) => f.id))].sort();
	const sarif = {
		$schema: "https://json.schemastore.org/sarif-2.1.0.json",
		version: "2.1.0",
		runs: [
			{
				tool: {
					driver: {
						name: "OWASP ZAP (sanitized passive baseline)",
						informationUri: "https://www.zaproxy.org/",
						rules: ruleIds.map((id) => ({
							id: "ZAP-" + id,
							shortDescription: { text: "ZAP passive rule " + id },
							defaultConfiguration: { level: "error" },
						})),
					},
				},
				results: data.findings.map((f) => ({
					ruleId: "ZAP-" + f.id,
					level: "error",
					message: {
						text:
							"HIGH ZAP passive rule " +
							f.id +
							" on public origin " +
							f.origin +
							"; HTTP evidence withheld.",
					},
				})),
				properties: {
					evidenceScope: "HIGH-rule-identifiers-and-public-origins-only",
					coverageNotice:
						"WARN/LOW alerts and raw HTTP evidence were not retained.",
				},
			},
		],
	};
	const rows = data.sites
		.map((site) => {
			const rules =
				site.ruleIds.length > 0
					? site.ruleIds.map((id) => "ZAP-" + id).join(", ")
					: "Aucun identifiant HIGH conservé";
			return (
				"<tr><td><code>" +
				site.origin +
				"</code></td><td>" +
				rules +
				"</td></tr>"
			);
		})
		.join("\n");
	const html = [
		'<!doctype html><html lang="fr"><head><meta charset="utf-8">',
		'<meta name="viewport" content="width=device-width,initial-scale=1">',
		"<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'\">",
		"<title>OWASP ZAP — rapport expurgé · Site Alban</title>",
		"<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:4vh auto;padding:0 20px;color:#182333;line-height:1.55}table{width:100%;border-collapse:collapse}td,th{padding:12px;border-bottom:1px solid #ccd3db;text-align:left}strong{font-size:3rem;color:#146c43}.notice{border:1px solid #c7d2de;padding:16px;border-radius:6px;margin-top:25px}</style>",
		"</head><body><h1>OWASP ZAP · Rapport expurgé</h1>",
		"<p>Production · baseline passive · Site Alban</p><p><strong>" +
			data.highCount +
			"</strong> identifiant(s) HIGH conservé(s)</p>",
		"<table><thead><tr><th>Origine publique</th><th>IDs HIGH</th></tr></thead><tbody>",
		rows,
		"</tbody></table>",
		'<section class="notice"><h2>Limites de preuve</h2>',
		"<p>Seuls les IDs HIGH et les origines publiques autorisées figurent dans ce rapport. WARN/LOW, URL détaillées, requêtes, réponses, cookies et preuves sont exclus.</p>",
		"<p>Zéro HIGH conservé ne prouve pas l'absence de vulnérabilités.</p></section>",
		"</body></html>\n",
	].join("\n");
	const summary = [
		"### Rapport OWASP ZAP expurgé",
		"",
		"- Identifiants HIGH conservés : **" + data.highCount + "**",
		"- Origines publiques incluses : " + data.sites.length,
		"- HTML / SARIF / JSON sont disponibles dans l'artefact du run.",
		"- WARN/LOW, chemins et preuves HTTP exclus ; zéro HIGH ne signifie pas zéro vulnérabilité.",
		"",
	].join("\n");
	return { html, sarif: JSON.stringify(sarif, null, 2) + "\n", summary };
}

function main() {
	if (process.argv.length !== 4) throw new Error("expected input and output");
	const [input, outputDir] = process.argv.slice(2);
	if (
		!statSync(input).isFile() ||
		statSync(input).size > INPUT_LIMIT ||
		!statSync(outputDir).isDirectory()
	)
		throw new Error("unsafe file");
	const output = renderMinimizedZap(JSON.parse(readFileSync(input, "utf8")));
	for (const [name, content] of [
		["report.html", output.html],
		["report.sarif", output.sarif],
		["summary.md", output.summary],
	]) {
		writeFileSync(join(outputDir, name), content, { mode: 0o600, flag: "wx" });
	}
	process.stdout.write("PASS: sanitized ZAP HTML/SARIF artifacts generated\n");
}
if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	try {
		main();
	} catch {
		process.stderr.write(
			"FAIL: sanitized ZAP report validation (private input withheld)\n",
		);
		process.exitCode = 1;
	}
}
