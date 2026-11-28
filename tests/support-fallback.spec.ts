import { expect, test } from "@playwright/test";
import en from "../messages/en.json" with { type: "json" };
import fr from "../messages/fr.json" with { type: "json" };

// The assistant backend (OpenWebUI on the homelab) is not reachable from tests:
// both support APIs are mocked so only the browser fallback path is exercised.
const cases = [
	["/support", en.supportPage.chat],
	["/fr/support", fr.supportPage.chat],
] as const;

for (const [pathname, copy] of cases) {
	test(`support fallback reaches a human on ${pathname}`, async ({ page }) => {
		await page.route("**/api/support-chat", (route) =>
			route.fulfill({ status: 503, body: "" }),
		);
		await page.route("**/api/support-contact", (route) =>
			route.fulfill({ status: 502, body: "" }),
		);
		await page.goto(pathname);

		const human = page.locator("details", { hasText: copy.humanTitle });
		await expect(human).not.toHaveAttribute("open");

		const question = page.getByLabel(copy.inputLabel);
		// A fill before hydration (seen on WebKit) never reaches React state, and
		// refilling the same value fires no change: clear, then retry.
		await expect(async () => {
			await question.fill("");
			await question.fill("Pricing?");
			await expect(page.getByRole("button", { name: copy.send })).toBeEnabled({
				timeout: 1_000,
			});
		}).toPass();
		await question.press("Enter");

		await expect(
			page.getByRole("alert").filter({ hasText: copy.unavailable }),
		).toBeVisible();
		await expect(human).toHaveAttribute("open");
		// The question stays in the log; the empty assistant placeholder is dropped.
		await expect(
			page.getByRole("list", { name: copy.logLabel }).getByRole("listitem"),
		).toHaveCount(1);

		await page.getByLabel(copy.messageLabel).fill("Please call me back.");
		await page.getByRole("button", { name: copy.humanSend }).click();
		await expect(
			human.getByRole("link", { name: "openclaw@albandrieu.com" }),
		).toHaveAttribute("href", "mailto:openclaw@albandrieu.com");
	});
}
