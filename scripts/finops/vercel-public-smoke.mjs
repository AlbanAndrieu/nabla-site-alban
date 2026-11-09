#!/usr/bin/env node
/** Manual low-impact smoke of public static routes; never touches private APIs. */
import { pathToFileURL } from "node:url";

export const SITES = Object.freeze({
  alban: Object.freeze({ origin: "https://www.albanandrieu.com", paths: ["/fr", "/en", "/fr/security", "/en/security", "/fr/truenas"] }),
  bababou: Object.freeze({ origin: "https://www.bababou.com", paths: ["/", "/nre", "/en/nre", "/de/nre", "/no/nre", "/evidence-access"] }),
});
const CACHE = new Set(["HIT", "MISS", "STALE", "REVALIDATED", "BYPASS", "PRERENDER", "NONE"]);

export function parseArgs(args) {
  if (args.length !== 3 || args[0] !== "--live" || args[1] !== "--site" || !Object.hasOwn(SITES, args[2])) return null;
  return args[2];
}

export async function inspect(site, request = fetch) {
  const spec = SITES[site];
  if (!spec) return { status: "INVALID", site: "unknown", results: [] };
  const results = [];
  for (const path of spec.paths) {
    try {
      const response = await request(`${spec.origin}${path}`, {
        method: "HEAD", redirect: "manual",
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "nabla-vercel-smoke/1.0" },
      });
      const code = response.status;
      const cacheRaw = response.headers?.get("x-vercel-cache")?.toUpperCase() ?? "NONE";
      const cache = CACHE.has(cacheRaw) ? cacheRaw : "UNKNOWN";
      const state = code === 402 ? "PLATFORM_BLOCKED" : code >= 200 && code < 300 ? "PASS"
        : code >= 300 && code < 400 ? "REDIRECT" : "HTTP_ERROR";
      results.push({ path, state, http: code, cache });
    } catch {
      results.push({ path, state: "UNREACHABLE", http: null, cache: "UNKNOWN" });
    }
  }
  const blocked = results.some(x => x.state === "PLATFORM_BLOCKED");
  const status = blocked ? "BLOCKED_PLATFORM" : results.every(x => x.state === "PASS") ? "PASS" : "WARN";
  return { status, site, checked: results.length, results, cpuMeasured: false };
}

export async function run(argv, request = fetch) {
  const site = parseArgs(argv);
  if (!site) {
    console.log(JSON.stringify({ status: "NOT_RUN", reason: "requires---live---site-alban-or-bababou", cpuMeasured: false }));
    return 2;
  }
  const report = await inspect(site, request);
  console.log(JSON.stringify(report));
  return report.status === "PASS" ? 0 : report.status === "BLOCKED_PLATFORM" ? 2 : 1;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.exitCode = await run(process.argv.slice(2));
}
