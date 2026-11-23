import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const login = readFileSync(
	path.join(process.cwd(), "app/[locale]/login/LoginClient.tsx"),
	"utf8",
);

test("login demo links to the approved honeypot with a fixed HTTPS GET", () => {
	assert.match(login, /href="https:\/\/login\.albandrieu\.com\/login"/);
	assert.match(login, /rel="nofollow noreferrer"/);
	assert.match(login, /<a[\s\S]+?Ouvrir la simulation de connexion/);
});

test("no credentials or Turnstile tokens are ever submitted to the honeypot", () => {
	assert.doesNotMatch(login, /<form\b/i);
	assert.doesNotMatch(login, /action="\/handler"/);
	assert.doesNotMatch(login, /window\.location|fetch\("https:\/\/login\./);
	assert.match(login, /Ne saisissez\s+aucun identifiant réel/);
	assert.match(login, /readOnly/);
});
