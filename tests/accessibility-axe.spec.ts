import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const localizedRoutePairs = [
	["/", "/fr"],
	["/contact", "/fr/contact"],
	["/policy", "/fr/policy"],
	["/security", "/fr/security"],
] as const;

test.describe("axe accessibility audit EN/FR", () => {
	for (const [englishRoute, frenchRoute] of localizedRoutePairs) {
		for (const route of [englishRoute, frenchRoute]) {
			test(`${route} has no WCAG A/AA axe violations`, async ({ page }) => {
				await page.goto(route, { waitUntil: "networkidle" });
				await expect(page.locator("main#main-content")).toHaveCount(1);

				const results = await new AxeBuilder({ page })
					.withTags([
						"wcag2a",
						"wcag2aa",
						"wcag21a",
						"wcag21aa",
						"wcag22aa",
					])
					.analyze();

				expect(
					results.violations,
					results.violations
						.map(
							(violation) =>
								`${violation.id} [${violation.impact ?? "unknown"}]: ${violation.help}`,
						)
						.join("\n"),
				).toEqual([]);
			});
		}
	}
});
