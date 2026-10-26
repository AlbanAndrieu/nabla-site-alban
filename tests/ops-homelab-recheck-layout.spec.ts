import { expect, test, type Page } from "@playwright/test";

// Only run against an authenticated private environment. No IP, JWT, or
// Cloudflare Access policy is forged here: every access GET reaches the origin.
test.use({ baseURL: process.env.OPS_BASE_URL ?? "https://ops.albandrieu.com" });

async function verifyRecheckLayout(page: Page, routePath: string, selector: string) {
  let checks = 0;
  await page.route("**/api/homelab-access", async (route) => {
    checks += 1;
    if (checks > 1) await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });

  await page.goto(routePath);
  const region = page.locator(selector);
  await expect(region).toBeVisible({ timeout: 15000 });
  await expect.poll(() => region.evaluate((element) => Math.ceil(element.getBoundingClientRect().height)))
    .toBeGreaterThan(0);

  for (let cycle = 0; cycle < 2; cycle += 1) {
    const priorHeight = await region.evaluate((element) =>
      Math.ceil(element.getBoundingClientRect().height));
    // Observe the viewport inside the service area, not just at scrollY=0.
    await region.evaluate((element) => {
      const position = window.scrollY + element.getBoundingClientRect().top;
      window.scrollTo(0, position + Math.min(240, element.getBoundingClientRect().height / 3));
    });
    const beforeScroll = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(2300);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));

    const placeholder = page.locator(
      routePath.includes("truenas")
        ? ".homelab-services-section [data-homelab-access-rechecking]"
        : "[data-homelab-access-rechecking]",
    ).first();

    await expect(placeholder).toBeVisible({ timeout: 5000 });
    await expect(region).toHaveCount(0);
    const reservedHeight = await placeholder.evaluate((element) =>
      Math.ceil(element.getBoundingClientRect().height));
    expect(reservedHeight).toBeGreaterThanOrEqual(priorHeight - 5);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - beforeScroll))
      .toBeLessThanOrEqual(24);

    await expect(region).toBeVisible({ timeout: 15000 });
    await expect(placeholder).toHaveCount(0);
  }
}

test.describe("authenticated private layout revalidation", () => {
  test.skip(process.env.OPS_E2E_ENABLED !== "YES",
    "NOT_RUN: requires real private owner network or Access identity");

  test("TrueNAS retains scroll geometry across two access rechecks", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await verifyRecheckLayout(page, "/fr/truenas",
      ".homelab-services-section [data-homelab-access-region]");
  });

  test("Architecture retains scroll geometry across two access rechecks", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await verifyRecheckLayout(page, "/fr/architecture",
      "[data-homelab-access-region]");
  });
});
