import { expect, test } from "@playwright/test";

test.describe("Site widgets integration", () => {
	test("should inject print, back-to-top on homepage", async ({ page }) => {
		await page.goto("/");

		const printButton = page.locator("#nabla-print-pdf-btn");
		await expect(printButton).toBeVisible({ timeout: 15_000 });
		await expect(printButton).toHaveAttribute("aria-label", /print|pdf/i);

		const backToTop = page.locator("#nabla-back-to-top");
		await expect(backToTop).toBeVisible();
		await expect(backToTop).toHaveAttribute("href", "#top");
	});

	test("should trigger top scroll when back-to-top control is clicked", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#nabla-back-to-top").waitFor();
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeGreaterThan(0);

		await page.locator("#nabla-back-to-top").click();
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	});

	test("should scroll to top when back-to-top control has href '#'", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#nabla-back-to-top").waitFor();
		await page.evaluate(() => {
			const button = document.getElementById("nabla-back-to-top");
			if (button) {
				button.setAttribute("href", "#");
			}
			window.scrollTo(0, document.body.scrollHeight);
		});
		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeGreaterThan(0);

		await page.locator("#nabla-back-to-top").click();
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	});

	test("static footer back-to-top uses the shared scroll handler", async ({
		page,
	}) => {
		const pageErrors: string[] = [];
		page.on("pageerror", (error) => pageErrors.push(error.message));

		await page.goto("/checkout.html");
		const footerBackToTop = page.locator('footer a[href="#top"]');
		await expect(footerBackToTop).toBeVisible();

		await page.evaluate(() => {
			document.body.style.minHeight = "300vh";
			window.scrollTo(0, document.body.scrollHeight);
		});
		await expect
			.poll(() =>
				page.evaluate(() =>
					Math.max(
						window.scrollY,
						document.body.scrollTop,
						document.documentElement.scrollTop,
					),
				),
			)
			.toBeGreaterThan(0);

		await footerBackToTop.click();
		await expect
			.poll(() =>
				page.evaluate(() =>
					Math.max(
						window.scrollY,
						document.body.scrollTop,
						document.documentElement.scrollTop,
					),
				),
			)
			.toBe(0);
		expect(
			pageErrors.filter((message) => /scrollToTopOfPage/.test(message)),
		).toEqual([]);
	});

	test("should keep the global 404 in minimal chrome mode", async ({ page }) => {
		await page.goto("/404.html");

		await expect(page.locator("#theme-toggle-root")).toHaveCount(0);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
		await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
		await expect(page.locator("#coffee-fab")).toHaveCount(0);
	});

	test("clicking print control calls window.print", async ({ page }) => {
		await page.addInitScript(() => {
			(window as unknown as { __printCalls: number }).__printCalls = 0;
			window.print = () => {
				(window as unknown as { __printCalls: number }).__printCalls += 1;
			};
		});

		await page.goto("/");

		const printBtn = page.locator("#nabla-print-pdf-btn");
		await expect(printBtn).toBeVisible({ timeout: 15_000 });
		await printBtn.click();

		const printCalls = await page.evaluate(
			() => (window as unknown as { __printCalls: number }).__printCalls,
		);
		expect(printCalls).toBe(1);
	});
});
