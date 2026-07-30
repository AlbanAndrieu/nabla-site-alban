import { expect, test } from "@playwright/test";

test.describe("Startup inquiry page", () => {
  test("loads form pointing at job@ delivery endpoint", async ({ page }) => {
    await page.goto("/startup.html");

    await expect(page).toHaveTitle(/Start your project/i);
    const form = page.locator("form.startup-inquiry-form");
    await expect(form).toBeVisible();
    expect(await form.getAttribute("action")).toBe(
      "https://formsubmit.co/job@albandrieu.com",
    );
    await expect(form).toHaveAttribute("method", "post");

    await expect(page.getByLabel(/Your name/i)).toBeVisible();
    await expect(page.getByLabel(/Work email/i)).toBeVisible();
    await expect(page.getByLabel(/What do you need help with/i)).toBeVisible();
  });

  test("uses the French next-intl catalog and localized return URL", async ({
    page,
  }) => {
    await page.goto("/fr/startup.html");

    await expect(page).toHaveTitle(/Démarrer votre projet/i);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Démarrer votre projet",
    );
    await expect(page.getByLabel(/Votre nom/i)).toBeVisible();
    await expect(page.getByLabel(/Email professionnel/i)).toBeVisible();
    await expect(page.locator('input[name="_next"]')).toHaveValue(
      "https://albanandrieu.com/fr/startup-thanks.html",
    );
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
  });

  test("thank-you page reuses the global footer", async ({ page }) => {
    await page.goto("/fr/startup-thanks.html");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Merci — message reçu",
    );
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: "Mentions légales" }),
    ).toHaveCount(1);
  });
});
