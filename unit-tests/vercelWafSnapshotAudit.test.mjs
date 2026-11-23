import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { auditVercelWafSnapshot } from "../scripts/security/vercel-waf-snapshot-audit.mjs";

const script = new URL(
	"../scripts/security/vercel-waf-snapshot-audit.mjs",
	import.meta.url,
);
const hosts = ["www.albanandrieu.com", "albanandrieu.com"];

function desiredRule() {
	return {
		active: true,
		action: {
			action: "rate_limit",
			rate_limit: {
				limit: 300,
				window: 60,
				keys: ["ip"],
				algo: "fixed_window",
				action: "deny",
			},
			action_duration: "1m",
		},
		condition_group: hosts.map((host) => ({
			conditions: [{ type: "host", op: "eq", value: host }],
		})),
	};
}

function snapshot(action = "log", rules = []) {
	return {
		result: {
			firewallEnabled: true,
			managedRules: { bot_protection: { active: true, action: "challenge" } },
			crs: Object.fromEntries(
				["gen", "sqli", "xss", "rce"].map((name) => [
					name,
					{ active: true, action: name === "gen" ? "log" : action },
				]),
			),
			rules,
			ips: [],
		},
	};
}

test("active WAF in log mode is not misreported as blocking", () => {
	const report = auditVercelWafSnapshot(snapshot());
	assert.equal(report.status, "LOG_ONLY_NOT_ENFORCED");
	assert.equal(report.checks.firewall, true);
	assert.equal(report.checks.botChallenge, true);
	for (const name of ["sqliDeny", "xssDeny", "rceDeny", "rateLimit"]) {
		assert.equal(report.checks[name], false);
	}
});

test("deny alone is insufficient until the public rate limit is verified", () => {
	assert.equal(auditVercelWafSnapshot(snapshot("deny")).status, "NOT_VERIFIED");
});

test("only the exact desired rules and two public hosts pass", () => {
	assert.equal(
		auditVercelWafSnapshot(snapshot("deny", [desiredRule()])).status,
		"ENFORCED",
	);
	const extra = desiredRule();
	extra.condition_group.push({
		conditions: [{ type: "host", op: "eq", value: "preview.vercel.app" }],
	});
	assert.equal(
		auditVercelWafSnapshot(snapshot("deny", [extra])).checks.rateLimit,
		false,
	);
	const duplicate = snapshot("deny", [desiredRule(), desiredRule()]);
	assert.equal(auditVercelWafSnapshot(duplicate).checks.rateLimit, false);
});

test("changes to bot protection, generic detection, or limits fail closed", () => {
	for (const change of [
		(s) => {
			s.result.managedRules.bot_protection.action = "log";
		},
		(s) => {
			s.result.crs.gen.active = false;
		},
		(s) => {
			s.result.rules[0].action.rate_limit.limit = 600;
		},
		(s) => {
			s.result.rules[0].action.rate_limit.action = "log";
		},
		(s) => {
			s.result.rules[0].active = false;
		},
	]) {
		const s = snapshot("deny", [desiredRule()]);
		change(s);
		assert.notEqual(auditVercelWafSnapshot(s).status, "ENFORCED");
	}
});

test("malformed or partial responses never pass", () => {
	for (const payload of [
		null,
		{},
		{ result: {} },
		{ result: { firewallEnabled: true, managedRules: {}, crs: {}, rules: {} } },
	]) {
		assert.throws(
			() => auditVercelWafSnapshot(payload),
			/WAF_SNAPSHOT_INVALID/,
		);
	}
});

test("CLI is read-only, redacts snapshot fields and enforces distinct exit codes", () => {
	const dir = mkdtempSync(join(tmpdir(), "waf-snapshot-"));
	try {
		const path = join(dir, "waf.json");
		const raw = snapshot();
		raw.result.internalSecret = "DO_NOT_PRINT";
		writeFileSync(path, JSON.stringify(raw), { mode: 0o600 });
		const inv = spawnSync(
			process.execPath,
			[script.pathname, "inventory", path],
			{
				encoding: "utf8",
			},
		);
		const strict = spawnSync(
			process.execPath,
			[script.pathname, "enforce", path],
			{
				encoding: "utf8",
			},
		);
		assert.equal(inv.status, 0);
		assert.equal(strict.status, 2);
		assert.match(inv.stdout, /WAF_POSTURE=LOG_ONLY_NOT_ENFORCED/);
		assert.match(inv.stdout, /WAF_INVENTORY_ONLY=NOT_A_SECURITY_GATE/);
		assert.doesNotMatch(
			inv.stdout + inv.stderr + strict.stdout + strict.stderr,
			/DO_NOT_PRINT/,
		);
	} finally {
		rmSync(dir, { force: true, recursive: true });
	}
});
