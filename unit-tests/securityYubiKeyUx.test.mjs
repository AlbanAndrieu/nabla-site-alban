import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../app/[locale]/security/yubikey/", import.meta.url);
const read = (name) => readFileSync(new URL(name, root), "utf8");

test("four bilingual journeys reveal the full table of contents on demand", () => {
	const page = read("page.tsx");
	const styles = read("page.module.css");
	assert.match(page, /className=\{styles\.quickPaths\}/);
	assert.match(page, /Parcours YubiKey/);
	assert.match(page, /YubiKey journeys/);
	assert.match(page, /className=\{styles\.tocDisclosure\}/);
	assert.match(page, /className=\{styles\.glossaryDisclosure\}/);
	assert.match(styles, /\.quickPath:focus-visible/);
	assert.match(styles, /\.glossaryDisclosure summary:focus-visible/);
	assert.match(styles, /@media \(max-width: 480px\)/);
});

test("examples only reveal commands after the reader opens the safety detail", () => {
	const cases = read("YubiKeyUseCases.tsx");
	assert.match(cases, /<details className=\{styles\.caseDetails\}>/);
	const open = cases.indexOf("<details className={styles.caseDetails}>");
	const code = cases.indexOf("<pre");
	const close = cases.indexOf("</details>", open);
	assert.ok(open >= 0 && code > open && close > code);
	assert.match(read("page.module.css"), /\.caseDetails summary/);
});

test("redacted historical results have textual statuses, semantic time and no live probes", () => {
	const evidence = read("YubiKeyEvidence.tsx");
	const styles = read("YubiKeyEvidence.module.css");
	for (const tone of ["verified", "partial", "inventory", "pending"]) {
		assert.match(evidence, new RegExp('tone: "' + tone + '"'));
		assert.match(styles, new RegExp('data-tone="' + tone + '"'));
	}
	assert.match(evidence, /<time dateTime="2026-10-31">/);
	assert.match(evidence, /tabIndex=\{0\}/);
	assert.doesNotMatch(evidence, /fetch\(|localStorage|sessionStorage/);
});

test("planned Vault PKI uses a mobile-readable lifecycle instead of horizontal scrolling", () => {
	const diagram = read("VaultPkiArchitecture.tsx");
	const styles = read("VaultPkiArchitecture.module.css");
	assert.match(diagram, /id="yubikey-vault-pki"/);
	assert.match(diagram, /aria-hidden="true"/);
	assert.match(diagram, /<ol className=\{styles\.flow\}>/);
	assert.match(diagram, /flow\.map/);
	assert.match(diagram, /Architecture cible, non déployée/);
	assert.match(styles, /@media \(max-width: 680px\)/);
	assert.match(styles, /\.diagramFrame\s*\{\s*display:\s*none;/);
	assert.doesNotMatch(diagram, /fetch\(|localStorage|sessionStorage/);
});
