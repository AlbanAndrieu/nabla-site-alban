import { expect, type Page, test } from "@playwright/test";

async function _injectSiteAnalytics(
  page: Page,
  attrs: Record<string, string> = {},
) {
  await page.evaluate((injectedAttrs) => {
    const script = document.createElement("script");
    script.src = "/site-analytics.js";
    script.setAttribute("data-test-injected", "true");
    Object.entries(injectedAttrs).forEach(([name, value]) => {
      script.setAttribute(name, value);
    });
    document.head.appendChild(script);
  }, attrs);
}

test.describe("Site analytics loader regression tests", () => {
  test("should load default vercel analytics scripts and expose API", async ({
    page,
  }) => {
    // Root `*.html` slugs are rewritten to App Router content pages without
    // the original `<head>` scripts; use static `/404.html` (default `vercel` analytics mode).
    await page.goto("/404.html?nablaEnableThirdParty=1");

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return typeof (window as any).NABLA_SITE_ANALYTICS?.initGtm;
        });
      })
      .toBe("function");

    // Browsers may normalize script src to an absolute URL; match by path suffix
    await expect(
      page.locator('script[src*="/_vercel/insights/script.js"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('script[src*="/_vercel/speed-insights/script.js"]'),
    ).toHaveCount(1);
  });

  test("should keep GTM and gtag init idempotent", async ({ page }) => {
    // Home uses data-analytics-mode="home" and already injects GTM/gtag; use vercel-only page.
    // Same rewrite caveat as above: prefer static `/404.html` over marketed `/expertise.html`.
    await page.goto("/404.html");

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return typeof (window as any).NABLA_SITE_ANALYTICS?.initGtm;
        });
      })
      .toBe("function");

    const before = await page.evaluate(() => {
      return {
        gtm: document.querySelectorAll(
          'script[src*="googletagmanager.com/gtm.js?id="]',
        ).length,
        gtag: document.querySelectorAll(
          'script[src*="googletagmanager.com/gtag/js?id="]',
        ).length,
      };
    });

    await page.evaluate(() => {
      const api = (window as any).NABLA_SITE_ANALYTICS;
      api.initGtm("GTM-TEST123");
      api.initGtm("GTM-TEST123");
      api.initGtag("G-TEST123");
      api.initGtag("G-TEST123");
    });

    const after = await page.evaluate(() => {
      return {
        gtm: document.querySelectorAll(
          'script[src*="googletagmanager.com/gtm.js?id="]',
        ).length,
        gtag: document.querySelectorAll(
          'script[src*="googletagmanager.com/gtag/js?id="]',
        ).length,
      };
    });

    // init* can be a no-op if scripts are already loaded; idempotence means never duplicating.
    expect(after.gtm).toBe(Math.max(1, before.gtm));
    expect(after.gtag).toBe(Math.max(1, before.gtag));
  });

  test("should load Ahrefs script when key is provided", async ({ page }) => {
    await page.goto("/404.html?nablaEnableThirdParty=1");
    await _injectSiteAnalytics(page, {
      "data-ahrefs-key": "tg3zLMS/bebJFl0LxctiCw",
    });

    const ahrefs = page.locator(
      'script[src*="analytics.ahrefs.com/analytics.js"][data-key]',
    );
    await expect(ahrefs).toHaveCount(1);
    await expect(ahrefs).toHaveAttribute("data-key", "tg3zLMS/bebJFl0LxctiCw");
  });
});
