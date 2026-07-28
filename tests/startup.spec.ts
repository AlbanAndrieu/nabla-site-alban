import { expect, test } from "@playwright/test";

test.describe("Startup inquiry page", () => {
	test("loads form pointing at job@ delivery endpoint", async ({ page }) => {
		await page.goto("/startup.html");

		await expect(page).toHaveTitle(/Start your project/i);
		const form = page.locator("form.startup-inquiry-form");
		await expect(form).toBeVisible();
		expect(await form.getAttribute("action")).toBe(
			"https://formsubmit.co/job@albandrieu.com",
		);
		await expect(form).toHaveAttribute("method", "post");

		await expect(page.getByLabel(/Your name/i)).toBeVisible();
		await expect(page.getByLabel(/Work email/i)).toBeVisible();
		await expect(page.getByLabel(/What do you need help with/i)).toBeVisible();
	});
});
