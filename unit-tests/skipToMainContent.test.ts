import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const priorityRoutes = [
	"../app/[locale]/page.tsx",
	"../app/[locale]/ai/page.tsx",
	"../app/[locale]/truenas/page.tsx",
	"../app/[locale]/workstation/page.tsx",
	"../app/[locale]/freenas/page.tsx",
	"../app/[locale]/checkout-tjm/page.tsx",
	"../app/[locale]/cv/[...path]/page.tsx",
	"../app/[locale]/email/page.tsx",
	"../app/[locale]/expertise/page.tsx",
	"../app/[locale]/ciso/page.tsx",
	"../app/[locale]/pricing/page.tsx",
	"../app/[locale]/link/page.tsx",
	"../app/[locale]/test/page.tsx",
	"../components/payments/PaymentShell.tsx",
] as const;

for (const route of priorityRoutes) {
	test(`${route} uses the shared skip-to-main component`, async () => {
		const source = await readFile(new URL(route, import.meta.url), "utf8");

		assert.match(source, /SkipToMainContent/);
		assert.doesNotMatch(
			source,
			/<a href="#main-content" className="skip-to-main">/,
		);
	});
}

test("client-only login remains the documented manual skip-link exception", async () => {
	const source = await readFile(
		new URL("../app/[locale]/login/page.tsx", import.meta.url),
		"utf8",
	);

	assert.match(source, /"use client"/);
	assert.match(source, /className="skip-to-main"/);
});
