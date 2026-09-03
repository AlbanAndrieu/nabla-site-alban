import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("policy parity work preserves Site Alban contact publication surfaces", async () => {
	const contact = await source("app/[locale]/contact/page.tsx");
	for (const expected of [
		"qr_albanandrieu_contact_logo.png",
		"qr-code-linkedin-nabla.jpg",
		"linkedin",
		"twitter",
		"xing",
		"github",
		"docker",
		"stack",
		"facebook",
		"instagram",
		"calendly",
		"slack",
		"discord",
		"rss",
	]) {
		assert.match(contact, new RegExp(expected), expected);
	}
	assert.match(contact, /mailto:job@albandrieu\.com/);
});

test("shared footer retains professional social links and points directly to native legal notices", async () => {
	const footer = await source("app/components/Footer.tsx");
	assert.match(footer, /linkedin\.com\/in\/nabla/);
	assert.match(footer, /github\.com\/AlbanAndrieu/);
	assert.match(footer, /hub\.docker\.com\/u\/nabla/);
	assert.match(footer, /"\/fr\/policy\/legal"/);
	assert.match(footer, /"\/policy\/legal"/);
	assert.doesNotMatch(footer, /policy\/legal\.html/);
});
