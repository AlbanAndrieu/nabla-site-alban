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
];

test.describe("SEO indexing policy", () => {
	test("sitemap exposes only the explicit SEO allowlist", async ({ request }) => {
		const response = await request.get("/sitemap.xml");
		expect(response.ok()).toBeTruthy();

		const xml = await response.text();
		const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), ([, url]) => url);

		expect(urls).toEqual(expectedSitemapUrls);
		expect(xml).not.toContain("/startup");
		expect(xml).not.toContain("/pricing");
		expect(xml).not.toContain("/payment");
		expect(xml).not.toContain("/cv");
		expect(xml).not.toContain("/jm");
	});

	test("technical pages are noindex", async ({ page }) => {
		await page.goto("/startup.html");
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"noindex, nofollow",
		);
	});

	test("non-indexed showcase pages stay outside search results", async ({ page }) => {
		await page.goto("/workstation.html");
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			"content",
			"noindex, nofollow",
		);
	});

	test("SEO showcase pages remain indexable", async ({ page }) => {
		await page.goto("/truenas.html");
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
	});
});
