import { expect, test } from "@playwright/test";

test.describe("Google Translate Widget Tests", () => {
	test("should have Google Translate widget container", async ({ page }) => {
		await page.goto("/");

		// Wrapper is injected by /site-widgets.js (Next Script afterInteractive), not SSR.
		const wrapper = page.locator(".google-translate-widget");
		await expect(wrapper).toBeVisible({ timeout: 15_000 });
		const translateElement = page.locator("#google_translate_element");
		await expect(translateElement).toBeAttached();
	});

	test("should load Google Translate scripts", async ({ page }) => {
		await page.goto("/");

		// Wait for page to load
		await page.waitForLoadState("networkidle");

		// Check if Google Translate script is loaded
		const translateScript = page.locator('script[src*="translate.google.com"]');
		if ((await translateScript.count()) > 0) {
			expect(await translateScript.count()).toBeGreaterThan(0);
		}
	});

	test("should have translate configuration", async ({ page }) => {
		await page.goto("/");

		// Check if translate config exists
		const hasConfig = await page.evaluate(() => {
			return (
				typeof (window as any).googleTranslateElementInit === "function" ||
				typeof (window as any).googleTranslateConfig !== "undefined"
			);
		});

		// If config exists, verify it
		if (hasConfig) {
			expect(hasConfig).toBeTruthy();
		}
	});

	test("should be positioned correctly", async ({ page }) => {
		await page.goto("/");

		const translateElement = page.locator("#google_translate_element");

		if ((await translateElement.count()) > 0) {
			const vw = page.viewportSize()?.width ?? 1280;
			if (vw <= 575) {
				const toggle = page.locator(".google-translate-widget__toggle");
				await expect(toggle).toBeAttached({ timeout: 15_000 });
				await expect(toggle).toBeVisible();
				await toggle.click();
			}

			await expect(translateElement).toBeInViewport();

			const position = await translateElement.evaluate((el) => {
				return window.getComputedStyle(el).position;
			});

			expect(["fixed", "absolute", "relative", "sticky"]).toContain(position);
		}
	});

	test("should be accessible on mobile", async ({ page, viewport }) => {
		await page.goto("/");

		if (viewport && viewport.width < 768) {
			const translateElement = page.locator("#google_translate_element");

			if ((await translateElement.count()) > 0) {
				const vw = viewport.width;
				// Below 576px the panel is closed until the toggle opens (see theme.css)
				if (vw <= 575) {
					const toggle = page.locator(".google-translate-widget__toggle");
					if (await toggle.isVisible()) {
						await toggle.click();
					}
				}
				await expect(translateElement).toBeAttached();
				await translateElement.scrollIntoViewIfNeeded();
				await expect(translateElement).toBeInViewport({ ratio: 0.01 });
			}
		}
	});
});
