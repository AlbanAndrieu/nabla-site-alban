// tests/ciso.spec.ts

import { expect, test } from "@playwright/test";

test.describe("CISO Dashboard", () => {
	const cases = [
		{
			pathname: "/ciso",
			heading: "CISO Dashboard",
			status: "In progress",
		},
		{
			pathname: "/fr/ciso",
			heading: "Tableau de bord RSSI",
			status: "En cours",
		},
	] as const;

	for (const { pathname, heading, status } of cases) {
		test(`${pathname} uses its next-intl catalog`, async ({ page }) => {
			await page.goto(pathname);
			await expect(page).toHaveURL(new RegExp(`${pathname}$`));
			await expect(page.getByRole("heading", { level: 1 })).toContainText(
				heading,
			);
			await expect(page).toHaveTitle(new RegExp(heading, "i"));
			await expect(page.getByText(status, { exact: true })).toBeVisible();
		});
	}
});

test("CISO feed correlates public headlines with stack hints, without declaring a finding", async ({ page }) => {
  await page.route("**/api/ciso/threat-feed", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        mode: "freshrss",
        items: [
          {
            title: "Kubernetes CVE-2026-12345 vulnerability",
            link: "https://example.org/security/k8s",
            source: "CERT",
            summary: "<p>Upstream security advisory for Kubernetes.</p>",
            pubDate: "2026-10-11T09:00:00Z",
          },
          {
            title: "Security industry roundup",
            link: "https://example.org/security/general",
            source: "News",
            pubDate: "2026-10-10T09:00:00Z",
          },
        ],
      }),
    });
  });
  await page.goto("/fr/ciso");
  await expect(page.locator(".ciso-feed-item")).toHaveCount(1);
  await expect(page.locator(".ciso-feed-tag")).toContainText(["Kubernetes"]);
  await expect(page.locator(".ciso-feed-disclaimer")).toContainText("non preuve");
  await page.getByRole("button", { name: "Tous les articles" }).click();
  await expect(page.locator(".ciso-feed-item")).toHaveCount(2);
  await page.getByRole("searchbox").fill("roundup");
  await expect(page.locator(".ciso-feed-item")).toHaveCount(1);
  await expect(page.getByText("Security industry roundup")).toBeVisible();
});
