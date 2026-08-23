import { expect, test } from "@playwright/test";

const expectedSitemapUrls = [
	"https://albanandrieu.com/",
	"https://albanandrieu.com/expertise",
	"https://albanandrieu.com/contact",
	"https://albanandrieu.com/security",
	"https://albanandrieu.com/ai",
	"https://albanandrieu.com/ciso",
	"https://albanandrieu.com/truenas",
	"https://albanandrieu.com/link",
	"https://albanandrieu.com/email",
	"https://albanandrieu.com/nabla",
	"https://albanandrieu.com/cv",
	"https://albanandrieu.com/jm",
];

const migratedSeoSlugs = [
	"expertise",
	"contact",
	"security",
	"ai",
	"ciso",
	"truenas",
	"link",
	"email",
	"nabla",
] as const;

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
	...migratedSeoSlugs.map((slug) => `/${slug}`),
	"/cv",
	"/jm",
];

test.describe("SEO indexing policy", () => {
	test("sitemap exposes only extensionless canonical SEO URLs", async ({
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
		expect(xml).not.toContain(".html");
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

	test("explicit SEO pages remain indexable on clean URLs", async ({ request }) => {
		for (const pathname of indexablePages) {
			const response = await request.get(pathname);
			expect(response.ok(), `${pathname} should load`).toBeTruthy();
			expect(await response.text(), `${pathname} should be indexable`).not.toContain(
				'<meta name="robots" content="noindex, nofollow"/>',
			);
		}
	});

	test("migrated html SEO URLs permanently redirect to clean routes", async ({
		request,
	}) => {
		for (const slug of migratedSeoSlugs) {
			for (const [oldPath, destination] of [
				[`/${slug}.html`, `/${slug}`],
				[`/en/${slug}.html`, `/${slug}`],
				[`/fr/${slug}.html`, `/fr/${slug}`],
			] as const) {
				const response = await request.get(oldPath, { maxRedirects: 0 });
				expect([301, 308], `${oldPath} should permanently redirect`).toContain(
					response.status(),
				);
				expect(response.headers().location).toBe(destination);
			}
		}
	});

	test("priority pages expose their structured data", async ({ request }) => {
		const cases = [
			["/", "Person"],
			["/expertise", "ProfessionalService"],
		] as const;

		for (const [pathname, expectedType] of cases) {
			const response = await request.get(pathname);
			expect(response.ok(), `${pathname} should load`).toBeTruthy();
			const html = await response.text();
			const jsonLd = html.match(
				/<script type="application\/ld\+json">([^<]+)<\/script>/,
			)?.[1];

			expect(jsonLd, `${pathname} should expose JSON-LD`).toBeTruthy();
			expect(JSON.parse(jsonLd ?? "{}")["@type"]).toBe(expectedType);
		}
	});
});
