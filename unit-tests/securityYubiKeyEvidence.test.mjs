import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../app/[locale]/security/yubikey/", import.meta.url);
const evidence = readFileSync(new URL("YubiKeyEvidence.tsx", root), "utf8");
const style = readFileSync(new URL("YubiKeyEvidence.module.css", root), "utf8");
const page = readFileSync(new URL("page.tsx", root), "utf8");
const manual = readFileSync(new URL("YubiKeyPocketManual.tsx", root), "utf8");

test("site imports historical evidence before the graph, without live inventory", () => {
	assert.match(page, /import YubiKeyEvidence from "\.\/YubiKeyEvidence";/);
	assert.match(page, /href="#yubikey-evidence"/);
	assert.match(page, /<YubiKeyEvidence locale=\{locale as AppLocale\} \/>/);
	assert.ok(page.indexOf("<YubiKeyEvidence") < page.indexOf("<YubiKeyGraph"));
	assert.match(evidence, /id="yubikey-evidence"/);
	assert.match(evidence, /aria-labelledby="yubikey-evidence-title"/);
	assert.doesNotMatch(
		evidence,
		/fetch\(|localStorage|sessionStorage|useEffect/,
	);
});

test("FR/EN reconcile new evidence instead of declaring all recovery checks complete", () => {
	for (const term of [
		"31 octobre 2026",
		"31 October 2026",
		"Validé sur les deux clés",
		"Verified with both keys",
		"Partiellement validé",
		"Partially verified",
		"Inventaire seulement",
		"Inventory only",
		"À compléter",
		"Incomplete",
		"GO ne garantit pas",
		"GO diagnostic does not prove",
	]) {
		assert.ok(
			evidence.includes(term),
			`Missing source-grounded label: ${term}`,
		);
	}
	assert.match(manual, /ouverture KeePassXC validée/);
	assert.match(manual, /KeePassXC unlock verified/);
	assert.doesNotMatch(
		manual,
		/KeePassXC test deferred|essai KeePassXC différé/,
	);
});

test("new source links remain pinned while dedicated migration PR is unmerged", () => {
	assert.match(evidence, /91898cf4901c28856293fe568f4c6f60be46ed22/);
	assert.match(evidence, /nabla-yubikey\/pull\/1/);
	for (const doc of ["keepassxc.md", "ssh-fido2.md", "inventaire-applets.md"]) {
		assert.ok(evidence.includes(doc), doc);
	}
	assert.match(evidence, /sops-age-usb-disaster-recovery\.md/);
	for (const command of [
		"just dependencies-readonly",
		"just applets-readonly",
		"just ssh-fido2-readonly",
		"just keepassxc-readonly",
	]) {
		assert.ok(evidence.includes(command), command);
	}
	assert.equal(
		(evidence.match(/<details className=\{styles\.details\}>/g) ?? []).length,
		2,
	);
	assert.match(style, /@media \(max-width: 680px\)/);
	assert.match(style, /:focus-visible/);
});

test("public status cards remain anonymous and never imply PIN use or provisioning", () => {
	assert.doesNotMatch(
		evidence,
		/(?:23501671|22916048|172\.17\.0\.|10\.254\.255\.|AGE-SECRET-KEY|-----BEGIN)/,
	);
	assert.doesNotMatch(
		evidence,
		/(?:vaultwarden\/master|\.kdbx|\.key"|\/mnt\/cpool|\/media\/backup\/lab)/,
	);
	assert.doesNotMatch(
		evidence,
		/ykman (?:piv reset|otp chalresp|fido reset)|gpg --card-edit|bw unlock/,
	);
});
