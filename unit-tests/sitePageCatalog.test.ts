import assert from "node:assert/strict";
import test from "node:test";

import sitemap from "../app/sitemap";
import {
  canonicalPagePath,
  PAGE_CATEGORIES,
  pageAlternates,
  SEO_PAGE_SLUGS,
  SITE_PAGES,
} from "../lib/sitePageCatalog";

const expectedSeoSlugs = [
  "index",
  "expertise",
  "contact",
  "security",
  "ai",
  "ciso",
  "truenas",
  "link",
  "email",
  "nabla",
  "cv",
  "jm",
];

test("SEO allowlist contains only the intentionally indexed pages", () => {
  assert.deepEqual([...SEO_PAGE_SLUGS], expectedSeoSlugs);
  assert.equal(sitemap().length, expectedSeoSlugs.length);
});

test("page alternates expose canonical, localized and default routes", () => {
  assert.deepEqual(pageAlternates("security", "fr"), {
    canonical: "/fr/security.html",
    languages: {
      en: "/security.html",
      fr: "/fr/security.html",
      "x-default": "/security.html",
    },
  });
});

test("technical pages stay outside the sitemap", () => {
  const urls = sitemap().map(({ url }) => url);

  for (const slug of PAGE_CATEGORIES.technicalFlow) {
    assert.equal(
      urls.some((url) => url.includes(`/${slug}`)),
      false,
    );
  }
});

test("every catalog page belongs to exactly one derived category", () => {
  const categorizedSlugs = Object.values(PAGE_CATEGORIES).flat();

  assert.equal(categorizedSlugs.length, Object.keys(SITE_PAGES).length);
  assert.equal(new Set(categorizedSlugs).size, categorizedSlugs.length);
});

test("sitemap uses localized canonical URLs", () => {
  assert.equal(canonicalPagePath("index", "en"), "/");
  assert.equal(canonicalPagePath("index", "fr"), "/fr");
  assert.equal(canonicalPagePath("expertise", "en"), "/expertise.html");
  assert.equal(canonicalPagePath("expertise", "fr"), "/fr/expertise.html");
  assert.equal(canonicalPagePath("cv", "en"), "/cv");
  assert.equal(canonicalPagePath("cv", "fr"), "/fr/cv");
  assert.equal(canonicalPagePath("jm", "en"), "/jm");
  assert.equal(canonicalPagePath("jm", "fr"), "/fr/jm");
});
