import { expect, test } from "@playwright/test";
import { RESOURCE_SECTIONS } from "../app/[locale]/security/securityResources";

const pages = ["/workstation.html"];

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
		await expect(page.locator("main#main-content .resource-card")).toHaveCount(
			RESOURCE_SECTIONS.length,
		);
		for (const section of RESOURCE_SECTIONS) {
			await expect(page.locator(`#${section.id}`)).toBeVisible();
		}
		await expect(page.locator("#security-visualizations")).toBeVisible();
	});
});

test.describe("native AI route", () => {
	test("legacy URL redirects to the native Secure AI page", async ({ page }) => {
		const response = await page.goto("/ai.html");
		expect(response?.ok()).toBeTruthy();
		await expect(page).toHaveURL(/\/ai$/);
		await expect(page.locator("h1")).toHaveCount(1);
		await expect(page.locator("main#main-content")).toHaveCount(1);
		await expect(page.locator("#secure-ai-platform")).toBeVisible();
		await expect(page.locator("#ai-homelab-architecture")).toBeVisible();
		await expect(page.locator("#document-pipeline")).toBeVisible();
	});
});
