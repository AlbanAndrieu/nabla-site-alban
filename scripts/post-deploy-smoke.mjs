#!/usr/bin/env node

import { Buffer } from "node:buffer";
import { setTimeout as delay } from "node:timers/promises";

const CANONICAL_ORIGIN = "https://www.albanandrieu.com";
const FETCH_TIMEOUT_MS = 12_000;
const FETCH_ATTEMPTS = 3;
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const ROUTES = [
  { path: "/", canonical: "/", en: "/", fr: "/fr" },
  { path: "/fr", canonical: "/fr", en: "/", fr: "/fr" },
  { path: "/truenas", canonical: "/truenas", en: "/truenas", fr: "/fr/truenas" },
  { path: "/fr/truenas", canonical: "/fr/truenas", en: "/truenas", fr: "/fr/truenas" },
  { path: "/architecture", canonical: "/architecture", en: "/architecture", fr: "/fr/architecture" },
  { path: "/fr/architecture", canonical: "/fr/architecture", en: "/architecture", fr: "/fr/architecture" },
  { path: "/contact", canonical: "/contact", en: "/contact", fr: "/fr/contact" },
  { path: "/fr/contact", canonical: "/fr/contact", en: "/contact", fr: "/fr/contact" },
];

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizedBaseUrl(value) {
  const url = new URL(value);
  assertCondition(url.protocol === "https:", "Production smoke requires HTTPS");
  assertCondition(!url.username && !url.password, "Production smoke URL must not contain credentials");
  assertCondition(
    url.origin === CANONICAL_ORIGIN,
    "Production smoke must target the canonical origin " + CANONICAL_ORIGIN,
  );
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.href.replace(/\/$/, "");
}

function absoluteCanonical(pathname) {
  return new URL(pathname, CANONICAL_ORIGIN).href.replace(/\/$/, pathname === "/" ? "/" : "");
}

function attributeValue(tag, name) {
  const match = tag.match(new RegExp("\\b" + name + "=[\"']([^\"']+)[\"']", "i"));
  return match?.[1] ?? null;
}

function decodeHtmlAttributeValue(value) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&#38;/g, "&")
    .replace(/&#x26;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/g, '"');
}

function linkHref(html, rel, hreflang) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const relValue = attributeValue(tag, "rel");
    if (!relValue || !relValue.split(/\s+/).includes(rel)) continue;
    if (hreflang) {
      const lang = attributeValue(tag, "hreflang");
      if (!lang || lang.toLowerCase() !== hreflang.toLowerCase()) continue;
    }
    const href = attributeValue(tag, "href");
    if (href) return decodeHtmlAttributeValue(href);
  }
  return null;
}

function metaContent(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const metaName = attributeValue(tag, "property") ?? attributeValue(tag, "name");
    if (!metaName || metaName.toLowerCase() !== name.toLowerCase()) continue;
    const content = attributeValue(tag, "content");
    if (content) return decodeHtmlAttributeValue(content);
  }
  return null;
}

async function fetchResponse(baseUrl, pathname, accept) {
  const target = new URL(pathname, baseUrl);
  let lastError = new Error(pathname + " request failed");

  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(target, {
        redirect: "follow",
        headers: {
          Accept: accept,
          "User-Agent": "nabla-site-alban-production-smoke/1.1",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (response.ok) {
        if (response.url) {
          const finalUrl = new URL(response.url);
          assertCondition(
            finalUrl.origin === CANONICAL_ORIGIN,
            pathname + " escaped production origin to " + finalUrl.origin,
          );
        }
        return response;
      }

      lastError = new Error(pathname + " returned HTTP " + response.status);
      if (!RETRYABLE_STATUSES.has(response.status)) break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < FETCH_ATTEMPTS) await delay(500 * attempt);
  }

  throw lastError;
}

async function fetchText(baseUrl, pathname) {
  const response = await fetchResponse(
    baseUrl,
    pathname,
    "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8",
  );
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
    linkHref(html, "alternate", "x-default") === expectedEn,
    route.path + " x-default hreflang mismatch: expected " + expectedEn,
  );
  assertCondition(
    !/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) &&
      !/<meta\b[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(html),
    route.path + " unexpectedly exposes noindex",
  );

  console.log("PASS page " + route.path);
  return html;
}

