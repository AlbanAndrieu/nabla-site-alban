import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
	const dimensions = await page.evaluate(() => ({
		clientWidth: document.documentElement.clientWidth,
		scrollWidth: document.documentElement.scrollWidth,
	}));

	expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

async function expectContainedInViewport(
	page: Page,
	selector: string,
	viewportWidth: number,
) {
	const elements = page.locator(selector);
	const count = await elements.count();
	expect(count).toBeGreaterThan(0);

	for (let index = 0; index < count; index++) {
		const element = elements.nth(index);
		if (!(await element.isVisible())) continue;
		const box = await element.boundingBox();
		if (!box) continue;

		expect(box.x).toBeGreaterThanOrEqual(-1);
		expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 1);
	}
}

test.describe("Responsive Design Tests", () => {
	test("Nabla UI stays contained across mobile, tablet, landscape, and desktop", async ({
		page,
	}) => {
		const viewports = [
			{ width: 320, height: 700, name: "small mobile" },
			{ width: 375, height: 812, name: "mobile" },
			{ width: 667, height: 375, name: "mobile landscape" },
			{ width: 768, height: 1024, name: "tablet" },
			{ width: 1440, height: 900, name: "desktop" },
		];

		for (const viewport of viewports) {
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});
			await page.goto("/nabla", { waitUntil: "domcontentloaded" });

			await expect(page.locator("[data-responsive-hero]")).toBeVisible();
			await expectNoHorizontalOverflow(page);
			await expectContainedInViewport(
				page,
				'[data-hero-actions="primary"] a',
				viewport.width,
			);
			await expectContainedInViewport(
				page,
				"[data-nabla-hero-card]",
				viewport.width,
			);

			const fontSize = await page.evaluate(() =>
				Number.parseFloat(window.getComputedStyle(document.body).fontSize),
			);
			expect(fontSize, `${viewport.name} body text`).toBeGreaterThanOrEqual(12);
		}
	});

	test("should have touch-friendly interactive elements on mobile", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto("/nabla", { waitUntil: "domcontentloaded" });

		const heroActions = page.locator('[data-hero-actions="primary"] a');
		const count = await heroActions.count();
		expect(count).toBeGreaterThan(0);

		for (let index = 0; index < count; index++) {
			const box = await heroActions.nth(index).boundingBox();
			expect(box).not.toBeNull();
			if (box) {
				expect(box.height).toBeGreaterThanOrEqual(44);
			}
		}
	});

	test("route header reflows between tablet and narrow mobile", async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto("/architecture", { waitUntil: "domcontentloaded" });
		await expectNoHorizontalOverflow(page);

		const localeLabel = page.locator(
			'label[for="route-header-locale"] > span',
		);
		const localeSelect = page.locator("#route-header-locale");
		await expect(localeSelect).toBeVisible();
		await expect(localeLabel).toBeHidden();

		await page.setViewportSize({ width: 375, height: 812 });
		await expectNoHorizontalOverflow(page);
		await expect(localeLabel).toBeVisible();
		await expect(localeSelect).toBeVisible();

		await page.setViewportSize({ width: 320, height: 700 });
		await expectNoHorizontalOverflow(page);
		await expectContainedInViewport(page, "#route-header-locale", 320);

		const labelBox = await localeLabel.boundingBox();
		const selectBox = await localeSelect.boundingBox();
		expect(labelBox).not.toBeNull();
		expect(selectBox).not.toBeNull();
		if (labelBox && selectBox) {
			expect(selectBox.y).toBeGreaterThanOrEqual(labelBox.y + labelBox.height - 1);
			expect(selectBox.width).toBeGreaterThan(250);
		}
	});

	test("architecture switches to the compact hierarchy on mobile", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto("/architecture", { waitUntil: "domcontentloaded" });

		await page.getByRole("button", { name: "Nabla / TrueNAS" }).click();

		const explorer = page.locator("#service-architecture-explorer");
		const compactHierarchy = page
			.locator("[data-mobile-architecture-hierarchy]")
			.filter({ visible: true });
		await expect(compactHierarchy).toHaveCount(1);
		await expect(compactHierarchy).toBeVisible();
		await expect(explorer.locator(".react-flow:visible")).toHaveCount(0);

		const firstGroup = compactHierarchy
			.locator("[data-mobile-criticality-tier]")
			.first();
		await expect(firstGroup).toBeVisible();
		const groupOpen = await firstGroup.evaluate(
			(element) => (element as HTMLDetailsElement).open,
		);
		if (!groupOpen) await firstGroup.locator("summary").first().click();
		await expect(firstGroup.locator("[data-mobile-service]").first()).toBeVisible();

		await page.setViewportSize({ width: 1280, height: 900 });
		await expect(
			page.locator("[data-mobile-architecture-hierarchy]:visible"),
		).toHaveCount(0);
		await expect(explorer.locator(".react-flow:visible")).toHaveCount(1);
	});
});
