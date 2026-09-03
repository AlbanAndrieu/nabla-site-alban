import { expect, request as playwrightRequest, test } from "@playwright/test";

const canonicalOrigin = "https://www.albanandrieu.com";

const policySlugs = [
	"accessibility_statement",
	"cookie_policy",
	"impressum",
	"legal",
	"privacy_policy",
	"service_terms",
] as const;

const expectedSitemapUrls = [
	`${canonicalOrigin}/`,
	`${canonicalOrigin}/expertise`,
	`${canonicalOrigin}/contact`,
	`${canonicalOrigin}/security`,
	`${canonicalOrigin}/ai`,
	`${canonicalOrigin}/architecture`,
	`${canonicalOrigin}/ciso`,
	`${canonicalOrigin}/truenas`,
	`${canonicalOrigin}/link`,
	`${canonicalOrigin}/email`,
	`${canonicalOrigin}/nabla`,
	`${canonicalOrigin}/cv`,
	`${canonicalOrigin}/jm`,
	...policySlugs.map((slug) => `${canonicalOrigin}/policy/${slug}`),
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
	...policySlugs.map((slug) => `/policy/${slug}`),
];

test.describe("SEO indexing policy", () => {
	test("sitemap exposes only extensionless canonical SEO URLs", async ({ request }) => {
		const response = await request.get("/sitemap.xml");
		expect(response.ok()).toBeTruthy();
		const xml = await response.text();
		const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), ([, url]) => url);
		expect(urls).toEqual(expectedSitemapUrls);
		expect(xml).not.toContain(".html");
		expect(xml).not.toContain("/startup");
		expect(xml).not.toContain("/pricing");
	});

	test("every page outside the SEO allowlist is noindex", async ({ request }) => {
		for (const pathname of nonIndexablePages) {
			const response = await request.get(pathname);
			expect(response.ok(), `${pathname} should load`).toBeTruthy();
			expect(await response.text(), `${pathname} should be noindex`).toContain('<meta name="robots" content="noindex, nofollow"/>');
		}
	});

	test("explicit SEO pages remain indexable on clean URLs", async ({ request }) => {
		for (const pathname of indexablePages) {
			const response = await request.get(pathname);
			expect(response.ok(), `${pathname} should load`).toBeTruthy();
			expect(await response.text(), `${pathname} should be indexable`).not.toContain('<meta name="robots" content="noindex, nofollow"/>');
		}
	});

	test("migrated pages expose self-canonical and reciprocal extensionless hreflang", async ({ page }) => {
		for (const slug of migratedSeoSlugs) {
			const englishUrl = `${canonicalOrigin}/${slug}`;
			const frenchUrl = `${canonicalOrigin}/fr/${slug}`;
			for (const [pathname, canonical] of [[`/${slug}`, englishUrl], [`/fr/${slug}`, frenchUrl]] as const) {
				if (pathname === `/${slug}`) await page.context().clearCookies({ name: "NEXT_LOCALE" });
				await page.goto(pathname);
				await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
				await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", englishUrl);
				await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute("href", frenchUrl);
			}
		}
	});

	test("policy pages expose localized canonicals and hreflang", async ({ page }) => {
		for (const slug of policySlugs) {
			const englishUrl = `${canonicalOrigin}/policy/${slug}`;
			const frenchUrl = `${canonicalOrigin}/fr/policy/${slug}`;
			for (const [pathname, canonical] of [[`/policy/${slug}`, englishUrl], [`/fr/policy/${slug}`, frenchUrl]] as const) {
				if (pathname === `/policy/${slug}`) await page.context().clearCookies({ name: "NEXT_LOCALE" });
				await page.goto(pathname);
				await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
				await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", englishUrl);
				await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute("href", frenchUrl);
				await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", englishUrl);
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
		const redirectRequest = await playwrightRequest.newContext({ baseURL: String(baseURL), ...(extraHTTPHeaders ? { extraHTTPHeaders } : {}) });
		try {
			for (const slug of migratedSeoSlugs) {
				for (const [oldPath, destination] of [[`/${slug}.html`, `/${slug}`], [`/en/${slug}.html`, `/${slug}`], [`/fr/${slug}.html`, `/fr/${slug}`]] as const) {
					const response = await redirectRequest.get(oldPath, { maxRedirects: 0 });
					expect([301, 308], `${oldPath} should permanently redirect`).toContain(response.status());
					expect(response.headers().location).toBe(destination);
				}
			}
		} finally {
			await redirectRequest.dispose();
		}
	});

	test("legacy policy html URLs permanently redirect to native routes", async ({}, testInfo) => {
		const baseURL = testInfo.project.use.baseURL;
		expect(typeof baseURL).toBe("string");
		const redirectRequest = await playwrightRequest.newContext({ baseURL: String(baseURL) });
		try {
			for (const slug of policySlugs) {
				for (const [oldPath, destination] of [[`/policy/${slug}.html`, `/policy/${slug}`], [`/en/policy/${slug}.html`, `/policy/${slug}`], [`/fr/policy/${slug}.html`, `/fr/policy/${slug}`]] as const) {
					const response = await redirectRequest.get(oldPath, { maxRedirects: 0 });
					expect([301, 308], `${oldPath} should permanently redirect`).toContain(response.status());
					expect(response.headers().location).toBe(destination);
				}
			}
		} finally {
			await redirectRequest.dispose();
		}
	});

	test("priority pages expose their structured data", async ({ request }) => {
		for (const [pathname, expectedType] of [["/", "Person"], ["/expertise", "ProfessionalService"]] as const) {
			const response = await request.get(pathname);
			expect(response.ok(), `${pathname} should load`).toBeTruthy();
			const html = await response.text();
			const jsonLd = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
			expect(jsonLd, `${pathname} should expose JSON-LD`).toBeTruthy();
			expect(JSON.parse(jsonLd ?? "{}")["@type"]).toBe(expectedType);
		}
	});
});
