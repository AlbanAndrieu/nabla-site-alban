import { expect, test } from "@playwright/test";

const expectedSitemapUrls = [
	"https://albanandrieu.com/",
	"https://albanandrieu.com/expertise.html",
	"https://albanandrieu.com/contact.html",
	"https://albanandrieu.com/security.html",
	"https://albanandrieu.com/ai.html",
	"https://albanandrieu.com/ciso.html",
	"https://albanandrieu.com/truenas.html",
	"https://albanandrieu.com/link.html",
	"https://albanandrieu.com/email.html",
	"https://albanandrieu.com/nabla.html",
	"https://albanandrieu.com/cv",
	"https://albanandrieu.com/jm",
];

const nonIndexablePages = [
	"/ctid.html",
	"/freenas.html",
	"/workstation.html",
	"/jm/4-years-review-aandrieu",
	"/startup.html",
	"/startup-thanks.html",
	"/pricing.html",
	"/payment.html",
	"/success.html",
	"/cancel.html",
	"/checkout",
	"/checkout-tjm",
	"/login.html",
	"/test.html",
];

const indexablePages = [
	"/",
	"/expertise.html",
	"/contact.html",
	"/security.html",
	"/ai.html",
	"/ciso.html",
	"/truenas.html",
	"/link.html",
	"/email.html",
	"/nabla.html",
	"/cv",
	"/cv/index.html",
	"/jm",
];

test.describe("SEO indexing policy", () => {
	test("sitemap exposes only the explicit SEO allowlist", async ({
		request,
	}) => {
		const response = await request.get("/sitemap.xml");
		expect(response.ok()).toBeTruthy();

		const xml = await response.text();
		const urls = Array.from(
			xml.matchAll(/<loc>([^<]+)<\/loc>/g),
			([, url]) => url,
		);

		expect(urls).toEqual(expectedSitemapUrls);
		expect(xml).not.toContain("/startup");
		expect(xml).not.toContain("/pricing");
		expect(xml).not.toContain("/payment");
	});

	test("every page outside the SEO allowlist is noindex", async ({ request }) => {
		for (const pathname of nonIndexablePages) {
			const response = await request.get(pathname);
			expect(response.ok(), `${pathname} should load`).toBeTruthy();
			expect(await response.text(), `${pathname} should be noindex`).toContain(
				'<meta name="robots" content="noindex, nofollow"/>',
			);
		}
	});

	test("explicit SEO pages remain indexable", async ({ request }) => {
		for (const pathname of indexablePages) {
			const response = await request.get(pathname);
			expect(response.ok(), `${pathname} should load`).toBeTruthy();
			expect(await response.text(), `${pathname} should be indexable`).not.toContain(
				'<meta name="robots" content="noindex, nofollow"/>',
			);
		}
	});
});
