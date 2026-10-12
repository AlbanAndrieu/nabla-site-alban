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


test("CTID displays a priority digest with collapsible detail and service links", async ({ page }) => {
	await page.route("**/api/ciso/threat-feed", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				mode: "freshrss",
				items: Array.from({ length: 12 }, (_, index) => ({
					title: index % 2 === 0 ? `PostgreSQL CVE-2026-${2000 + index}` : `Global threat research note ${index}`,
					link: `https://example.org/advisory/${index}`,
					source: "CERT",
					summary: `Article context for signal ${index}`,
				})),
			}),
		});
	});
	await page.goto("/fr/ctid");
	await expect(page.getByRole("heading", { name: /Signaux concernant la stack Nabla/ })).toBeVisible();
	await expect(page.getByRole("heading", { name: /Cybermenaces et actualités mondiales/ })).toBeVisible();
	await expect(page.getByRole("heading", { name: /Autres vulnérabilités et actualités/ })).toBeVisible();
	await expect(page.locator("article")).toHaveCount(12);
	await expect(page.getByRole("link", { name: /S'abonner au RSS sécurité/ })).toHaveAttribute("href", "/security-feed.xml");
	await page.locator("article details").first().locator("summary").click();
	await expect(page.getByRole("link", { name: /Voir le service dans TrueNAS/ }).first()).toHaveAttribute("href", "/fr/truenas#homelab-service-postgresql");
});

test("CISO shows DORA scope disclaimer and CTID navigation", async ({ page }) => {
	await page.goto("/fr/ciso");
	await expect(page.getByRole("heading", { name: /DORA/ })).toBeVisible();
	await expect(page.getByRole("link", { name: /Dix signaux prioritaires/ })).toHaveAttribute("href", "/fr/ctid");
	await expect(page.getByRole("link", { name: "Flux RSS sécurité" })).toHaveAttribute("href", "/security-feed.xml");
});
