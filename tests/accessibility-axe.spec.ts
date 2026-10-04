import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const localizedRoutePairs = [
	["/", "/fr"],
	["/contact", "/fr/contact"],
	["/policy", "/fr/policy"],
	["/security", "/fr/security"],
	["/architecture", "/fr/architecture"],
	["/truenas", "/fr/truenas"],
	["/nabla", "/fr/nabla"],
] as const;

function formatViolations(
	violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
): string {
	return violations
		.map((violation) => {
			const nodes = violation.nodes.slice(0, 4).map((node) => {
				const message = [...node.any, ...node.all, ...node.none]
					.map((check) => check.message)
					.filter(Boolean)
					.join("; ");
				return `${node.target.join(" ")} => ${message}`;
			});
			const overflow =
				violation.nodes.length > 4 ? ` (+${violation.nodes.length - 4} more)` : "";

			return `${violation.id} [${violation.impact ?? "unknown"}] ${violation.help} :: ${nodes.join(" | ")}${overflow}`;
		})
		.join("\n");
}

test.describe("axe accessibility audit EN/FR", () => {
	for (const [englishRoute, frenchRoute] of localizedRoutePairs) {
		for (const route of [englishRoute, frenchRoute]) {
			test(`${route} has no WCAG A/AA axe violations`, async ({ page }) => {
				await page.emulateMedia({ reducedMotion: "reduce" });
				await page.goto(route, { waitUntil: "domcontentloaded" });
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

				if (results.violations.length > 0) {
					throw new Error(formatViolations(results.violations));
				}
			});
		}
	}
});