async function checkSitemap(baseUrl) {
  const xml = await fetchText(baseUrl, "/sitemap.xml");
  assertCondition(!xml.includes(".html"), "sitemap.xml contains a legacy .html URL");

  const required = [
    "/",
    "/truenas",
    "/architecture",
    "/contact",
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

async function checkHomelabStatus(baseUrl) {
  const response = await fetchResponse(baseUrl, "/api/homelab-status", "application/json");
  assertCondition(
    response.headers.get("content-type")?.includes("application/json"),
    "/api/homelab-status did not return JSON",
  );
  assertCondition(
    response.headers.get("x-homelab-status-source") === "fastapi",
    "/api/homelab-status is not backed by the FastAPI source",
  );

  const payload = await response.json();
  assertCondition(
    payload && typeof payload === "object",
    "/api/homelab-status returned an invalid payload",
  );
  assertCondition(
    typeof payload.schemaVersion === "number",
    "/api/homelab-status is missing schemaVersion",
  );
  assertCondition(
    typeof payload.checkedAt === "string",
    "/api/homelab-status is missing checkedAt",
  );
  assertCondition(
    Array.isArray(payload.services),
    "/api/homelab-status is missing services",
  );

  console.log("PASS /api/homelab-status");
}

async function checkSocialCard(baseUrl, pathname, locale, html) {
  const ogImage = metaContent(html, "og:image");
  const twitterImage = metaContent(html, "twitter:image");

  assertCondition(ogImage, pathname + " is missing og:image");
  assertCondition(twitterImage, pathname + " is missing twitter:image");
  assertCondition(
    ogImage === twitterImage,
    pathname + " Open Graph and Twitter image URLs differ",
  );

  const imageUrl = new URL(ogImage);
  assertCondition(
    imageUrl.origin === CANONICAL_ORIGIN,
    pathname + " social image is not hosted on the canonical origin",
  );
  assertCondition(
    imageUrl.pathname === "/api/social-card",
    pathname + " social image does not use /api/social-card",
  );
  assertCondition(
    imageUrl.searchParams.get("locale") === locale,
    pathname + " social image locale mismatch",
  );

  const response = await fetchResponse(baseUrl, imageUrl.href, "image/png");
  assertCondition(
    response.headers.get("content-type")?.startsWith("image/png"),
    pathname + " social card is not PNG",
  );

  const image = Buffer.from(await response.arrayBuffer());
  assertCondition(
    image.length >= 24 && image.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE),
    pathname + " social card is not a valid PNG response",
  );
  assertCondition(
    image.readUInt32BE(16) === 1200 && image.readUInt32BE(20) === 630,
    pathname + " social card is not 1200x630",
  );

  console.log("PASS social card " + pathname + " (" + locale + ")");
}

export async function runProductionSmoke(baseUrl) {
  const normalized = normalizedBaseUrl(baseUrl);
  const pages = new Map();
  console.log("Production smoke target: " + normalized);

  for (const route of ROUTES) {
    pages.set(route.path, await checkPage(normalized, route));
  }
  await checkSitemap(normalized);
  await checkRobots(normalized);
  await checkHomelabStatus(normalized);
  await checkSocialCard(normalized, "/", "en", pages.get("/"));
  await checkSocialCard(normalized, "/fr", "fr", pages.get("/fr"));

  console.log("Production post-deploy smoke passed");
}

const baseUrl = process.argv[2] || process.env.BASE_URL || CANONICAL_ORIGIN;

if (process.argv[1]?.endsWith("post-deploy-smoke.mjs")) {
  runProductionSmoke(baseUrl).catch((error) => {
    console.error("Production post-deploy smoke failed:", error);
    process.exitCode = 1;
  });
}
