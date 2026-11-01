import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const base = new URL("../app/[locale]/security/yubikey/", import.meta.url);
const manual = readFileSync(new URL("YubiKeyPocketManual.tsx", base), "utf8");
const css = readFileSync(new URL("YubiKeyPocketManual.module.css", base), "utf8");
const page = readFileSync(new URL("page.tsx", base), "utf8");

test("compact bilingual manual appears before the existing accessible graph", () => {
	assert.match(page, /href="#yubikey-manual"/);
	assert.match(page, /<YubiKeyPocketManual locale=\{locale as AppLocale\} \/>/);
	assert.ok(
		page.indexOf("<YubiKeyPocketManual") < page.indexOf("<YubiKeyGraph"),
		"manual must appear before the advanced graph",
	);
	assert.match(manual, /<section id="yubikey-manual"/);
	assert.equal((manual.match(/<details>/g) ?? []).length, 4);
	assert.match(css, /@media \(max-width: 680px\)/);
	assert.match(css, /:focus-visible/);
	assert.match(manual, /ykman openpgp info/);
	assert.match(manual, /inspectTitle/);
});

test("OTP1/OTP2, separate PIV slots, PIN/PUK defaults and reset risks are explained", () => {
	for (const text of [
		"Slot 1 = appui court",
		"Slot 2 = appui long",
		"un appui long seul ne saisit aucun code",
		"Slot 1 = short touch",
		"Slot 2 = long touch",
		"a long touch alone does not type any code",
		"9A",
		"82",
		"123456",
		"12345678",
		"réinsertion après 3 erreurs",
		"reinsert after 3 failures",
		"FIDO2 n’a pas de PUK",
		"FIDO2 has no PUK",
	]) {
		assert.ok(manual.includes(text), "missing "+text);
	}
	assert.equal((manual.match(/12345678/g) ?? []).length, 4);
	assert.equal((manual.match(/123456"/g) ?? []).length, 8);
});

test("public manual links to canonical recovery runbooks without exposing secret materials", () => {
	assert.match(manual, /sops-age-usb-disaster-recovery\.md/);
	assert.match(manual, /yubikey-software-recovery-20261026\.md/);
	assert.match(manual, /~\/\.ssh/);
	assert.match(manual, /~\/\.gnupg/);
	assert.match(manual, /~\/\.config\/sops\/age/);
	assert.doesNotMatch(manual, /(?:23501671|22916048|172\.17\.0\.|10\.254\.255\.)/);
	assert.doesNotMatch(manual, /(?:recovery-identity\.txt|-----BEGIN|OPENAI_API_KEY|otpSecret)/);
	assert.doesNotMatch(manual, /\b(?:\/mnt\/cpool|\/run\/media\/|\/media\/backup\/lab)\b/);
	assert.doesNotMatch(manual, /fetch\(|localStorage|sessionStorage/);
});
