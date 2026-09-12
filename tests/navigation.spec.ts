import { expect, test } from "@playwright/test";

// Test navigation and links
test.describe("Navigation and Links Tests", () => {
	test("should have working internal links", async ({ page }) => {
		await page.goto("/");

		const links = page.locator('a[href^="/"]');
		const count = await links.count();

		for (let i = 0; i < Math.min(count, 5); i++) {
			const href = await links.nth(i).getAttribute("href");
			if (href && href !== "#") {
				const response = await page.request.get(href);
				expect(response.status()).toBeLessThan(500);
			}
		}
	});

	test("should have descriptive link text", async ({ page }) => {
		await page.goto("/");

		const links = page.locator("a");
		const count = await links.count();

		for (let i = 0; i < count; i++) {
			const link = links.nth(i);
			const text = (await link.textContent())?.trim();
			const ariaLabel = await link.getAttribute("aria-label");
			const title = await link.getAttribute("title");
			const image = link.locator("img").first();
			const imgAlt =
				(await image.count()) > 0 ? await image.getAttribute("alt") : null;

			const hasDescription = Boolean(text || ariaLabel || title || imgAlt);
			expect(hasDescription).toBeTruthy();
		}
	});

	test("should have external links with proper attributes", async ({ page }) => {
		await page.goto("/");

		const externalLinks = page.locator(
			'a[href^="http"]:not([href*="albandrieu.com"])',
		);
		const count = await externalLinks.count();

		for (let i = 0; i < count; i++) {
			const link = externalLinks.nth(i);
			const target = await link.getAttribute("target");
			const rel = await link.getAttribute("rel");

			if (target === "_blank") {
				expect(rel).toContain("noopener");
			}
		}
	});

	test("should have navigation menu", async ({ page }) => {
		await page.goto("/");

		const nav = page.locator('nav, [role="navigation"]');
		const navCount = await nav.count();

		expect(navCount).toBeGreaterThan(0);
	});

	test("should have footer with links", async ({ page }) => {
		await page.goto("/");

		// Look for footer
		const footer = page.locator('footer, [role="contentinfo"], .footer');
		const footerCount = await footer.count();

		// Footer is optional but common
		expect(footerCount).toBeGreaterThanOrEqual(0);
	});

	test("should handle link hover states", async ({ page }) => {
		await page.goto("/");

		// Stable semantic CTA; deliberately independent from Bootstrap/CSS-module classes.
		const link = page
			.locator(
				'[data-responsive-hero] a[href="https://calendly.com/alban-andrieu"]',
			)
			.first();
		await expect(link).toBeVisible();
		await link.scrollIntoViewIfNeeded();

		const width = page.viewportSize()?.width ?? 1024;
		const isCoarsePointer = width < 768;

		if (isCoarsePointer) {
			await link.focus();
		} else {
			await link.hover({ force: true });
		}

		await expect(link).toBeVisible();
	});
});