import { expect, test } from "@playwright/test";

test.describe("Homepage Tests", () => {
	test("should load the homepage successfully", async ({ page }) => {
		await page.goto("/");

		// Check title
		await expect(page).toHaveTitle(/Alban Andrieu/);

		// Check that the page loaded
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have correct meta tags", async ({ page }) => {
		await page.goto("/");

		// Check meta description
		const description = page.locator('meta[name="description"]');
		await expect(description).toHaveAttribute(
			"content",
			/Freelance DevSecOps engineer and cloud architect with 20\+ years/,
		);

		// Check meta keywords
		const keywords = page.locator('meta[name="keywords"]');
		await expect(keywords).toHaveAttribute(
			"content",
			/freelance DevSecOps engineer, freelance cloud architect, AWS, Azure, OVH/,
		);

		// Check author
		const author = page.locator('meta[name="author"]');
		await expect(author).toHaveAttribute("content", /Alban Andrieu/);
	});

	test("should have Open Graph meta tags", async ({ page }) => {
		await page.goto("/");

		// Check OG title
		const ogTitle = page.locator('meta[property="og:title"]');
		await expect(ogTitle).toHaveAttribute(
			"content",
			/Alban Andrieu — Freelance DevSecOps/,
		);

		// Check OG type
		const ogType = page.locator('meta[property="og:type"]');
		await expect(ogType).toHaveAttribute("content", /profile/);

		// Check OG description
		const ogDescription = page.locator('meta[property="og:description"]');
		await expect(ogDescription).toHaveAttribute(
			"content",
			/Freelance DevSecOps and cloud architect/,
		);
	});

	test("should have Twitter Card meta tags", async ({ page }) => {
		await page.goto("/");

		// Check Twitter card
		const twitterCard = page.locator('meta[property="twitter:card"]');
		await expect(twitterCard).toHaveAttribute("content", /summary/);

		// Check Twitter title
		const twitterTitle = page.locator('meta[property="twitter:title"]');
		await expect(twitterTitle).toHaveAttribute("content", /Alban Andrieu/);
	});

	test("should have correct language attribute", async ({ page }) => {
		await page.goto("/");

		// Check html lang attribute
		const html = page.locator("html");
		await expect(html).toHaveAttribute("lang", "en");
	});

	test("should have viewport meta tag for responsive design", async ({
		page,
	}) => {
		await page.goto("/");

		// Check viewport
		const viewport = page.locator('meta[name="viewport"]');
		await expect(viewport).toHaveAttribute("content", /width=device-width/);
	});

	test("footer copyright line uses current year and site attribution", async ({
		page,
	}) => {
		await page.goto("/");
		const year = String(new Date().getFullYear());
		const line = page.locator("footer .footer-copyright");
		await expect(line).toContainText(year);
		await expect(line).toContainText(
			"Alban Andrieu. Independent DevSecOps Professional.",
		);
	});
});
