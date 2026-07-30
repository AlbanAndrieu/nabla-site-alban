import { expect, test } from "@playwright/test";

const expectedSitemapUrls = [
  "https://albanandrieu.com/",
  "https://albanandrieu.com/expertise.html",
  "https://albanandrieu.com/contact.html",
  "https://albanandrieu.com/security.html",
  "https://albanandrieu.com/ai.html",
  "https://albanandrieu.com/ciso.html",
  "https://albanandrieu.com/truenas.html",
  "https://albanandrieu.com/link.html",
  "https://albanandrieu.com/email.html",
  "https://albanandrieu.com/nabla.html",
  "https://albanandrieu.com/cv",
  "https://albanandrieu.com/jm",
];

const nonIndexablePages = [
  "/ctid.html",
  "/freenas.html",
  "/workstation.html",
  "/jm/4-years-review-aandrieu",
  "/startup.html",
  "/startup-thanks.html",
  "/pricing.html",
  "/payment.html",
  "/success.html",
  "/cancel.html",
  "/checkout",
  "/checkout-tjm",
  "/login.html",
  "/test.html",
];

const indexablePages = [
  "/",
  "/expertise.html",
  "/contact.html",
  "/security.html",
  "/ai.html",
  "/ciso.html",
  "/truenas.html",
  "/link.html",
  "/email.html",
  "/nabla.html",
  "/cv",
  "/cv/index.html",
  "/jm",
];

const localizedSeoPaths = [
  "/",
  "/expertise.html",
  "/contact.html",
  "/security.html",
  "/ai.html",
  "/ciso.html",
  "/truenas.html",
  "/link.html",
  "/email.html",
  "/nabla.html",
  "/cv",
  "/jm",
] as const;

function linkAttributes(html: string) {
  return Array.from(html.matchAll(/<link\b([^>]+)>/g), ([, rawAttributes]) =>
    Object.fromEntries(
      Array.from(
        rawAttributes.matchAll(/([\w-]+)="([^"]*)"/g),
        ([, name, value]) => [
          name.toLowerCase(),
          name.toLowerCase() === "href" && value.startsWith("http")
            ? new URL(value).href
            : value,
        ],
      ),
    ),
  );
}

function hasLink(
  links: Array<Record<string, string>>,
  expected: Record<string, string>,
) {
  return links.some((link) =>
    Object.entries(expected).every(([name, value]) => link[name] === value),
  );
}

test.describe("SEO indexing policy", () => {
  test("sitemap exposes only the explicit SEO allowlist", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();

    const xml = await response.text();
    const urls = Array.from(
      xml.matchAll(/<loc>([^<]+)<\/loc>/g),
      ([, url]) => url,
    );

    expect(urls).toEqual(expectedSitemapUrls);
    expect(xml).not.toContain("/startup");
    expect(xml).not.toContain("/pricing");
    expect(xml).not.toContain("/payment");
  });

  test("every page outside the SEO allowlist is noindex", async ({
    request,
  }) => {
    for (const pathname of nonIndexablePages) {
      const response = await request.get(pathname);
      expect(response.ok(), `${pathname} should load`).toBeTruthy();
      expect(await response.text(), `${pathname} should be noindex`).toContain(
        '<meta name="robots" content="noindex, nofollow"/>',
      );
    }
  });

  test("explicit SEO pages remain indexable", async ({ request }) => {
    for (const pathname of indexablePages) {
      const response = await request.get(pathname);
      expect(response.ok(), `${pathname} should load`).toBeTruthy();
      expect(
        await response.text(),
        `${pathname} should be indexable`,
      ).not.toContain('<meta name="robots" content="noindex, nofollow"/>');
    }
  });

  test("SEO pages expose consistent canonical and hreflang links", async ({
    request,
  }) => {
    for (const locale of ["en", "fr"] as const) {
      for (const englishPath of localizedSeoPaths) {
        const frenchPath = englishPath === "/" ? "/fr" : `/fr${englishPath}`;
        const pathname = locale === "fr" ? frenchPath : englishPath;
        const canonical = pathname;
        const response = await request.get(pathname);
        expect(response.ok(), `${pathname} should load`).toBeTruthy();
        const links = linkAttributes(await response.text());
        const absoluteEnglish = `https://albanandrieu.com${englishPath}`;
        const absoluteFrench = `https://albanandrieu.com${frenchPath}`;

        expect(
          hasLink(links, {
            rel: "canonical",
            href: `https://albanandrieu.com${canonical}`,
          }),
          `${pathname} should expose its canonical; received ${JSON.stringify(
            links.filter(
              ({ rel }) => rel === "canonical" || rel === "alternate",
            ),
          )}`,
        ).toBe(true);
        for (const [hreflang, href] of [
          ["en", absoluteEnglish],
          ["fr", absoluteFrench],
          ["x-default", absoluteEnglish],
        ] as const) {
          expect(
            hasLink(links, { rel: "alternate", hreflang, href }),
            `${pathname} should expose hreflang=${hreflang}`,
          ).toBe(true);
        }
      }
    }
  });

  test("priority pages expose their structured data", async ({ request }) => {
    const cases = [
      ["/", "Person"],
      ["/expertise.html", "ProfessionalService"],
    ] as const;

    for (const [pathname, expectedType] of cases) {
      const response = await request.get(pathname);
      expect(response.ok(), `${pathname} should load`).toBeTruthy();
      const html = await response.text();
      const jsonLd = html.match(
        /<script type="application\/ld\+json">([^<]+)<\/script>/,
      )?.[1];

      expect(jsonLd, `${pathname} should expose JSON-LD`).toBeTruthy();
      expect(JSON.parse(jsonLd ?? "{}")["@type"]).toBe(expectedType);
    }
  });
});
