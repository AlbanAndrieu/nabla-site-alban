// tests/ciso.spec.ts

import { expect, test } from "@playwright/test";

test.describe("CISO Dashboard", () => {
	const cases = [
		{
			pathname: "/ciso",
			heading: "CISO Dashboard",
			status: "In progress",
		},
		{
			pathname: "/fr/ciso",
			heading: "Tableau de bord RSSI",
			status: "En cours",
		},
	] as const;

	for (const { pathname, heading, status } of cases) {
		test(`${pathname} uses its next-intl catalog`, async ({ page }) => {
			await page.goto(pathname);
			await expect(page).toHaveURL(new RegExp(`${pathname}$`));
			await expect(page.getByRole("heading", { level: 1 })).toContainText(
				heading,
			);
			await expect(page).toHaveTitle(new RegExp(heading, "i"));
			await expect(page.getByText(status, { exact: true })).toBeVisible();
		});
	}
});
