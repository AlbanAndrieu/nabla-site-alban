import { expect, test } from "@playwright/test";

test.describe("Homepage Tests", () => {
	test("should load the homepage successfully", async ({ page }) => {
		await page.goto("/en");

		// Check title
		await expect(page).toHaveTitle(/Alban Andrieu/);

		// Check that the page loaded
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have correct meta tags", async ({ page }) => {
		await page.goto("/en");

		// Check meta description
		const description = page.locator('meta[name="description"]');
		await expect(description.first()).toHaveAttribute(
			"content",
			"Freelance DevSecOps engineer and cloud architect with 20+ years of experience. I help startups and enterprises secure, automate and scale AWS, Azure and OVH platforms, with a focus on AI workloads, security and compliance (ISO 27001 / SOC 2).",
		);

		// Check meta keywords (static HTML uses ", "; Next Metadata joins with "," only)
		const keywords = page.locator('meta[name="keywords"]');
		await expect(keywords).toHaveAttribute(
			"content",
			/freelance DevSecOps engineer.*freelance cloud architect.*AWS.*Azure.*OVH/,
		);

		// Check author
		const author = page.locator('meta[name="author"]');
		await expect(author).toHaveAttribute("content", /Alban Andrieu/);
	});

	test("should have Open Graph meta tags", async ({ page }) => {
		await page.goto("/en");

		// Check OG title
		const ogTitle = page.locator('meta[property="og:title"]');
		await expect(ogTitle).toHaveAttribute(
			"content",
			/Alban Andrieu — Cybersecurity & DevSecOps Engineer/,
		);

		// Check OG type
		const ogType = page.locator('meta[property="og:type"]');
		await expect(ogType).toHaveAttribute("content", /profile/);

		// Check OG description
		const ogDescription = page.locator('meta[property="og:description"]');
		await expect(ogDescription).toHaveAttribute(
			"content",
			/Cybersecurity and DevSecOps expertise for secure, automated and reliable cloud and AI platforms./,
		);
	});

	test("should have Twitter Card meta tags", async ({ page }) => {
		await page.goto("/en");

		// Next emits name="twitter:*"; static HTML used property="twitter:*"
		const twitterCard = page.locator(
			'meta[name="twitter:card"], meta[property="twitter:card"]',
		);
		await expect(twitterCard).toHaveAttribute("content", /summary/);

		const twitterTitle = page.locator(
			'meta[name="twitter:title"], meta[property="twitter:title"]',
		);
		await expect(twitterTitle).toHaveAttribute("content", /Alban Andrieu/);
	});

	test("should have correct language attribute", async ({ page }) => {
		await page.goto("/en");

		// Check html lang attribute
		const html = page.locator("html");
		await expect(html).toHaveAttribute("lang", "en");
	});

	test("should have viewport meta tag for responsive design", async ({
		page,
	}) => {
		await page.goto("/en");

		// Check viewport
		const viewport = page.locator('meta[name="viewport"]');
		await expect(viewport).toHaveAttribute("content", /width=device-width/);
	});

	test("footer copyright line uses current year and site attribution", async ({
		page,
	}) => {
		await page.goto("/en");
		const year = String(new Date().getFullYear());
		const line = page.locator("footer .footer-copyright");
		await expect(line).toContainText(year);
		await expect(line).toContainText(
			"Alban Andrieu. Independent DevSecOps Professional.",
		);
	});
});
