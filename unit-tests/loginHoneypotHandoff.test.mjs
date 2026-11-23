import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const login = readFileSync(
	path.join(process.cwd(), "app/[locale]/login/LoginClient.tsx"),
	"utf8",
);
const form = login.match(/<form\b[\s\S]*?<\/form>/)?.[0] ?? "";

test("login form posts directly to the HTTPS honeypot, never to this site", () => {
	assert.match(form, /method="post"/);
	assert.match(form, /action="https:\/\/login\.albandrieu\.com\/login"/);
	assert.equal(login.match(/<form\b/g)?.length, 1);
	assert.doesNotMatch(login, /action="\/handler"/);
	// No proxy: the site itself must never receive or forward what bots type.
	assert.doesNotMatch(login, /fetch\("https:\/\/login\.|window\.location/);
});

test("trap fields are fillable behind the Turnstile challenge", () => {
	assert.match(form, /name="username"/);
	assert.match(form, /name="password"/);
	assert.doesNotMatch(form, /readOnly/);
	assert.match(form, /className="cf-turnstile"/);
	assert.match(form, /type="submit"/);
});
