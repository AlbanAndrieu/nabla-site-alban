import { expect, test } from "@playwright/test";

test.describe("Expertise page", () => {
	test("loads and exposes services and skills sections", async ({ page }) => {
		await page.goto("/expertise.html");

		await expect(page).toHaveTitle(/Services & technical expertise/i);
		await expect(
			page.getByRole("heading", { name: /Services I Offer/i }),
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Technical expertise/i }),
		).toBeVisible();
		await expect(page.locator("#services")).toBeVisible();
		await expect(page.locator("#skills")).toBeVisible();
	});
});
