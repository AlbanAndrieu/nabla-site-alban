#!/usr/bin/env node

const CANONICAL_ORIGIN = "https://www.albanandrieu.com";

const ROUTES = [
  { path: "/", canonical: "/", en: "/", fr: "/fr" },
  { path: "/fr", canonical: "/fr", en: "/", fr: "/fr" },
  { path: "/truenas", canonical: "/truenas", en: "/truenas", fr: "/fr/truenas" },
  { path: "/fr/truenas", canonical: "/fr/truenas", en: "/truenas", fr: "/fr/truenas" },
  { path: "/architecture", canonical: "/architecture", en: "/architecture", fr: "/fr/architecture" },
  { path: "/fr/architecture", canonical: "/fr/architecture", en: "/architecture", fr: "/fr/architecture" },
];

function normalizedBaseUrl(value) {
  const url = new URL(value);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.href.replace(/\/$/, "");
}

function absoluteCanonical(pathname) {
  return new URL(pathname, CANONICAL_ORIGIN).href.replace(/\/$/, pathname === "/" ? "/" : "");
}

function linkHref(html, rel, hreflang) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const relMatch = tag.match(/\brel=["']([^"']+)["']/i);
    if (!relMatch || !relMatch[1].split(/\s+/).includes(rel)) continue;
    if (hreflang) {
      const langMatch = tag.match(/\bhreflang=["']([^"']+)["']/i);
      if (!langMatch || langMatch[1].toLowerCase() !== hreflang.toLowerCase()) continue;
    }
    const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);
    if (hrefMatch) return hrefMatch[1];
  }
  return null;
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchText(baseUrl, pathname) {
  const response = await fetch(new URL(pathname, baseUrl), {
    redirect: "follow",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8",
      "User-Agent": "nabla-site-alban-production-smoke/1.0",
    },
    signal: AbortSignal.timeout(12_000),
  });
  assertCondition(response.ok, pathname + " returned HTTP " + response.status);
  return response.text();
}

async function checkPage(baseUrl, route) {
  const html = await fetchText(baseUrl, route.path);
  const expectedCanonical = absoluteCanonical(route.canonical);
  const expectedEn = absoluteCanonical(route.en);
  const expectedFr = absoluteCanonical(route.fr);

  assertCondition(
    linkHref(html, "canonical") === expectedCanonical,
    route.path + " canonical mismatch: expected " + expectedCanonical,
  );
  assertCondition(
    linkHref(html, "alternate", "en") === expectedEn,
    route.path + " English hreflang mismatch: expected " + expectedEn,
  );
  assertCondition(
    linkHref(html, "alternate", "fr") === expectedFr,
    route.path + " French hreflang mismatch: expected " + expectedFr,
  );
  assertCondition(
    !/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) &&
      !/<meta\b[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(html),
    route.path + " unexpectedly exposes noindex",
  );

  console.log("PASS page " + route.path);
}

async function checkSitemap(baseUrl) {
  const xml = await fetchText(baseUrl, "/sitemap.xml");
  assertCondition(!xml.includes(".html"), "sitemap.xml contains a legacy .html URL");

  const required = [
    "/",
    "/truenas",
    "/architecture",
    "/policy",
    "/policy/legal",
  ].map(absoluteCanonical);

  for (const url of required) {
    assertCondition(
      xml.includes("<loc>" + url + "</loc>"),
      "sitemap.xml is missing canonical URL " + url,
    );
  }

  console.log("PASS sitemap.xml");
}

async function checkRobots(baseUrl) {
  const robots = await fetchText(baseUrl, "/robots.txt");
  assertCondition(
    robots.includes("Sitemap: " + CANONICAL_ORIGIN + "/sitemap.xml"),
    "robots.txt does not advertise the canonical www sitemap",
  );
  assertCondition(
    robots.includes("Allow: /nabla"),
    "robots.txt does not expose the clean /nabla route",
  );
  assertCondition(
    !robots.includes("/nabla/index.html"),
    "robots.txt still references legacy /nabla/index.html",
  );

  console.log("PASS robots.txt");
}

export async function runProductionSmoke(baseUrl) {
  const normalized = normalizedBaseUrl(baseUrl);
  console.log("Production smoke target: " + normalized);

  for (const route of ROUTES) {
    await checkPage(normalized, route);
  }
  await checkSitemap(normalized);
  await checkRobots(normalized);

  console.log("Production post-deploy smoke passed");
}

const baseUrl = process.argv[2] || process.env.BASE_URL || CANONICAL_ORIGIN;

if (process.argv[1]?.endsWith("post-deploy-smoke.mjs")) {
  runProductionSmoke(baseUrl).catch((error) => {
    console.error("Production post-deploy smoke failed:", error);
    process.exitCode = 1;
  });
}
