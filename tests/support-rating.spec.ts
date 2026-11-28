import { expect, test } from "@playwright/test";
import en from "../messages/en.json" with { type: "json" };
import fr from "../messages/fr.json" with { type: "json" };

const cases = [
	["/support", en.supportPage.chat],
	["/fr/support", fr.supportPage.chat],
] as const;

for (const [pathname, copy] of cases) {
	test("support answer shows clickable citations and accepts thumbs up on " + pathname, async ({ page }) => {
		await page.route("**/api/support-chat", (route) =>
			route.fulfill({
				status: 200,
				contentType: "text/plain; charset=utf-8",
				headers: {
					"X-Support-Trace-Id": "0123456789abcdef0123456789abcdef",
					"X-Support-Feedback-Token": "mock-feedback-token",
					"Content-Type": "text/plain; charset=utf-8",
				},
				body: "Read [Pricing](https://www.albanandrieu.com/fr/pricing). [X](https://evil.example)",
			}),
		);
		let ratingSent = false;
		await page.route("**/api/support-feedback", async (route) => {
			const json = route.request().postDataJSON();
			expect(json.traceId).toBe("0123456789abcdef0123456789abcdef");
			expect(json.token).toBe("mock-feedback-token");
			expect(json.relevant).toBe(true);
			ratingSent = true;
			await route.fulfill({ status: 202, contentType: "application/json", body: '{"status":"recorded"}' });
		});
		await page.goto(pathname);
		const question = page.getByLabel(copy.inputLabel);
		await expect(async () => {
			await question.fill("");
			await question.fill("How much?");
			await expect(page.getByRole("button", { name: copy.send })).toBeEnabled({ timeout: 1_000 });
		}).toPass();
		await question.press("Enter");
		const chatLog = page.getByRole("list", { name: copy.logLabel });
		await expect(chatLog.getByRole("link", { name: "Pricing" })).toHaveAttribute(
			"href", "https://www.albanandrieu.com/fr/pricing",
		);
		await expect(chatLog.getByRole("link", { name: "X" })).toHaveCount(0);
		await expect(chatLog).toContainText("[X](https://evil.example)");
		const thumbsUp = chatLog.getByRole("button", {
			name: copy.ratingHelpful,
			exact: true,
		});
		await expect(thumbsUp).toBeEnabled();
		await thumbsUp.click();
		await expect(page.getByRole("status").filter({ hasText: copy.ratingRecorded })).toBeVisible();
		expect(ratingSent).toBe(true);
	});
}
