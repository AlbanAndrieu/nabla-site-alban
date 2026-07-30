import { expect, test } from "@playwright/test";

test.describe("pricing localization", () => {
  const cases = [
    {
      pathname: "/pricing.html",
      heading: "Consulting pricing & engagement options",
      tiersLabel: "Engagement tiers",
    },
    {
      pathname: "/fr/pricing.html",
      heading: "Tarifs et modes d’engagement",
      tiersLabel: "Modes d’engagement",
    },
  ] as const;

  for (const { pathname, heading, tiersLabel } of cases) {
    test(`${pathname} uses its next-intl catalog`, async ({ page }) => {
      await page.goto(pathname);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(
        page.getByRole("region", { name: tiersLabel }),
      ).toBeVisible();
    });
  }
});
