import { expect, test } from "@playwright/test";

const pages = ["/ai.html", "/workstation.html"];

test.describe("transitional public HTML fragments", () => {
	for (const pathname of pages) {
		test(`${pathname} keeps one accessible document structure`, async ({
			page,
		}) => {
			const hydrationErrors: string[] = [];
			page.on("console", (message) => {
				if (message.type() === "error" && /hydrat/i.test(message.text())) {
					hydrationErrors.push(message.text());
				}
			});

			const response = await page.goto(pathname);

			expect(response?.ok()).toBeTruthy();
			await expect(page.locator("h1")).toHaveCount(1);
			await expect(page.locator("main#main-content")).toHaveCount(1);
			await expect(
				page.locator('a.skip-to-main[href="#main-content"]'),
			).toHaveCount(1);
			expect(hydrationErrors).toEqual([]);
		});
	}
});

test.describe("native security route", () => {
	test("legacy URL redirects to the complete React resource directory", async ({
		page,
	}) => {
		const response = await page.goto("/security.html");

		expect(response?.ok()).toBeTruthy();
		await expect(page).toHaveURL(/\/security$/);
		await expect(page.locator("main#main-content .resource-card")).toHaveCount(16);
		await expect(page.locator("#openclaw-security")).toBeVisible();
		await expect(page.locator("#security-standards-compliance")).toBeVisible();
		await expect(page.locator("#devsecops-tools")).toBeVisible();
		await expect(page.locator("#security-visualizations")).toBeVisible();
	});
});
