/**
 * Read-only acceptance check for an existing Vercel Firewall API snapshot.
 * Never prints request details, rule expressions, credentials or raw JSON.
 * The firewall's desired configuration is owned by nabla-compose.
 * This site never provisions or updates WAF policy.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const desiredHosts = ["albanandrieu.com", "www.albanandrieu.com"];
const attackRules = ["sqli", "xss", "rce"];

function isObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function managedRule(config, name, action) {
	const rule = config?.[name];
	return isObject(rule) && rule.active === true && rule.action === action;
}

function rateLimitRule(rule) {
	if (!isObject(rule) || rule.active !== true) return false;
	const action = rule.action;
	if (!isObject(action) || action.action !== "rate_limit") return false;
	const limit = action.rate_limit;
	if (
		!isObject(limit) || limit.limit !== 300 || limit.window !== 60 ||
		limit.algo !== "fixed_window" || limit.action !== "deny" ||
		!Array.isArray(limit.keys) || limit.keys.length !== 1 || limit.keys[0] !== "ip"
	) return false;
	if (action.action_duration !== "1m") return false;
	const groups = rule.condition_group;
	if (!Array.isArray(groups) || groups.length !== desiredHosts.length) return false;
	const hosts = [];
	for (const group of groups) {
		if (
			!isObject(group) ||
			!Array.isArray(group.conditions) ||
			group.conditions.length !== 1
		) return false;
		const condition = group.conditions[0];
		if (
			!isObject(condition) ||
			condition.type !== "host" ||
			condition.op !== "eq" ||
			typeof condition.value !== "string"
		) return false;
		hosts.push(condition.value);
	}
	return hosts.sort().every((host, index) => host === desiredHosts[index]);
}

export function auditVercelWafSnapshot(payload) {
	if (!isObject(payload)) throw new TypeError("WAF_SNAPSHOT_INVALID");
	const config = Object.hasOwn(payload, "result") ? payload.result : payload;
	if (
		!isObject(config) || typeof config.firewallEnabled !== "boolean" ||
		!isObject(config.managedRules) || !isObject(config.crs) || !Array.isArray(config.rules)
	) throw new TypeError("WAF_SNAPSHOT_INVALID");

	const checks = {
		firewall: config.firewallEnabled === true,
		botChallenge: managedRule(config.managedRules, "bot_protection", "challenge"),
		genericLog: managedRule(config.crs, "gen", "log"),
		sqliDeny: managedRule(config.crs, "sqli", "deny"),
		xssDeny: managedRule(config.crs, "xss", "deny"),
		rceDeny: managedRule(config.crs, "rce", "deny"),
		rateLimit: config.rules.length === 1 && rateLimitRule(config.rules[0]),
	};
	const logOnly = attackRules.every((name) => managedRule(config.crs, name, "log"));
	const ready = Object.values(checks).every(Boolean);
	return {
		status: ready ? "ENFORCED" : logOnly ? "LOG_ONLY_NOT_ENFORCED" : "NOT_VERIFIED",
		checks,
		customRuleCount: config.rules.length,
	};
}

function printSummary(result, mode) {
	// Print only fixed field names and booleans. Never expose rule bodies or hostnames.
	console.log(`WAF_SNAPSHOT_MODE=${mode.toUpperCase()}`);
	for (const [name, passed] of Object.entries(result.checks)) {
		const key = name.replace(/[A-Z]/g, (letter) => "_" + letter).toUpperCase();
		console.log(`WAF_${key}=${passed ? "PASS" : "UNVERIFIED"}`);
	}
	console.log(`WAF_CUSTOM_RULE_COUNT=${result.customRuleCount}`);
	console.log(`WAF_POSTURE=${result.status}`);
	if (mode === "inventory") console.log("WAF_INVENTORY_ONLY=NOT_A_SECURITY_GATE");
}

async function main(args) {
	const mode = args[0];
	if (!["inventory", "enforce"].includes(mode) || args.length !== 2) {
		console.error(
			"Usage: node scripts/security/vercel-waf-snapshot-audit.mjs inventory|enforce /path/to/private-waf-snapshot.json",
		);
		return 1;
	}
	try {
		const raw = await readFile(args[1], "utf8");
		const summary = auditVercelWafSnapshot(JSON.parse(raw));
		printSummary(summary, mode);
		return mode === "enforce" && summary.status !== "ENFORCED" ? 2 : 0;
	} catch {
		console.error("WAF_SNAPSHOT_INVALID_OR_UNREADABLE (snapshot content withheld)");
		return 1;
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	process.exitCode = await main(process.argv.slice(2));
}
