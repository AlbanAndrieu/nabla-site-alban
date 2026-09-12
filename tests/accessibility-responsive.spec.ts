import { expect, test } from "@playwright/test";

const paths = ["/contact", "/fr/contact", "/policy"] as const;

test.describe("Accessible responsive reflow", () => {
	test("reflows at 200% text and honors reduced motion on small mobile", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 320, height: 568 });
		await page.emulateMedia({ reducedMotion: "reduce" });

		for (const path of paths) {
			await page.goto(path, { waitUntil: "domcontentloaded" });
			await page.addStyleTag({
				content: "html { font-size: 200% !important; }",
			});
			await expect(page.locator("body")).toBeVisible();

			const metrics = await page.evaluate(() => {
				const maxCssTimeMs = (value: string): number =>
					Math.max(
						0,
						...value.split(",").map((part) => {
							const trimmed = part.trim();
							if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed);
							if (trimmed.endsWith("s")) return Number.parseFloat(trimmed) * 1000;
							return 0;
						}),
					);
				const motionTarget = document.querySelector(
					'a[href="#contact-details"], footer a.social-link',
				);
				const motionStyles = motionTarget
					? window.getComputedStyle(motionTarget)
					: null;
				return {
					clientWidth: document.documentElement.clientWidth,
					hasHorizontalScroll:
						document.documentElement.scrollWidth >
						document.documentElement.clientWidth,
					rootFontSize: Number.parseFloat(
						window.getComputedStyle(document.documentElement).fontSize,
					),
					scrollBehavior: window.getComputedStyle(document.documentElement)
						.scrollBehavior,
					transitionDurationMs: motionStyles
						? maxCssTimeMs(motionStyles.transitionDuration)
						: 0,
					animationDurationMs: motionStyles
						? maxCssTimeMs(motionStyles.animationDuration)
						: 0,
				};
			});

			expect(metrics.rootFontSize, `${path} should honor 200% text sizing`).toBeGreaterThanOrEqual(32);
			expect(
				metrics.hasHorizontalScroll,
				`${path} should reflow without horizontal scrolling at 200% text`,
			).toBe(false);
			expect(metrics.scrollBehavior).toBe("auto");
			expect(metrics.transitionDurationMs).toBeLessThanOrEqual(0.02);
			expect(metrics.animationDurationMs).toBeLessThanOrEqual(0.02);

			const mainBox = await page.locator("main").first().boundingBox();
			expect(mainBox?.width ?? 0).toBeLessThanOrEqual(metrics.clientWidth + 1);
			await expect(page.locator("#route-header-locale")).toBeVisible();
		}
	});
});
