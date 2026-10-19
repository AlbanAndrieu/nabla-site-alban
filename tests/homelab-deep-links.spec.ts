import { expect, test } from "@playwright/test";

// Historical operational deep links are intentionally no longer rendered
// anonymously. The owner-only deep-link suite belongs on ops.albandrieu.com.
test.describe("public homelab deep-link privacy", () => {
	for (const [path, panel] of [
		["/en/truenas#service-langflow", "#service-langflow"],
		["/fr/truenas#pfsense-operational-evidence", "#pfsense-operational-evidence"],
	] as const) {
		test(`does not reveal private panel ${panel}`, async ({ page }) => {
			await page.goto(path);
			await expect(page.locator("#truenas-services")).toBeVisible();
			await expect(page.locator(panel)).toHaveCount(0);
			await expect(
				page.locator('a[href="https://ops.albandrieu.com/"]').first(),
			).toBeVisible();
		});
	}
});
