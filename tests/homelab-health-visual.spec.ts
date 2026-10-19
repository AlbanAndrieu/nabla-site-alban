import { expect, test, type Page } from "@playwright/test";

async function forceTheme(page: Page, theme: "light" | "dark") {
	await page.addInitScript((selectedTheme) => {
		localStorage.setItem("site-theme-preference", selectedTheme);
	}, theme);
}

async function expectNoHorizontalOverflow(page: Page) {
	const overflow = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth,
	}));
	expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

// Public Preview only verifies absence of internal health widgets. The visual
// service-fixture suite lives in ops-homelab-health-visual.spec.ts and is never
// executed on an unauthenticated GitHub-hosted runner.
// Separate browser contexts: Playwright addInitScript registrations persist within a page
// and would race when light/dark themes are injected on repeated navigations.
for (const theme of ["light", "dark"] as const) {
	test(`anonymous TrueNAS keeps internal health badges private in ${theme} mode`, async ({
		page,
	}) => {
		await forceTheme(page, theme);
		await page.goto("/en/truenas#truenas-services");
		await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
		await expect(page.locator("#truenas-services")).toBeVisible();
		await expect(page.locator(".service-card-ux")).toHaveCount(0);
		await expect(page.locator("[data-health-state]")).toHaveCount(0);
		await expect(
			page.locator('a[href="https://ops.albandrieu.com/"]'),
		).toBeVisible();
	});
}

test("mobile architecture has no unauthenticated health-state widgets", async ({
	page,
}) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto("/en/architecture");
	await expect(page.locator("#architecture-title")).toBeVisible();
	await expect(page.locator("#architecture-health-dashboard")).toHaveCount(0);
	await expect(page.locator(".service-card-ux")).toHaveCount(0);
	await expectNoHorizontalOverflow(page);
});
