import { expect, test } from "@playwright/test";

test.describe("Site widgets integration", () => {
	test("should inject print, back-to-top on homepage", async ({ page }) => {
		await page.goto("/", { waitUntil: "networkidle" });

		await page.waitForFunction(
			() =>
				document.querySelector("#nabla-print-pdf-btn") &&
				document.querySelector("#nabla-back-to-top"),
			null,
			{ timeout: 30000 },
		);

		const printButton = page.locator("#nabla-print-pdf-btn");
		await expect(printButton).toHaveCount(1);
		await expect(printButton).toBeVisible();
		await expect(printButton).toHaveAttribute("aria-label", /.+/);

		const backToTop = page.locator("#nabla-back-to-top");
		await expect(backToTop).toHaveCount(1);
		await expect(backToTop).toBeVisible();
		await expect(backToTop).toHaveAttribute("href", "#top");
	});

	test("should trigger top scroll when back-to-top control is clicked", async ({
		page,
	}) => {
		await page.goto("/");
		await page.locator("#nabla-back-to-top").waitFor();
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

		await page.locator("#nabla-back-to-top").click();
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	});

	test("should scroll to top when back-to-top control has href '#'", async ({
		page,
	}) => {
		await page.goto("/");
		await page.evaluate(() => {
			const button = document.getElementById("nabla-back-to-top");
			if (button) {
				button.setAttribute("href", "#");
			}
			window.scrollTo(0, document.body.scrollHeight);
		});
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

		await page.locator("#nabla-back-to-top").click();
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	});

	test("should keep 404 in minimal chrome mode while still applying stored theme", async ({
		page,
	}) => {
		await page.addInitScript(() => {
			localStorage.setItem("site-theme-preference", "light");
		});

		await page.goto("/404.html");

		await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
		await expect(page.locator("#theme-toggle-root")).toHaveCount(0);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
		await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
		await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
		await expect(page.locator("#coffee-fab")).toHaveCount(0);
	});

	test("injects print and back-to-top controls on homepage", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "networkidle" });

		await page.waitForFunction(
			() =>
				document.querySelector("#nabla-print-pdf-btn") &&
				document.querySelector("#nabla-back-to-top"),
			null,
			{ timeout: 30000 },
		);

		const printBtn = page.locator("#nabla-print-pdf-btn");
		const backToTop = page.locator("#nabla-back-to-top");

		await expect(printBtn).toBeVisible();
		await expect(printBtn).toHaveAttribute("aria-label", /print|pdf/i);
		await expect(backToTop).toBeVisible();
		await expect(backToTop).toHaveAttribute("href", "#top");
	});

	test("clicking print control calls window.print", async ({ page }) => {
		await page.addInitScript(() => {
			(window as unknown as { __printCalls: number }).__printCalls = 0;
			window.print = () => {
				(window as unknown as { __printCalls: number }).__printCalls += 1;
			};
		});

		await page.goto("/", { waitUntil: "networkidle" });

		await page.waitForFunction(
			() => document.querySelector("#nabla-print-pdf-btn"),
			null,
			{ timeout: 30000 },
		);

		const printBtn = page.locator("#nabla-print-pdf-btn");
		await expect(printBtn).toBeVisible();
		await printBtn.click();

		const printCalls = await page.evaluate(
			() => (window as unknown as { __printCalls: number }).__printCalls,
		);
		expect(printCalls).toBe(1);
	});

	test("minimal chrome page does not inject optional widgets", async ({
		page,
	}) => {
		await page.goto("/404.html");

		await expect(page.locator("#theme-toggle-root")).toHaveCount(0);
		await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
		await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
		await expect(page.locator(".google-translate-widget")).toHaveCount(0);
	});
});
