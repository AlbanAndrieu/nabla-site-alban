import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageOwnedSkipPaths = [
	"../app/[locale]/page.tsx",
	"../app/[locale]/ai/page.tsx",
	"../app/[locale]/architecture/page.tsx",
	"../app/[locale]/checkout-tjm/page.tsx",
	"../app/[locale]/ciso/page.tsx",
	"../app/[locale]/contact/page.tsx",
	"../app/[locale]/cv/[...path]/page.tsx",
	"../app/[locale]/email/page.tsx",
	"../app/[locale]/expertise/page.tsx",
	"../app/[locale]/freenas/page.tsx",
	"../app/[locale]/link/page.tsx",
	"../app/[locale]/login/page.tsx",
	"../app/[locale]/nabla/page.tsx",
	"../app/[locale]/policy/page.tsx",
	"../app/[locale]/policy/[policy]/page.tsx",
	"../app/[locale]/pricing/page.tsx",
	"../app/[locale]/security/page.tsx",
	"../app/[locale]/startup/page.tsx",
	"../app/[locale]/startup-thanks/page.tsx",
	"../app/[locale]/test/page.tsx",
	"../app/[locale]/truenas/page.tsx",
	"../app/[locale]/workstation/page.tsx",
	"../components/payments/PaymentShell.tsx",
] as const;

test("locale layout owns the shared skip link before route navigation", async () => {
	const layout = await readFile(
		new URL("../app/[locale]/layout.tsx", import.meta.url),
		"utf8",
	);

	assert.match(
		layout,
		/import SkipToMainContent from "@\/components\/SkipToMainContent";/,
	);
	const skipIndex = layout.indexOf("<SkipToMainContent />");
	const headerIndex = layout.indexOf("<RouteHeader />");
	assert.ok(skipIndex >= 0, "layout must render the shared skip link");
	assert.ok(headerIndex >= 0, "layout must render the route header");
	assert.ok(
		skipIndex < headerIndex,
		"skip link must precede shared navigation in keyboard order",
	);
});

for (const route of pageOwnedSkipPaths) {
	test(`${route} delegates skip navigation to the locale layout`, async () => {
		const source = await readFile(new URL(route, import.meta.url), "utf8");

		assert.doesNotMatch(source, /SkipToMainContent/);
		assert.doesNotMatch(source, /className="skip-to-main"/);
		assert.doesNotMatch(source, /className="skip-link"/);
	});
}

test("Jus Mundi delegates skip navigation to the locale layout", async () => {
	const source = await readFile(
		new URL("../app/[locale]/jm/page.tsx", import.meta.url),
		"utf8",
	);
	assert.doesNotMatch(source, /className="skip-link"/);
});
