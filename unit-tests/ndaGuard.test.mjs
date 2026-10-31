import assert from "node:assert/strict";
import test from "node:test";
import {
	formatFindings,
	hashTerm,
	loadConfig,
	scanRepository,
	scanText,
} from "../scripts/security/nda-guard.mjs";

const config = loadConfig();
// Built by concatenation so this file never contains the literal it detects.
const sharepointUrl = `https://acme.share${"point"}.com/sites/team`;
const employer = `Fina${"stra"}`;

function fixture(patterns, allow = [], privateList = null) {
	return loadConfig(
		JSON.stringify({ roots: ["app"], patterns, allow }),
		privateList,
	);
}

test("detects a pattern and reports only file, line and pattern id", () => {
	const findings = scanText(
		"app/page.tsx",
		`ok\nsee ${sharepointUrl}\n`,
		config,
	);
	assert.deepEqual(findings, [
		{ file: "app/page.tsx", line: 2, pattern: "sharepoint" },
	]);
	const output = formatFindings(findings);
	assert.equal(output, "NDA_GUARD_FINDING app/page.tsx:2 sharepoint");
	assert.doesNotMatch(output, /acme|sites/);
});

test("matches hashed multi-word terms across case, accents and punctuation", () => {
	const guard = fixture([
		{ id: "fixture", sha256: hashTerm(`Nabla ${"Fixturé"}`), words: 2 },
	]);
	assert.equal(scanText("app/a.ts", "x NABLA-fixture y", guard).length, 1);
	assert.equal(scanText("app/a.ts", "nabla other fixture", guard).length, 0);
});

test("hashed terms with chars also match inside longer tokens", () => {
	const term = `nab${"lix"}`;
	const guard = fixture([
		{ id: "fixture", sha256: hashTerm(term), chars: term.length },
	]);
	assert.equal(scanText("app/a.ts", "use NablixApi now", guard).length, 1);
	assert.equal(scanText("app/a.ts", "nab lix", guard).length, 0);
});

test("private keywords match without echoing the private pattern", () => {
	const secret = `acme${"corp"}`;
	const guard = fixture([], [], `# private list\n\n${secret}|inter${"nal"}x\n`);
	assert.equal(guard.privateCount, 1);
	const findings = scanText("app/a.ts", `hello ACMECORP`, guard);
	assert.deepEqual(findings, [
		{ file: "app/a.ts", line: 1, pattern: "private-3" },
	]);
	assert.doesNotMatch(formatFindings(findings), /acme/i);
	assert.throws(
		() => fixture([], [], `${secret}(`),
		(error) =>
			/NDA_GUARD_CONFIG_INVALID: private-1$/.test(error.message) &&
			!error.message.includes(secret),
	);
	assert.throws(
		() =>
			fixture(
				[],
				[
					{
						patterns: ["private-3"],
						paths: ["app/"],
						scope: "personal",
						reason: "r",
					},
				],
				secret,
			),
		/NDA_GUARD_CONFIG_INVALID/,
	);
});

test(config.privateCount === null
	? "NDA_PRIVATE_LIST_NOT_RUN: no NDA_KEYWORDS or .nda-keywords.local"
	: `private keyword list loaded (${config.privateCount} patterns)`, {
	skip: config.privateCount === null && "NDA_PRIVATE_LIST_NOT_RUN",
}, () => {
	assert.ok(config.privateCount > 0, "private list has no active pattern");
});

test("allowlisted CV mention passes while the same mention elsewhere fails", () => {
	assert.deepEqual(scanText("public/cv/cv-full-en.html", employer, config), []);
	assert.deepEqual(scanText("app/[locale]/page.tsx", employer, config), [
		{ file: "app/[locale]/page.tsx", line: 1, pattern: "employer-finastra" },
	]);
});

test("line-scoped allow entries do not cover other values in the same file", () => {
	const file = "app/[locale]/nabla/page.tsx";
	const personal = `https://app.notion${".com"}/p/albandrieu/Page-1`;
	const other = `https://app.notion${".so"}/team/Page-2`;
	assert.deepEqual(scanText(file, personal, config), []);
	assert.equal(scanText(file, other, config)[0]?.pattern, "notion-url");
});

test("rejects unjustified, unscoped or dangling allow entries", () => {
	const pattern = { id: "p", regex: "x" };
	const entry = { patterns: ["p"], paths: ["app/"], reason: "r" };
	assert.throws(
		() => fixture([pattern], [{ ...entry, reason: " ", scope: "personal" }]),
		/needs patterns, paths and reason/,
	);
	assert.throws(
		() =>
			fixture([pattern], [{ ...entry, patterns: ["q"], scope: "personal" }]),
		/unknown q/,
	);
	assert.throws(() => fixture([pattern], [entry]), /allow\[0\] scope/);
	assert.throws(() => fixture([{ id: "p" }]), /needs regex or sha256/);
});

test("employer data is allowlisted only with a recorded employer approval", () => {
	const pattern = { id: "p", regex: "x" };
	const entry = { patterns: ["p"], paths: ["app/"], reason: "r" };
	const approval = {
		role: "CFO",
		employer: "Example Corp",
		reference: "https://github.com/example/site/pull/1",
	};
	for (const incomplete of [
		undefined,
		{ ...approval, role: "" },
		{ ...approval, employer: undefined },
		{ ...approval, reference: "approved by e-mail" },
	]) {
		assert.throws(
			() =>
				fixture(
					[pattern],
					[{ ...entry, scope: "employer-data", approval: incomplete }],
				),
			/employer-data needs approval/,
		);
	}
	const guard = fixture(
		[pattern],
		[{ ...entry, scope: "employer-data", approval }],
	);
	assert.deepEqual(scanText("app/a.ts", "x", guard), []);
});

test("bounds the report and counts omitted findings", () => {
	const many = Array.from({ length: 50 }, (_, index) => ({
		file: "app/x.ts",
		line: index + 1,
		pattern: "sharepoint",
	}));
	const lines = formatFindings(many).split("\n");
	assert.equal(lines.length, 21);
	assert.equal(lines.at(-1), "NDA_GUARD_FINDINGS_OMITTED 30");
});

test("published content has no NDA pattern outside the allowlist", () => {
	const findings = scanRepository(config);
	assert.deepEqual(findings, [], formatFindings(findings));
});
