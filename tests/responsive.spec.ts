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

const sharedViewports = [
	{ width: 320, height: 568, name: "small mobile" },
	{ width: 375, height: 667, name: "mobile" },
	{ width: 667, height: 375, name: "mobile landscape" },
	{ width: 768, height: 1024, name: "tablet" },
	{ width: 1024, height: 768, name: "tablet landscape" },
	{ width: 1440, height: 900, name: "desktop" },
	{ width: 1920, height: 1080, name: "wide desktop" },
] as const;

test.describe("Responsive Design Tests", () => {
	test("Nabla UI stays contained across mobile, tablet, landscape, and desktop", async ({
		page,
	}) => {
		for (const viewport of sharedViewports) {
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
		await page.setViewportSize({ width: 375, height: 667 });
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

	test("route header reflows at tablet and narrow-mobile breakpoints", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto("/architecture", { waitUntil: "domcontentloaded" });
		await expectNoHorizontalOverflow(page);

		const nav = page.locator("header nav").first();
		const locale = page.locator('header label[for="route-header-locale"]');
		const localeLabel = locale.locator(":scope > span");
		const localeSelect = page.locator("#route-header-locale");
		await expect(nav).toBeVisible();
		await expect(locale).toBeVisible();
		await expect(localeLabel).toBeVisible();
		await expect(localeSelect).toBeVisible();

		const tabletNavBox = await nav.boundingBox();
		const tabletLocaleBox = await locale.boundingBox();
		expect(tabletNavBox).not.toBeNull();
		expect(tabletLocaleBox).not.toBeNull();
		if (tabletNavBox && tabletLocaleBox) {
			expect(tabletNavBox.y + tabletNavBox.height).toBeLessThanOrEqual(
				tabletLocaleBox.y + 1,
			);
		}

		await page.setViewportSize({ width: 375, height: 667 });
		await expectNoHorizontalOverflow(page);
		await expect(localeLabel).toBeVisible();
		const mobileLocaleBox = await locale.boundingBox();
		const mobileSelectBox = await localeSelect.boundingBox();
		expect(mobileLocaleBox).not.toBeNull();
		expect(mobileSelectBox).not.toBeNull();
		if (mobileLocaleBox && mobileSelectBox) {
			expect(mobileSelectBox.width).toBeGreaterThanOrEqual(
				mobileLocaleBox.width - 2,
			);
		}

		await page.setViewportSize({ width: 320, height: 568 });
		await expectNoHorizontalOverflow(page);
		await expectContainedInViewport(page, "#route-header-locale", 320);
	});

	test("shared contact, policy, and footer chrome stays width-safe", async ({
		page,
	}) => {
		const viewports = sharedViewports.filter(
			(viewport) => viewport.name !== "mobile landscape" && viewport.name !== "wide desktop",
		);
		const paths = ["/contact", "/fr/contact", "/policy"] as const;

		for (const viewport of viewports) {
			await page.setViewportSize({
				width: viewport.width,
				height: viewport.height,
			});

			for (const path of paths) {
				await page.goto(path, { waitUntil: "domcontentloaded" });
				await expect(page.locator("body")).toBeVisible();
				await expectNoHorizontalOverflow(page);

				const viewportWidth = await page.evaluate(
					() => document.documentElement.clientWidth,
				);
				const mainBox = await page.locator("main").first().boundingBox();
				expect(mainBox).not.toBeNull();
				if (mainBox) {
					expect(mainBox.width).toBeLessThanOrEqual(viewportWidth + 1);
				}

				const localeSelect = page.locator("#route-header-locale");
				await expect(localeSelect).toBeVisible();
				const localeSelectBox = await localeSelect.boundingBox();
				expect(localeSelectBox).not.toBeNull();
				if (localeSelectBox) {
					expect(localeSelectBox.height).toBeGreaterThanOrEqual(44);
					expect(localeSelectBox.width).toBeLessThanOrEqual(viewportWidth + 1);
				}

				const socialLinks = page.locator(
					'footer[role="contentinfo"] a.social-link',
				);
				const socialCount = await socialLinks.count();
				expect(socialCount).toBeGreaterThanOrEqual(2);
				for (let index = 0; index < socialCount; index++) {
					const link = socialLinks.nth(index);
					if (!(await link.isVisible())) continue;
					const box = await link.boundingBox();
					expect(Math.min(box?.width ?? 0, box?.height ?? 0)).toBeGreaterThanOrEqual(44);
				}

				if (viewport.width <= 575.98) {
					const legalLink = page.locator("footer .footer-links a").first();
					await expect(legalLink).toBeVisible();
					const legalBox = await legalLink.boundingBox();
					expect(legalBox?.height ?? 0).toBeGreaterThanOrEqual(44);
				}

				if (path.endsWith("/contact")) {
					const contactCta = page.locator('a[href="#contact-details"]').first();
					await expect(contactCta).toBeVisible();
					const ctaBox = await contactCta.boundingBox();
					expect(ctaBox?.height ?? 0).toBeGreaterThanOrEqual(44);
					expect(ctaBox?.width ?? 0).toBeLessThanOrEqual(viewportWidth + 1);

					const map = page.locator(".map-container iframe");
					await expect(map).toBeVisible();
					const mapBox = await map.boundingBox();
					expect(mapBox?.width ?? 0).toBeLessThanOrEqual(viewportWidth + 1);
					expect(mapBox?.height ?? 0).toBeGreaterThanOrEqual(240);
				}
			}
		}
	});

	test("architecture switches to the compact hierarchy on mobile", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
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
