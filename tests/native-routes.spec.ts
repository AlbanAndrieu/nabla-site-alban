import { expect, test } from "@playwright/test";
import { RESOURCE_SECTIONS } from "../app/[locale]/security/securityResources";

const workstationPages = [
	{
		pathname: "/workstation.html",
		locale: "en",
		heading: "Docker Compose Services",
	},
	{
		pathname: "/fr/workstation.html",
		locale: "fr",
		heading: "Services Docker Compose",
	},
] as const;

const workstationViewports = [
	{ width: 320, height: 568 },
	{ width: 375, height: 667 },
	{ width: 768, height: 1024 },
	{ width: 1024, height: 768 },
	{ width: 1440, height: 900 },
] as const;

const canonicalProductNames = ["Traefik", "Prometheus", "Dockge"] as const;

test.describe("native workstation route", () => {
	for (const { pathname, locale, heading } of workstationPages) {
		test(`${pathname} keeps native content responsive across priority viewports`, async ({
			page,
		}) => {
			const hydrationErrors: string[] = [];
			page.on("console", (message) => {
				if (message.type() === "error" && /hydrat/i.test(message.text())) {
					hydrationErrors.push(message.text());
				}
			});

			for (const viewport of workstationViewports) {
				await page.setViewportSize(viewport);
				const response = await page.goto(pathname);

				expect(response?.ok()).toBeTruthy();
				await expect(page.locator("html")).toHaveAttribute("lang", locale);
				await expect(
					page.getByRole("heading", { level: 1, name: heading }),
				).toBeVisible();
				await expect(page.locator("main#main-content")).toHaveCount(1);
				await expect(
					page.locator('a.skip-to-main[href="#main-content"]'),
				).toHaveCount(1);
				for (const productName of canonicalProductNames) {
					await expect(
						page.getByText(productName, { exact: true }).first(),
					).toBeVisible();
				}
				const width = await page.evaluate(() => ({
					scroll: document.documentElement.scrollWidth,
					client: document.documentElement.clientWidth,
				}));
				expect(width.scroll).toBeLessThanOrEqual(width.client);
			}

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
