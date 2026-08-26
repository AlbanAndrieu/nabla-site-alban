import { expect, request as playwrightRequest, test } from "@playwright/test";

const expectedSitemapUrls = [
	"https://albanandrieu.com/",
	"https://albanandrieu.com/expertise",
	"https://albanandrieu.com/contact",
	"https://albanandrieu.com/security",
	"https://albanandrieu.com/ai",
	"https://albanandrieu.com/architecture",
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
	"/architecture",
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

	test("migrated pages expose self-canonical and reciprocal extensionless hreflang", async ({
		page,
	}) => {
		for (const slug of migratedSeoSlugs) {
			const englishUrl = `https://albanandrieu.com/${slug}`;
			const frenchUrl = `https://albanandrieu.com/fr/${slug}`;

			for (const [pathname, canonical] of [
				[`/${slug}`, englishUrl],
				[`/fr/${slug}`, frenchUrl],
			] as const) {
				// next-intl persists the last explicit locale in NEXT_LOCALE. Clear it
				// before checking the unprefixed English canonical so a previous /fr/*
				// navigation cannot redirect the next assertion to the French route.
				if (pathname === `/${slug}`) {
					await page.context().clearCookies({ name: "NEXT_LOCALE" });
				}

				await page.goto(pathname);
				await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
					"href",
					canonical,
				);
				await expect(
					page.locator('link[rel="alternate"][hreflang="en"]'),
				).toHaveAttribute("href", englishUrl);
				await expect(
					page.locator('link[rel="alternate"][hreflang="fr"]'),
				).toHaveAttribute("href", frenchUrl);
			}
		}
	});

	test("migrated html SEO URLs permanently redirect to clean routes", async ({}, testInfo) => {
		const baseURL = testInfo.project.use.baseURL;
		expect(typeof baseURL).toBe("string");

		const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
		const extraHTTPHeaders: Record<string, string> | undefined = bypassSecret
			? { "x-vercel-protection-bypass": bypassSecret }
			: undefined;

		const redirectRequest = await playwrightRequest.newContext({
			baseURL: String(baseURL),
			...(extraHTTPHeaders ? { extraHTTPHeaders } : {}),
		});

		try {
			for (const slug of migratedSeoSlugs) {
				for (const [oldPath, destination] of [
					[`/${slug}.html`, `/${slug}`],
					[`/en/${slug}.html`, `/${slug}`],
					[`/fr/${slug}.html`, `/fr/${slug}`],
				] as const) {
					const response = await redirectRequest.get(oldPath, { maxRedirects: 0 });
					expect([301, 308], `${oldPath} should permanently redirect`).toContain(
						response.status(),
					);
					expect(response.headers().location).toBe(destination);
				}
			}
		} finally {
			await redirectRequest.dispose();
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
