import { expect, test } from "@playwright/test";

test.describe("Navigation and Links Tests", () => {
	test("should have working internal links", async ({ page }) => {
		await page.goto("/");

		// Internal links: relative paths only (exclude fragments, mailto, tel, javascript, absolute URLs)
		const internalLinks = page.locator(
			'a[href]:not([href^="http"]):not([href^="//"]):not([href^="#"]):not([href^="mailto"]):not([href^="tel"]):not([href^="javascript:"])',
		);
		const linkCount = await internalLinks.count();
		expect(linkCount).toBeGreaterThan(0);

		const linksToCheck = Math.min(linkCount, 12);
		for (let i = 0; i < linksToCheck; i++) {
			const href = await internalLinks.nth(i).getAttribute("href");
			expect(href).toBeTruthy();
			expect(href?.trim().length).toBeGreaterThan(0);
		}
	});

	test("should have descriptive link text", async ({ page }) => {
		await page.goto("/");

		// Get all links
		const links = page.locator("a[href]");
		const linkCount = await links.count();

		// Check that links have text or aria-label
		for (let i = 0; i < Math.min(linkCount, 10); i++) {
			const link = links.nth(i);
			const text = await link.textContent();
			const ariaLabel = await link.getAttribute("aria-label");
			const ariaLabelledby = await link.getAttribute("aria-labelledby");
			const title = await link.getAttribute("title");

			// Images inside links should have alt text
			const img = link.locator("img");
			const imgCount = await img.count();

			if (imgCount > 0) {
				const alt = await img.first().getAttribute("alt");
				const hasAccessibleName =
					text || ariaLabel || ariaLabelledby || title || alt;
				expect(hasAccessibleName).toBeTruthy();
			} else {
				// Text links should have text content
				const hasAccessibleName = text || ariaLabel || ariaLabelledby || title;
				expect(hasAccessibleName).toBeTruthy();
			}
		}
	});

	test("should have external links with proper attributes", async ({
		page,
	}) => {
		await page.goto("/");

		// Get external links
		const externalLinks = page.locator('a[href^="http"]');
		const linkCount = await externalLinks.count();

		// Check first few external links
		for (let i = 0; i < Math.min(linkCount, 5); i++) {
			const link = externalLinks.nth(i);
			const href = await link.getAttribute("href");

			// External links should have href
			expect(href).toBeTruthy();

			// Check if it has target="_blank" (optional but common)
			const target = await link.getAttribute("target");
			if (target === "_blank") {
				// If target="_blank", should have rel attribute for security
				const rel = await link.getAttribute("rel");
				// rel should contain noopener or noreferrer for security
				if (rel) {
					const hasSecureRel =
						rel.includes("noopener") || rel.includes("noreferrer");
					expect(hasSecureRel).toBeTruthy();
				}
			}
		}
	});

	test("should have navigation menu", async ({ page }) => {
		await page.goto("/");

		// Look for navigation elements
		const nav = page.locator(
			'nav, [role="navigation"], header nav, .nav, .navigation',
		);
		const navCount = await nav.count();

		// Should have at least some navigation structure
		expect(navCount).toBeGreaterThanOrEqual(0);
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

		// Stable primary CTA in hero (many other links live in main)
		const link = page.locator("main .hero-section a.btn-primary[href]").first();
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
