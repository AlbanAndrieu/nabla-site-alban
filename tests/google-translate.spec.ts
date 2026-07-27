import { expect, test } from "@playwright/test";

test.describe("Google Translate vs Next.js i18n", () => {
	test("Next app shell does not load Google Translate (next-intl instead)", async ({
		page,
	}) => {
		await page.goto("/");

		await expect(page.locator("html")).toHaveAttribute(
			"data-nabla-app",
			"next-intl",
		);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#google_translate_element")).toHaveCount(0);
		await expect(
			page.locator(
				'script[src*="translate.google.com/translate_a/element.js"]',
			),
		).toHaveCount(0);
	});

	test("marketing page via .html rewrite has no Google Translate widget", async ({
		page,
	}) => {
		const res = await page.goto("/nabla.html");
		expect(res?.ok()).toBeTruthy();

		await expect(page.locator("html")).toHaveAttribute(
			"data-nabla-app",
			"next-intl",
		);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#google_translate_element")).toHaveCount(0);
	});
});
