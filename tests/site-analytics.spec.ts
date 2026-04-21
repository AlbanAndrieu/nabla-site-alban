import { expect, test } from "@playwright/test";

test.describe("Site analytics loader regression tests", () => {
	test("should load default vercel analytics scripts and expose API", async ({
		page,
	}) => {
		await page.goto("/expertise.html?nablaEnableThirdParty=1");

		await expect
			.poll(async () => {
				return page.evaluate(() => {
					return typeof (window as any).NABLA_SITE_ANALYTICS?.initGtm;
				});
			})
			.toBe("function");

		// Browsers may normalize script src to an absolute URL; match by path suffix
		await expect(
			page.locator('script[src*="/_vercel/insights/script.js"]'),
		).toHaveCount(1);
		await expect(
			page.locator('script[src*="/_vercel/speed-insights/script.js"]'),
		).toHaveCount(1);
	});

	test("should keep GTM and gtag init idempotent", async ({ page }) => {
		// Home uses data-analytics-mode="home" and already injects GTM/gtag; use vercel-only page
		await page.goto("/expertise.html");

		await expect
			.poll(async () => {
				return page.evaluate(() => {
					return typeof (window as any).NABLA_SITE_ANALYTICS?.initGtm;
				});
			})
			.toBe("function");

		const before = await page.evaluate(() => {
			return {
				gtm: document.querySelectorAll(
					'script[src*="googletagmanager.com/gtm.js?id="]',
				).length,
				gtag: document.querySelectorAll(
					'script[src*="googletagmanager.com/gtag/js?id="]',
				).length,
			};
		});

		await page.evaluate(() => {
			const api = (window as any).NABLA_SITE_ANALYTICS;
			api.initGtm("GTM-TEST123");
			api.initGtm("GTM-TEST123");
			api.initGtag("G-TEST123");
			api.initGtag("G-TEST123");
		});

		const after = await page.evaluate(() => {
			return {
				gtm: document.querySelectorAll(
					'script[src*="googletagmanager.com/gtm.js?id="]',
				).length,
				gtag: document.querySelectorAll(
					'script[src*="googletagmanager.com/gtag/js?id="]',
				).length,
			};
		});

		// init* can be a no-op if scripts are already loaded; idempotence means never duplicating.
		expect(after.gtm).toBe(Math.max(1, before.gtm));
		expect(after.gtag).toBe(Math.max(1, before.gtag));
	});

	test("should load Ahrefs script when key is provided", async ({ page }) => {
		await page.goto("/test.html?nablaEnableThirdParty=1");

		const ahrefs = page.locator(
			'script[src="https://analytics.ahrefs.com/analytics.js"][data-key]',
		);
		await expect(ahrefs).toHaveCount(1);
		await expect(ahrefs).toHaveAttribute("data-key", "tg3zLMS/bebJFl0LxctiCw");
	});
});
