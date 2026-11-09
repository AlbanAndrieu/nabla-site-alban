#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Audit build artifacts only: no Vercel API, credentials, or runtime requests.
// English may be prefixed or unprefixed; French is always under /fr.
export const PUBLIC_PAGE_GROUPS = {
  home: { en: ["/", "/en"], fr: ["/fr"] },
  security: { en: ["/security", "/en/security"], fr: ["/fr/security"] },
  yubikey: { en: ["/security/yubikey", "/en/security/yubikey"], fr: ["/fr/security/yubikey"] },
  truenas: { en: ["/truenas", "/en/truenas"], fr: ["/fr/truenas"] },
  architecture: { en: ["/architecture", "/en/architecture"], fr: ["/fr/architecture"] },
};

const PRIVATE_ROUTE = /^\/api\/(?:homelab(?:-|\/)|create-checkout-session(?:\/|$)|stripe-webhook(?:\/|$))/;

function normalizeRoute(value) {
  return "/" + String(value).replace(/^\/+/, "").replace(/\/+$/, "");
}

export function assessRuntimeTopology(manifest, functionPaths = []) {
  if (!manifest || typeof manifest.routes !== "object" || manifest.routes === null || Array.isArray(manifest.routes)) {
    return { status: "FAIL", reason: "invalid-prerender-manifest", verified: [], missing: [], revalidatingPublic: [], privatePrerendered: [], publicFunctions: [] };
  }

  const staticRoutes = new Set(Object.keys(manifest.routes).map(normalizeRoute));
  const verified = [];
  const missing = [];
  const revalidatingPublic = [];
  const publicAliases = new Set();

  for (const [page, locales] of Object.entries(PUBLIC_PAGE_GROUPS)) {
    for (const [locale, aliases] of Object.entries(locales)) {
      aliases.forEach((alias) => publicAliases.add(alias));
      const observed = aliases.find((alias) => staticRoutes.has(alias));
      if (observed) {
        verified.push(page + ":" + locale + "=" + observed);
        // ISR refreshes consume compute and must not be called immutable SSG.
        if (manifest.routes[observed]?.initialRevalidateSeconds !== false) {
          revalidatingPublic.push(page + ":" + locale);
        }
      } else missing.push(page + ":" + locale);
    }
  }

  const privatePrerendered = [...staticRoutes].filter((route) => PRIVATE_ROUTE.test(route)).sort();
  const publicFunctions = [...new Set(functionPaths.map(normalizeRoute))]
    .filter((route) => publicAliases.has(route))
    .sort();
  const status = privatePrerendered.length
    ? "FAIL"
    : missing.length || revalidatingPublic.length || publicFunctions.length ? "WARN" : "PASS";

  return {
    status,
    reason: status === "FAIL" ? "private-api-prerendered"
      : status === "WARN" ? "runtime-review-required" : "public-routes-prerendered",
    verified,
    missing,
    revalidatingPublic,
    privatePrerendered,
    publicFunctions,
  };
}

async function vercelFunctionRoutes(directory) {
  let entries;
  try {
    entries = await readdir(directory, { recursive: true });
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  return entries
    .filter((entry) => entry.endsWith(".func") || entry.includes(".func/"))
    .map((entry) => entry.split(".func")[0].replaceAll(path.sep, "/"))
    .map((entry) => entry === "index" ? "/" : "/" + entry.replace(/\/index$/, ""));
}

export async function auditRuntime({
  manifestPath = ".next/prerender-manifest.json",
  functionsDirectory = ".vercel/output/functions",
} = {}) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return { status: "NOT_RUN", reason: "next-build-artifact-absent", manifestPresent: false, functionsPresent: false };
    }
    return { status: "FAIL", reason: "unreadable-prerender-manifest", manifestPresent: true, functionsPresent: false };
  }
  let functions;
  try {
    functions = await vercelFunctionRoutes(functionsDirectory);
  } catch {
    return { status: "FAIL", reason: "unreadable-vercel-functions", manifestPresent: true, functionsPresent: false };
  }
  return {
    ...assessRuntimeTopology(manifest, functions ?? []),
    manifestPresent: true,
    functionsPresent: functions !== null,
    cpuMeasured: false,
  };
}

async function main(args) {
  const validOptions = new Set(["--json", "--strict"]);
  if (args.some((arg) => !validOptions.has(arg))) {
    process.stderr.write("Usage: node scripts/audit-vercel-runtime.mjs [--json] [--strict]\n");
    process.exitCode = 2;
    return;
  }
  const result = await auditRuntime();
  if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("VERCEL_RUNTIME_AUDIT status=" + result.status + " reason=" + result.reason + " cpu_measured=false");
    console.log("Prerender manifest: " + (result.manifestPresent ? "observed" : "NOT_RUN")
      + "; Vercel function artifacts: " + (result.functionsPresent ? "observed" : "NOT_RUN"));
    if (result.verified?.length) console.log("Static pages: " + result.verified.join(", "));
    if (result.missing?.length) console.log("Missing static routes: " + result.missing.join(", "));
    if (result.revalidatingPublic?.length) console.log("ISR or unknown cache policy: " + result.revalidatingPublic.join(", "));
    if (result.privatePrerendered?.length) console.error("PRIVACY FAILURE — prerendered API paths: " + result.privatePrerendered.join(", "));
    if (result.publicFunctions?.length) console.log("Unexpected public functions: " + result.publicFunctions.join(", "));
  }
  process.exitCode = result.status === "FAIL" ? 1 : result.status === "NOT_RUN" ? 2
    : result.status === "WARN" && args.includes("--strict") ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main(process.argv.slice(2));
}
