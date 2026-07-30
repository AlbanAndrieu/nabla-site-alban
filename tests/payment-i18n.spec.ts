import { expect, test } from "@playwright/test";

test("payment flow uses the French next-intl catalog", async ({ page }) => {
  const cases = [
    ["/fr/checkout", "Paiement"],
    ["/fr/payment.html", "Options de paiement"],
    ["/fr/cancel.html", "Paiement annulé"],
    ["/fr/success.html", "Paiement en cours de vérification"],
  ] as const;

  for (const [pathname, heading] of cases) {
    await page.goto(pathname);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
  }
});
