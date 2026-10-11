/**
 * Offline Cloudflare security-audit evidence validation.
 * No network access, credentials or external packages required.
 * Usage: node scripts/validate-cloudflare-audit.mjs path/to/evidence.json
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function validateAudit(document, expectedHead) {
	const errors = [];
	if (!document || typeof document !== "object" || Array.isArray(document)) {
		return ["Audit evidence must be a JSON object"];
	}
	const sha = document.headSha;
	if (typeof sha !== "string" || !/^[a-f0-9]{40}$/i.test(sha)) {
		errors.push("headSha must be a full 40-character Git SHA");
	}
	if (expectedHead && sha !== expectedHead) {
		errors.push("headSha differs from the requested HEAD");
	}
	if (
		typeof document.upstreamSha !== "string" ||
		!/^[a-f0-9]{40}$/i.test(document.upstreamSha)
	) {
		errors.push("upstreamSha must pin a full commit SHA");
	}
	if (
		typeof document.upstreamLicense !== "string" ||
		!document.upstreamLicense.trim()
	) {
		errors.push("upstreamLicense is required");
	}
	if (
		typeof document.auditedAt !== "string" ||
		!/^\d{4}-\d{2}-\d{2}T/.test(document.auditedAt) ||
		!Number.isFinite(Date.parse(document.auditedAt))
	) {
		errors.push("auditedAt must be an ISO timestamp");
	}
	if (!Array.isArray(document.controls) || document.controls.length === 0) {
		errors.push("controls must be a non-empty array");
	} else {
		const ids = new Set();
		for (const [index, control] of document.controls.entries()) {
			const at = `controls[${index}]`;
			if (!control || typeof control !== "object" || Array.isArray(control)) {
				errors.push(`${at} must be an object`);
				continue;
			}
			if (typeof control.id !== "string" || !/^[a-z0-9][a-z0-9._-]*$/.test(control.id)) {
				errors.push(`${at}.id invalid`);
			} else if (ids.has(control.id)) {
				errors.push(`${at}.id duplicated`);
			} else {
				ids.add(control.id);
			}
			if (!["pass", "fail", "not-run", "not-applicable"].includes(control.status)) {
				errors.push(`${at}.status invalid`);
			}
			if (typeof control.scope !== "string" || !control.scope.trim()) {
				errors.push(`${at}.scope required`);
			}
			if (control.status === "pass" || control.status === "fail") {
				if (typeof control.evidence !== "string" || !control.evidence.trim()) {
					errors.push(`${at}.evidence required for executed controls`);
				}
			}
			if (control.status === "not-run" &&
				(typeof control.reason !== "string" || !control.reason.trim())) {
				errors.push(`${at}.reason required when not-run`);
			}
			if (control.status === "not-applicable" &&
				(typeof control.reason !== "string" || !control.reason.trim())) {
				errors.push(`${at}.reason required when not-applicable`);
			}
			if (
				control.activityUuid !== undefined &&
				!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(control.activityUuid)
			) {
				errors.push(`${at}.activityUuid invalid`);
			}
		}
	}
	return errors;
}

const invoked = process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname);
if (invoked) {
	const file = process.argv[2];
	if (!file) {
		console.error("Usage: node scripts/validate-cloudflare-audit.mjs <evidence.json> [expected-head-sha]");
		process.exitCode = 2;
	} else {
		try {
			const errors = validateAudit(JSON.parse(readFileSync(file, "utf8")), process.argv[3]);
			if (errors.length) {
				for (const error of errors) console.error(`FAIL: ${error}`);
				process.exitCode = 1;
			} else {
				console.log("OK: evidence schema and SHA provenance valid (not a security audit attestation)");
			}
		} catch (error) {
			console.error(`FAIL: unable to validate evidence: ${error.message}`);
			process.exitCode = 2;
		}
	}
}
