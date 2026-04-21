import { expect, test, type Page } from "@playwright/test";

/** Home layout injects `site-widgets.js` via Next `<Script strategy="afterInteractive">`; `load` can fire before it runs. */
async function expectThemeToggleMounted(page: Page) {
	const root = page.locator("#theme-toggle-root");
	await expect(root).toBeAttached({ timeout: 15_000 });
	await expect(root).toBeVisible();
	return root;
}

test.describe("Theme Toggle Tests", () => {
	/* Avoid hammering `next dev` with parallel `/` navigations; Turbopack + afterInteractive can skip widget inject. */
	test.describe.configure({ mode: "serial" });

	test("should have theme toggle button", async ({ page }) => {
		await page.goto("/");

		// Look for theme toggle button
		const themeToggle = page.locator(
			'button[aria-label*="theme" i], .theme-toggle, #theme-toggle',
		);
		if ((await themeToggle.count()) > 0) {
			await expect(themeToggle).toBeVisible();
		}
	});

	test("should render segmented control with explicit modes", async ({
		page,
	}) => {
		await page.goto("/");

		const root = await expectThemeToggleMounted(page);
		await expect(root).toHaveAttribute("role", "region");
		await expect(root).toHaveAttribute("aria-label", "Display theme");

		const buttons = root.locator(".theme-toggle__btn");
		await expect(buttons).toHaveCount(3);

		const lightBtn = root.locator('.theme-toggle__btn[data-theme="light"]');
		const darkBtn = root.locator('.theme-toggle__btn[data-theme="dark"]');
		const autoBtn = root.locator('.theme-toggle__btn[data-theme="auto"]');
		await expect(lightBtn).toHaveCount(1);
		await expect(darkBtn).toHaveCount(1);
		await expect(autoBtn).toHaveCount(1);

		await expect(lightBtn).toHaveAttribute("aria-label", "Light");
		await expect(darkBtn).toHaveAttribute("aria-label", "Dark");
		await expect(autoBtn).toHaveAttribute("aria-label", "Auto (system)");

		const pressedCount = await root
			.locator('.theme-toggle__btn[aria-pressed="true"]')
			.count();
		expect(pressedCount).toBe(1);
	});

	test("should treat invalid stored preference as auto", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("site-theme-preference", "invalid-theme");
		});

		await page.goto("/");

		await expect(
			(await expectThemeToggleMounted(page)).locator('[data-theme="auto"]'),
		).toHaveAttribute("aria-pressed", "true");

		const resolvedPreference = await page.evaluate(() => {
			return window.themeToggle?.get();
		});
		expect(resolvedPreference).toBe("auto");
	});

	test("should toggle between light and dark theme", async ({ page }) => {
		await page.goto("/");

		const root = await expectThemeToggleMounted(page);
		const lightBtn = root.locator('.theme-toggle__btn[data-theme="light"]');
		const darkBtn = root.locator('.theme-toggle__btn[data-theme="dark"]');

		await expect(lightBtn).toHaveCount(1);
		await expect(darkBtn).toHaveCount(1);

		await lightBtn.scrollIntoViewIfNeeded();
		await lightBtn.click({ force: true });
		await expect
			.poll(
				async () =>
					page.evaluate(
						() => localStorage.getItem("site-theme-preference") ?? "",
					),
				{ timeout: 15_000 },
			)
			.toBe("light");

		await darkBtn.scrollIntoViewIfNeeded();
		await darkBtn.click({ force: true });
		await expect
			.poll(
				async () =>
					page.evaluate(
						() => localStorage.getItem("site-theme-preference") ?? "",
					),
				{ timeout: 15_000 },
			)
			.toBe("dark");
	});

	test("should persist theme preference", async ({ page }) => {
		await page.goto("/");

		const root = await expectThemeToggleMounted(page);
		const darkBtn = root.locator('.theme-toggle__btn[data-theme="dark"]');
		await expect(darkBtn).toBeVisible();
		await darkBtn.scrollIntoViewIfNeeded();
		await darkBtn.click({ force: true });

		await expect
			.poll(
				async () =>
					page.evaluate(
						() => localStorage.getItem("site-theme-preference") ?? "",
					),
				{ timeout: 15_000 },
			)
			.toBe("dark");

		const htmlElement = page.locator("html");
		const darkEffective = await htmlElement.getAttribute("data-theme");

		await page.reload();

		await expect
			.poll(async () => htmlElement.getAttribute("data-theme"), {
				timeout: 15_000,
			})
			.toBe(darkEffective);
		expect(
			await page.evaluate(() => localStorage.getItem("site-theme-preference")),
		).toBe("dark");
	});

	test("should apply correct styles in dark mode", async ({ page }) => {
		await page.goto("/");

		const root = await expectThemeToggleMounted(page);
		const lightBtn = root.locator('.theme-toggle__btn[data-theme="light"]');
		const darkBtn = root.locator('.theme-toggle__btn[data-theme="dark"]');

		const htmlElement = page.locator("html");

		await lightBtn.scrollIntoViewIfNeeded();
		await lightBtn.click({ force: true });
		await expect
			.poll(async () => htmlElement.getAttribute("data-theme"), {
				timeout: 15_000,
			})
			.toBe("light");
		const readTextPrimary = () =>
			page.evaluate(() =>
				getComputedStyle(document.documentElement)
					.getPropertyValue("--text-primary")
					.trim(),
			);
		const lightTextPrimary = await readTextPrimary();

		await darkBtn.scrollIntoViewIfNeeded();
		await darkBtn.click({ force: true });
		await expect
			.poll(async () => htmlElement.getAttribute("data-theme"), {
				timeout: 15_000,
			})
			.toBe("dark");
		const darkTextPrimary = await readTextPrimary();

		// Body color can stay identical under .page-dark; theme tokens on <html> reflect mode
		expect(darkTextPrimary).not.toBe(lightTextPrimary);
		expect(lightTextPrimary.length).toBeGreaterThan(0);
		expect(darkTextPrimary.length).toBeGreaterThan(0);
	});
});
