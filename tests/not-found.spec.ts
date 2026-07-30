import { expect, test } from "@playwright/test";

test.describe("localized not-found page", () => {
  test("unknown root slug uses the custom 404 and shared analytics", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    const response = await page.goto("/toto");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "404" }),
    ).toBeVisible();
    await expect(page.getByText("We're fairly sure that page")).toBeVisible();
    await expect(page.locator(".cloak__wrapper")).toBeVisible();
    expect(await page.locator("style").allTextContents()).toEqual(
      expect.arrayContaining([expect.stringContaining("--swing-x")]),
    );
    await expect(page.getByRole("link", { name: "Back to home" })).toHaveClass(
      /text-decoration-none/,
    );
    await expect(page.locator('script[src="/site-analytics.js"]')).toHaveCount(
      1,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    expect(consoleErrors.filter((message) => /hydrat/i.test(message))).toEqual(
      [],
    );
  });

  test("unknown localized slug uses the same global 404", async ({ page }) => {
    const response = await page.goto("/fr/toto");

    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute(
      "data-nabla-app",
      "next-global-not-found",
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "404" }),
    ).toBeVisible();
  });
});
