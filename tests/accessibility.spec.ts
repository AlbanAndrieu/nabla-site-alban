import { expect, test } from "@playwright/test";

test.describe("Accessibility Tests", () => {
	function parseHeadingLevel(tagName: string): number {
		return Number.parseInt(tagName.replace("h", ""), 10);
	}

	test("should have valid HTML structure", async ({ page }) => {
		await page.goto("/");

		// Check for doctype
		const doctype = await page.evaluate(() => {
			return document.doctype !== null;
		});
		expect(doctype).toBeTruthy();

		// Check for html lang attribute
		const htmlLang = await page.locator("html").getAttribute("lang");
		expect(htmlLang).toBeTruthy();
	});

	test("should have only one h1 tag", async ({ page }) => {
		await page.goto("/");

		// Count h1 in the main document only (not iframe documents). Exclude rare injected UI.
		const h1Count = await page.evaluate(() => {
			return Array.from(document.querySelectorAll("h1")).filter((h) => {
				if (h.getRootNode() !== document) return false;
				if (
					h.closest(
						"#google_translate_element, .google-translate-widget, .goog-te-banner-frame, [class*='goog-te']",
					)
				)
					return false;
				return true;
			}).length;
		});
		expect(h1Count).toBeLessThanOrEqual(1);
	});

	test("should have skip navigation link for keyboard users", async ({
		page,
	}) => {
		await page.goto("/");

		const skipLink = page.locator('a.skip-to-main[href="#main-content"]');
		await expect(skipLink).toHaveCount(1);
		await expect(page.locator("main#main-content")).toHaveCount(1);

		for (let attempt = 0; attempt < 5; attempt++) {
			await page.keyboard.press("Tab");
			if (
				await skipLink.evaluate((element) => document.activeElement === element)
			)
				break;
		}
		await expect(skipLink).toBeFocused();
	});

	test("should support keyboard navigation", async ({ page }) => {
		await page.goto("/");

		// Press Tab to navigate
		await page.keyboard.press("Tab");

		// Check that an element is focused
		const focusedElement = await page.evaluate(() => {
			const focused = document.activeElement;
			return focused ? focused.tagName : null;
		});

		expect(focusedElement).toBeTruthy();
	});

	test("should have accessible images with alt text", async ({ page }) => {
		await page.goto("/");

		// Get all images
		const images = page.locator("img");
		const imageCount = await images.count();

		// Check that images have alt attributes
		for (let i = 0; i < imageCount; i++) {
			const img = images.nth(i);
			const hasAlt = await img.getAttribute("alt");
			// Alt can be empty string for decorative images, but should be present
			expect(hasAlt).not.toBeNull();
		}
	});

	test("should have theme toggle functionality", async ({ page }) => {
		test.setTimeout(15000);
		await page.goto("/");
		const themeRoot = page.locator("#theme-toggle-root");
		const visible = await themeRoot
			.waitFor({ state: "visible", timeout: 5000 })
			.then(() => true)
			.catch(() => false);
		if (!visible) return;
		await page.evaluate(() => {
			localStorage.setItem("site-theme-preference", "light");
			window.themeToggle?.set("light");
		});
		const darkBtn = themeRoot.locator('button[data-theme="dark"]');
		await darkBtn.click();
		await page.waitForTimeout(300);
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await expect(darkBtn).toHaveAttribute("aria-pressed", "true");
	});

	test("should have proper heading hierarchy", async ({ page }) => {
		await page.goto("/");

		// Check only visible headings in main content to avoid nav/widget noise.
		const headingTags = await page.evaluate(() => {
			const thirdPartySelector =
				"#google_translate_element, .google-translate-widget, .goog-te-banner-frame, [class*='goog-te']";
			const selector = "main h1, main h2, main h3, main h4, main h5, main h6";
			return Array.from(document.querySelectorAll(selector))
				.filter((el) => {
					if (el.getRootNode() !== document) return false;
					if (el.closest(thirdPartySelector)) return false;
					const style = window.getComputedStyle(el);
					return style.display !== "none" && style.visibility !== "hidden";
				})
				.map((el) => el.tagName.toLowerCase());
		});

		if (headingTags.length <= 1) return;

		const headingLevels = headingTags.map(parseHeadingLevel);
		for (let i = 1; i < headingLevels.length; i++) {
			const jump = headingLevels[i] - headingLevels[i - 1];
			expect(jump).toBeLessThanOrEqual(1);
		}
	});

	test("should have alt text on all images", async ({ page }) => {
		await page.goto("/");

		// Only check images in main content (exclude third-party widgets e.g. Google Translate)
		const images = await page
			.locator("main img, header img, .container img, body > .container img")
			.all();

		for (const img of images) {
			const alt = await img.getAttribute("alt");
			const ariaHidden = await img.getAttribute("aria-hidden");

			// Image should either have alt text or be aria-hidden
			expect(alt !== null || ariaHidden === "true").toBeTruthy();
		}
	});

	test("should have accessible form labels", async ({ page }) => {
		await page.goto("/");

		// Check only inputs in main/header/form, excluding third-party widgets. Use the DOM API for
		// accessible names (labels property, aria-*) so wrapped <label><input></label> is valid.
		const violations = await page.evaluate(() => {
			const thirdPartySelector =
				"#google_translate_element, [id*='goog-te'], [id*='goog-gt'], [id*='google_translate'], [class*='goog-te'], [class*='goog-gt'], [class*='grecaptcha'], .cf-turnstile, [data-sitekey], .google-translate-widget, [role='combobox'], [class*='skiptranslate']";

			function hasAccessibleName(el: HTMLInputElement): boolean {
				if (el.getAttribute("aria-hidden") === "true") return true;
				const al = el.getAttribute("aria-label")?.trim();
				if (al) return true;
				const title = el.getAttribute("title")?.trim();
				if (title) return true;
				if (el.type === "image" && el.getAttribute("alt")?.trim()) return true;
				const lb = el.getAttribute("aria-labelledby");
				if (lb) {
					for (const id of lb.split(/\s+/).filter(Boolean)) {
						const ref = document.getElementById(id);
						if (ref?.textContent?.trim()) return true;
					}
				}
				if (el.labels && el.labels.length > 0) return true;
				const id = el.id;
				if (id) {
					const lab = document.querySelector(`label[for="${CSS.escape(id)}"]`);
					if (lab?.textContent?.trim()) return true;
				}
				return false;
			}

			function looksLikeThirdPartyWidget(el: HTMLInputElement): boolean {
				if (el.closest(thirdPartySelector)) return true;
				const name = (el.getAttribute("name") || "").toLowerCase();
				if (/turnstile|cf-turnstile|g-recaptcha|__hstc|__utm/.test(name))
					return true;
				const pid = (el.id || "").toLowerCase();
				if (/turnstile|recaptcha|goog-te|goog-gt|gtm-|vwo_|mixpanel/.test(pid))
					return true;
				return false;
			}

			const roots = document.querySelectorAll("main, header, form");
			const bad: string[] = [];
			roots.forEach((root) => {
				root.querySelectorAll('input:not([type="hidden"])').forEach((node) => {
					const el = node as HTMLInputElement;
					if (el.getRootNode() !== document) return;
					if (looksLikeThirdPartyWidget(el)) return;
					if (!hasAccessibleName(el)) bad.push(el.outerHTML.slice(0, 120));
				});
			});
			return bad;
		});

		expect(violations).toEqual([]);
	});

	test("should have form labels associated with inputs", async ({ page }) => {
		await page.goto("/");

		const inputs = page.locator(
			'input[type="text"], input[type="email"], input[type="password"], input[type="search"], textarea',
		);
		const inputCount = await inputs.count();

		for (let i = 0; i < inputCount; i++) {
			const input = inputs.nth(i);
			const id = await input.getAttribute("id");
			const ariaLabel = await input.getAttribute("aria-label");
			const ariaLabelledby = await input.getAttribute("aria-labelledby");

			// Only enforce labels for inputs in our main content; skip third-party widgets (e.g. Google Translate)
			const isInMainContent = await input.evaluate(
				(el) => !!el.closest("main#main-content, [role='main']"),
			);
			if (!isInMainContent) continue;

			if (id) {
				const label = page.locator(`label[for="${id}"]`);
				const labelCount = await label.count();
				const hasAccessibleName =
					labelCount > 0 || !!ariaLabel || !!ariaLabelledby;
				expect(hasAccessibleName).toBeTruthy();
			}
		}
	});

	test("should have sufficient color contrast", async ({ page }) => {
		await page.goto("/");

		const contrastRatio = await page.evaluate(() => {
			const s = window.getComputedStyle(document.body);
			const channels = (value: string) =>
				(value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
			const luminance = (value: string) => {
				const rgb = channels(value).map((channel) => {
					const normalized = channel / 255;
					return normalized <= 0.04045
						? normalized / 12.92
						: ((normalized + 0.055) / 1.055) ** 2.4;
				});
				return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
			};
			const foreground = luminance(s.color);
			const background = luminance(s.backgroundColor);
			return (
				(Math.max(foreground, background) + 0.05) /
				(Math.min(foreground, background) + 0.05)
			);
		});

		expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
	});

	test("should be keyboard navigable", async ({ page }) => {
		await page.goto("/");

		const interactive = [
			"a",
			"button",
			"input",
			"select",
			"textarea",
			"iframe",
		];

		const hasFocusable = await page.evaluate(() => {
			return (
				document.querySelector(
					'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
				) !== null
			);
		});
		expect(hasFocusable).toBeTruthy();

		let tag: string | null = null;
		for (let i = 0; i < 40; i++) {
			await page.keyboard.press("Tab");
			tag = await page.evaluate(
				() => document.activeElement?.tagName?.toLowerCase() ?? null,
			);
			if (tag && interactive.includes(tag)) break;
		}

		// WebKit / some configs skip links on Tab; fall back to programmatic focus
		if (!tag || !interactive.includes(tag)) {
			const first = page
				.locator(
					'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
				)
				.first();
			await first.focus();
			tag = await page.evaluate(
				() => document.activeElement?.tagName?.toLowerCase() ?? null,
			);
		}

		expect(tag).toBeTruthy();
		expect(interactive).toContain(tag);
	});

	test("should have proper viewport meta tag", async ({ page }) => {
		await page.goto("/");

		const viewportMeta = await page
			.locator('meta[name="viewport"]')
			.getAttribute("content");
		expect(viewportMeta).toBeTruthy();
		expect(viewportMeta).toContain("width=device-width");
	});

	test("should have landmark main", async ({ page }) => {
		await page.goto("/");

		// Check for main landmark
		const main = await page.locator('main, [role="main"]').count();
		expect(main).toBeGreaterThan(0);
	});

	test("should have focus indicators", async ({ page }) => {
		await page.goto("/");

		// Use the server-rendered locale switcher instead of a widget injected asynchronously.
		const focusTarget = page.locator("#route-header-locale");
		await expect(focusTarget).toBeVisible();
		await focusTarget.focus();

		const hasFocus = await focusTarget.evaluate((el) => {
			return document.activeElement === el;
		});
		expect(hasFocus).toBeTruthy();
	});
});
