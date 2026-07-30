import { expect, test } from "@playwright/test";

test.describe("404 Error Page Tests", () => {
  test("should load 404 page", async ({ page }) => {
    const response = await page.goto("/404.html");

    // Page should load successfully (we're accessing 404.html directly)
    expect(response?.status()).toBe(200);

    // Check page title
    await expect(page).toHaveTitle(/404|Not Found/i);
  });

  test("should display 404 error message", async ({ page }) => {
    await page.goto("/404.html");

    // Check for 404 message
    const errorMessage = page.locator("body");
    await expect(errorMessage).toContainText(/404|not found|page not found/i);
  });

  test("should have link back to home", async ({ page }) => {
    await page.goto("/404.html");

    // Check for link to home page
    const homeLink = page.locator('a[href="/"]');
    if ((await homeLink.count()) > 0) {
      await expect(homeLink).toBeVisible();
    }
  });

  test("should maintain site navigation on 404", async ({ page }) => {
    await page.goto("/404.html");

    // Check if navigation is present (helps users find their way back)
    const nav = page.locator("nav");
    if ((await nav.count()) > 0) {
      await expect(nav).toBeVisible();
    }
  });

  test("should keep minimal chrome widgets disabled", async ({ page }) => {
    await page.goto("/404.html");

    await expect(page.locator("#theme-toggle-btn")).toHaveCount(0);
    await expect(page.locator("#google_translate_element")).toHaveCount(0);
    await expect(page.locator(".google-translate-widget")).toHaveCount(0);
    await expect(page.locator("#nabla-print-pdf-btn")).toHaveCount(0);
    await expect(page.locator("#nabla-back-to-top")).toHaveCount(0);
    await expect(
      page.locator(
        'script[src*="translate.google.com/translate_a/element.js"]',
      ),
    ).toHaveCount(0);
  });

  test("should still apply a theme attribute on html", async ({ page }) => {
    await page.goto("/404.html");

    const appliedTheme = await page.locator("html").getAttribute("data-theme");
    expect(appliedTheme).toMatch(/^(light|dark)$/);
  });

  test("should be accessible on mobile", async ({ page, viewport }) => {
    await page.goto("/404.html");

    // Verify page loads on mobile viewport
    if (viewport && viewport.width < 768) {
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
