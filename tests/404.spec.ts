import { expect, test } from "@playwright/test";

test.describe("404 Error Page Tests", () => {
	const missingPath = "/404.html";

	test("should return a semantic 404 response", async ({ page }) => {
		const response = await page.goto(missingPath);

		expect(response?.status()).toBe(404);
		await expect(page).toHaveTitle(/404|Not Found/i);
	});

	test("should display 404 error message", async ({ page }) => {
		await page.goto(missingPath);

		const errorMessage = page.locator("body");
		await expect(errorMessage).toContainText(/404|not found|page not found/i);
	});

	test("should have link back to home", async ({ page }) => {
		await page.goto(missingPath);

		const homeLink = page.locator('a[href="/"]');
		if ((await homeLink.count()) > 0) {
			await expect(homeLink).toBeVisible();
		}
	});

	test("should maintain site navigation on 404", async ({ page }) => {
		await page.goto(missingPath);

		const nav = page.locator("nav");
		if ((await nav.count()) > 0) {
			await expect(nav).toBeVisible();
		}
	});

	test("should keep minimal chrome widgets disabled", async ({ page }) => {
		await page.goto(missingPath);

		await expect(page.locator("#theme-toggle-btn")).toHaveCount(0);
		await expect(page.locator("#google_translate_element")).toHaveCount(0);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
		await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
		await expect(
			page.locator(
				'script[src*="translate.google.com/translate_a/element.js"]',
			),
		).toHaveCount(0);
	});

	test("should render a valid html document", async ({ page }) => {
		await page.goto(missingPath);

		await expect(page.locator("html")).toHaveCount(1);
		await expect(page.locator("body")).toBeVisible();
	});

	test("unknown top-level HTML should render the same custom 404 as /404", async ({
		page,
	}) => {
		for (const pathname of ["/404", "/people-contactedsss.html"]) {
			const response = await page.goto(pathname);

			expect(response?.status(), pathname).toBe(404);
			await expect(
				page.locator('html[data-nabla-app="next-global-not-found"]'),
			).toHaveCount(1);
			await expect(page.locator("body.page-dark")).toBeVisible();
			await expect(page.locator("h1")).toHaveText("404");
			await expect(page.locator(".cloak__wrapper")).toHaveCount(1);
			await expect(page.locator(".info h2")).toHaveText("We can't find that page");
			await expect(page.locator('.info a[href="/"]')).toBeVisible();

			const bodyStyle = await page.locator("body").evaluate((body) => {
				const style = window.getComputedStyle(body);
				return {
					display: style.display,
					backgroundColor: style.backgroundColor,
					color: style.color,
				};
			});
			expect(bodyStyle).toEqual({
				display: "flex",
				backgroundColor: "rgb(115, 115, 115)",
				color: "rgb(250, 250, 250)",
			});
		}
	});

	test("should be accessible on mobile", async ({ page, viewport }) => {
		await page.goto(missingPath);

		if (viewport && viewport.width < 768) {
			await expect(page.locator("body")).toBeVisible();
		}
	});
});
