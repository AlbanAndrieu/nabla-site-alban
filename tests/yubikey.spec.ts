import { expect, test } from "@playwright/test";

// Public, read-only UI checks. Run locally against a matching exact-SHA Preview:
// BASE_URL=https://<preview-host> npx playwright test tests/yubikey.spec.ts --project=chromium
// For protected previews, use the existing Playwright config's bypass settings.
for (const locale of ["fr", "en"] as const) {
  const path = `${locale === "fr" ? "/fr" : ""}/security/yubikey`;
  const homePath = locale === "fr" ? "/fr" : "/";
  const graphListLabel = locale === "fr"
    ? "Liste accessible des relations du diagramme"
    : "Accessible list of diagram relationships";
  const backupLabel = locale === "fr" ? "YubiKey secondaire" : "Backup YubiKey";

  test.describe(`YubiKey Security (${locale})`, () => {
    test("renders localized content, metadata and 14 sourced examples", async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator(".page-security header h1")).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href", new RegExp(`${path}import { expect, test } from "@playwright/test";

// Public, read-only UI checks. Run locally against a matching exact-SHA Preview:
// BASE_URL=https://<preview-host> npx playwright test tests/yubikey.spec.ts --project=chromium
// For protected previews, use the existing Playwright config's bypass settings.
for (const locale of ["fr", "en"] as const) {
  const path = `${locale === "fr" ? "/fr" : ""}/security/yubikey`;
  const homePath = locale === "fr" ? "/fr" : "/";
  const graphListLabel = locale === "fr"
    ? "Liste accessible des relations du diagramme"
    : "Accessible list of diagram relationships";
  const backupLabel = locale === "fr" ? "YubiKey secondaire" : "Backup YubiKey";

  test.describe(`YubiKey Security (${locale})`, () => {
    test("renders localized content, metadata and 14 sourced examples", async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator(".page-security header h1")).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
)
      );
      const cases = page.locator('#yubikey-use-cases article[id^="yubikey-use-"]');
      await expect(cases).toHaveCount(14);
      await expect(cases.locator('a[href^="https://"]')).toHaveCount(14);
      await expect(page.locator("#yubikey-glossary article")).toHaveCount(25);
      await expect(page.locator("#yubikey-graph-title")).toBeVisible();
      await expect(page.locator("#yubikey-use-cases")).toBeVisible();
    });

    test("supports keyboard graph selection and shared footer controls", async ({ page }) => {
      await page.goto(path);
      const selector = page.getByRole("group", { name: graphListLabel });
      const backup = selector.getByRole("button", { name: backupLabel });
      await expect(backup).toBeVisible();
      await backup.focus();
      await expect(backup).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(backup).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator('section[aria-labelledby="yubikey-graph-title"] [aria-live="polite"]')).toContainText(backupLabel);

      const footer = page.locator('footer[role="contentinfo"]');
      const home = footer.locator(`a[href="${homePath}"]:has(i.fa-home)`);
      const top = footer.locator("button:has(i.fa-arrow-up)");
      await expect(home).toBeVisible();
      await expect(top).toBeVisible();
      await page.locator("#yubikey-next").scrollIntoViewIfNeeded();
      await top.click();
      await expect(page).toHaveURL(/#top$/);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
    });

    test("keeps graph, footer and cards within narrow mobile viewports", async ({ page }) => {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 700 });
        await page.goto(path);
        await expect(page.locator("#yubikey-use-cases")).toBeVisible();
        const dimensions = await page.evaluate(() => ({
          client: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        expect(dimensions.scroll, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.client + 1);
        const selectors = page.getByRole("group", { name: graphListLabel }).getByRole("button");
        await expect(selectors).toHaveCount(11);
        const first = await selectors.first().boundingBox();
        expect(first?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
    });
  });
}
