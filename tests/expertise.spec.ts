import { expect, test } from "@playwright/test";

test.describe("Expertise page", () => {
  test("loads and exposes services and skills sections", async ({ page }) => {
    await page.goto("/expertise.html");

    await expect(page).toHaveTitle(/Services & technical expertise/i);
    await expect(
      page.getByRole("heading", { name: /Services I Offer/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Technical expertise/i }),
    ).toBeVisible();
    await expect(page.locator("#services")).toBeVisible();
    await expect(page.locator("#skills")).toBeVisible();
  });

  test("renders the French catalog and a single primary heading", async ({
    page,
  }) => {
    await page.goto("/fr/expertise.html");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Votre partenaire de confiance pour l’IA et le cloud",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Services proposés" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Expertise technique", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Voir tous les formats de CV" }),
    ).toHaveAttribute("href", "/fr/cv");
  });
});
