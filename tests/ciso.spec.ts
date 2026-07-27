// tests/ciso.spec.ts

import { expect, test } from "@playwright/test";

test.describe("CISO Dashboard", () => {
	test("should render /en/ciso and contain heading", async ({ page }) => {
		await page.goto("/en/ciso");
		await expect(page).toHaveURL(/en\/ciso/);
		await expect(page.locator("h1")).toHaveText(/CISO Dashboard/i);
		await expect(page).toHaveTitle(/CISO Dashboard/i);
	});

	test("should render /fr/ciso and contain heading", async ({ page }) => {
		await page.goto("/fr/ciso");
		await expect(page).toHaveURL(/fr\/ciso/);
		await expect(page.locator("h1")).toHaveText(/Tableau de bord RSSI/i);
		await expect(page).toHaveTitle(/Tableau de bord RSSI/i);
	});
});
