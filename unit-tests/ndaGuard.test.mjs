import assert from "node:assert/strict";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	formatFindings,
	hashTerm,
	lineFingerprint,
	loadConfig,
	readPrivateLists,
	scanRepository,
	scanText,
} from "../scripts/security/nda-guard.mjs";

// Behaviour tests use the public list only; the tree scan adds private lists.
const publicConfig = loadConfig(undefined, []);
const config = loadConfig();
// Built by concatenation so this file never contains the literal it detects.
const sharepointUrl = `https://acme.share${"point"}.com/sites/team`;
const employer = `Fina${"stra"}`;
const secret = `acme${"corp"}`;

function fixture(patterns, allow = [], privateLists = []) {
	return loadConfig(
		JSON.stringify({ roots: ["app"], patterns, allow }),
		privateLists,
	);
}

function withTemporaryHome(files, run) {
	const home = mkdtempSync(join(tmpdir(), "nda-home-"));
	const previous = process.env.HOME;
	try {
		for (const [name, text] of Object.entries(files)) {
			if (text === null) mkdirSync(join(home, name));
			else writeFileSync(join(home, name), text);
		}
		process.env.HOME = home;
		return run();
	} finally {
		process.env.HOME = previous;
		rmSync(home, { recursive: true, force: true });
	}
}

test("detects a pattern and reports only file, line and pattern id", () => {
	const findings = scanText(
		"app/page.tsx",
		`ok\nsee ${sharepointUrl}\n`,
		publicConfig,
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
	const env = {
		source: "env",
		text: `# private list\n\n${secret}|x${"yz"}q\n`,
	};
	const guard = fixture([], [], [env]);
	assert.equal(guard.privateCount, 1);
	const findings = scanText("app/a.ts", "hello ACMECORP", guard);
	assert.deepEqual(findings, [
		{ file: "app/a.ts", line: 1, pattern: "env:private-3" },
	]);
	assert.doesNotMatch(formatFindings(findings), /acme/i);
	assert.throws(
		() => fixture([], [], [{ source: "home", text: `${secret}(` }]),
		(error) =>
			/NDA_GUARD_CONFIG_INVALID: home:private-1$/.test(error.message) &&
			!error.message.includes(secret),
	);
	const allow = { paths: ["app/"], scope: "personal", reason: "r" };
	assert.throws(
		() => fixture([], [{ ...allow, patterns: ["env:private-3"] }], [env]),
		/unknown env:private-3/,
	);
	assert.equal(
		fixture([], [], [{ source: "env", text: "# none" }]).privateCount,
		null,
	);
});

test("private keywords stay silent only on text a public allow entry approved", () => {
	const guard = fixture(
		[{ id: "employer-x", regex: "exa ?corp" }],
		[
			{
				patterns: ["employer-x"],
				paths: ["public/cv/"],
				scope: "public-mention",
				reason: "r",
			},
		],
		[{ source: "home", text: `exa${"corp"}\n${secret}` }],
	);
	const ids = (file, text) => scanText(file, text, guard).map((f) => f.pattern);
	assert.deepEqual(ids("public/cv/a.html", "Worked at ExaCorp"), []);
	assert.deepEqual(ids("public/cv/a.html", "ExaCorp for AcmeCorp"), [
		"home:private-2",
	]);
	assert.deepEqual(ids("app/a.ts", "ExaCorp"), [
		"employer-x",
		"home:private-1",
	]);
});

test("a reviewed line fingerprint silences private findings on that exact line only", () => {
	const line = "We shipped AcmeCorp here";
	const reviewed = (entry) =>
		loadConfig(
			JSON.stringify({
				roots: ["public"],
				patterns: [{ id: "public-x", regex: "shipped" }],
				reviewed: [entry],
			}),
			[{ source: "home", text: secret }],
		);
	const guard = reviewed({
		path: "public/jm/a.html",
		sha256: lineFingerprint(line),
		reason: "owner-reviewed",
	});
	const ids = (file, text) => scanText(file, text, guard).map((f) => f.pattern);
	assert.deepEqual(ids("public/jm/a.html", line), ["public-x"]);
	assert.deepEqual(ids("public/jm/a.html", `${line}!`), [
		"public-x",
		"home:private-1",
	]);
	assert.deepEqual(ids("public/jm/b.html", line), [
		"public-x",
		"home:private-1",
	]);
	assert.throws(
		() => reviewed({ path: "public/jm/a.html", sha256: lineFingerprint(line) }),
		/reviewed\[0\] needs path, sha256 and reason/,
	);
});

test("every reviewed fingerprint still matches a published line", () => {
	const raw = JSON.parse(
		readFileSync(
			new URL("../scripts/security/nda-guard.json", import.meta.url),
		),
	);
	for (const entry of raw.reviewed ?? []) {
		const lines = readFileSync(
			new URL(`../${entry.path}`, import.meta.url),
			"utf8",
		)
			.split("\n")
			.map(lineFingerprint);
		assert.ok(lines.includes(entry.sha256), `stale review: ${entry.path}`);
	}
});

test("merges NDA_KEYWORDS and ~/.nda-keywords.local instead of masking one", () => {
	withTemporaryHome({ ".nda-keywords.local": `# home\n${secret}\n` }, () => {
		const lists = readPrivateLists({ NDA_KEYWORDS: `x${"yz"}q` });
		assert.deepEqual(
			lists.map((list) => list.source),
			["env", "home"],
		);
		const guard = fixture([], [], lists);
		assert.deepEqual(guard.privateSources, ["env", "home"]);
		assert.deepEqual(
			scanText("app/a.ts", "XYZQ and AcmeCorp", guard).map((f) => f.pattern),
			["env:private-1", "home:private-2"],
		);
	});
	withTemporaryHome({}, () => {
		assert.deepEqual(readPrivateLists({}), []);
	});
});

test("an unreadable private list fails closed without echoing its content", () => {
	withTemporaryHome({ ".nda-keywords.local": null }, () => {
		assert.throws(
			() => readPrivateLists({}),
			/NDA_GUARD_CONFIG_INVALID: home private list unreadable$/,
		);
	});
});

test(config.privateCount === null
	? "NDA_PRIVATE_LIST_NOT_RUN: no NDA_KEYWORDS, ./ or ~/.nda-keywords.local"
	: `private keyword list loaded (${config.privateCount} patterns)`, {
	skip: config.privateCount === null && "NDA_PRIVATE_LIST_NOT_RUN",
}, () => {
	assert.ok(config.privateCount > 0, "private list has no active pattern");
});

test("allowlisted CV mention passes while the same mention elsewhere fails", () => {
	assert.deepEqual(
		scanText("public/cv/cv-full-en.html", employer, publicConfig),
		[],
	);
	assert.deepEqual(scanText("app/[locale]/page.tsx", employer, publicConfig), [
		{ file: "app/[locale]/page.tsx", line: 1, pattern: "employer-finastra" },
	]);
});

test("line-scoped allow entries do not cover other values in the same file", () => {
	const file = "app/[locale]/nabla/page.tsx";
	const personal = `https://app.notion${".com"}/p/albandrieu/Page-1`;
	const other = `https://app.notion${".so"}/team/Page-2`;
	assert.deepEqual(scanText(file, personal, publicConfig), []);
	assert.equal(scanText(file, other, publicConfig)[0]?.pattern, "notion-url");
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
