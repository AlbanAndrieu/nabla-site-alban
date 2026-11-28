import { expect, type Locator, type Page, test } from "@playwright/test";

const priorityRoutes = ["/", "/contact", "/fr/contact", "/policy"] as const;

async function tabUntilFocused(
	page: Page,
	target: Locator,
	maxTabs = 40,
): Promise<void> {
	for (let attempt = 0; attempt < maxTabs; attempt++) {
		await page.keyboard.press("Tab");
		if (await target.evaluate((element) => document.activeElement === element)) {
			return;
		}
	}

	throw new Error(
		`Keyboard navigation did not reach ${await target.evaluate((element) =>
			element.outerHTML.slice(0, 160),
		)}`,
	);
}

async function expectVisibleFocus(target: Locator): Promise<void> {
	const evidence = await target.evaluate((element) => {
		const styles = window.getComputedStyle(element);
		const outlineWidth = Number.parseFloat(styles.outlineWidth) || 0;
		const hasBoxShadow = styles.boxShadow !== "none";

		return {
			focusVisible: element.matches(":focus-visible"),
			hasVisibleRing: outlineWidth > 0 || hasBoxShadow,
		};
	});

	expect(evidence.focusVisible).toBe(true);
	expect(evidence.hasVisibleRing).toBe(true);
	// theme.css uses smooth scrolling: the focus scroll is animated, so wait
	// for it to land instead of sampling mid-animation (seen on mobile /fr/contact).
	const inViewport = () =>
		target.evaluate((element) => {
				const rect = element.getBoundingClientRect();
				return (
					rect.bottom > 0 &&
					rect.right > 0 &&
					rect.top < window.innerHeight &&
					rect.left < window.innerWidth
				);
			});
	await expect.poll(inViewport).toBe(true);
}

test.describe("Keyboard focus visibility", () => {
	for (const route of priorityRoutes) {
		test(`${route} exposes a visible keyboard focus path`, async ({ page }) => {
			await page.goto(route, { waitUntil: "domcontentloaded" });
			await expect(page.locator("body")).toBeVisible();

			const skipLink = page.locator('a.skip-to-main[href="#main-content"]');
			await expect(skipLink).toHaveCount(1);
			await tabUntilFocused(page, skipLink, 5);
			await expect(skipLink).toBeFocused();
			await expectVisibleFocus(skipLink);

			const localeSelect = page.locator("#route-header-locale");
			await expect(localeSelect).toBeVisible();
			await tabUntilFocused(page, localeSelect, 40);
			await expect(localeSelect).toBeFocused();
			await expectVisibleFocus(localeSelect);

			const mainAction = page
				.locator(
					'main a[href]:visible, main button:not([disabled]):visible, main summary:visible',
				)
				.first();
			await expect(mainAction).toBeVisible();
			await tabUntilFocused(page, mainAction, 40);
			await expect(mainAction).toBeFocused();
			await expectVisibleFocus(mainAction);
		});
	}
});
