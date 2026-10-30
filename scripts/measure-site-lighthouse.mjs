#!/usr/bin/env node
/** Explicit, local Lighthouse acceptance. Does not install, deploy, or mutate anything. */
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const project = resolve(fileURLToPath(new URL("..", import.meta.url)));
const core = ["/", "/fr", "/security/yubikey", "/fr/security/yubikey"];
const full = [...core, "/architecture", "/fr/architecture", "/truenas", "/fr/truenas"];
const categories = ["performance", "accessibility", "best-practices", "seo"];
const defaultMinimums = { performance: 80, accessibility: 90, "best-practices": 90, seo: 90 };

export function validateBase(raw) {
  if (!raw) throw new Error("LH_BASE_MISSING: set BASE_URL explicitly");
  const url = new URL(raw);
  if (url.username || url.password || url.search || url.hash)
    throw new Error("LH_BASE_INVALID: do not supply credentials, query or fragment");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))
    throw new Error("LH_BASE_INVALID: require HTTPS or local loopback");
  if (url.pathname !== "/" || url.port && url.protocol === "https:" && url.port === "80")
    throw new Error("LH_BASE_INVALID: supply an origin without path");
  return url.origin;
}

export function summarizeReport(report, expectedUrl, minimums = defaultMinimums) {
  const actual = report.finalDisplayedUrl || report.finalUrl || "";
  if (report.runtimeError || !actual.startsWith(expectedUrl.split("?")[0]))
    return { status: "BLOCKED", reason: "LH_RUNTIME_OR_NAVIGATION", finalUrl: actual };
  const http = report.audits?.["http-status-code"];
  if (http?.score === 0 || /checkpoint|challenge/i.test(report.finalDisplayedUrl || ""))
    return { status: "BLOCKED", reason: "LH_EDGE_OR_HTTP_ERROR", finalUrl: actual };
  const scores = Object.fromEntries(categories.map(name => [name, Math.round(100 * (report.categories?.[name]?.score ?? -1))]));
  const valid = categories.every(name => scores[name] >= 0);
  if (!valid) return { status: "BLOCKED", reason: "LH_MISSING_CATEGORIES", scores };
  return {
    status: categories.every(name => scores[name] >= minimums[name]) ? "PASS" : "FAIL",
    scores,
    lcpMs: report.audits?.["largest-contentful-paint"]?.numericValue ?? null,
    cls: report.audits?.["cumulative-layout-shift"]?.numericValue ?? null,
  };
}

export function run(argv = process.argv.slice(2), env = process.env) {
  if (argv.length !== 1 || !["core", "full"].includes(argv[0])) {
    console.error("usage: BASE_URL=https://host node scripts/measure-site-lighthouse.mjs core|full");
    return 2;
  }
  let origin;
  try { origin = validateBase(env.BASE_URL); }
  catch (error) { console.error(error.message); return 2; }
  const bin = env.LIGHTHOUSE_BIN || join(project, "node_modules/.bin/lighthouse");
  if (!existsSync(bin)) {
    console.error("LH_NOT_RUN_MISSING_CLI: install Lighthouse locally before running (no auto-download)");
    return 3;
  }
  const outDir = mkdtempSync(join(tmpdir(), "site-alban-lighthouse-"));
  const paths = argv[0] === "full" ? full : core;
  let failed = false;
  for (const path of paths) {
    const target = new URL(path, origin).href;
    const output = join(outDir, path === "/" ? "en-home.json" : path.replaceAll("/", "_") + ".json");
    const r = spawnSync(bin, [target, "--quiet", "--no-enable-error-reporting", "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json", `--output-path=${output}`, "--chrome-flags=--headless --no-sandbox"], {
      cwd: project, encoding: "utf8", timeout: 180_000, maxBuffer: 512 * 1024,
      env: { ...env, CI: "1" },
    });
    if (r.status !== 0 || !existsSync(output)) {
      failed = true;
      console.log(`${path}: BLOCKED lighthouse process; report ${output}`);
      continue;
    }
    try {
      const result = summarizeReport(JSON.parse(readFileSync(output, "utf8")), target);
      console.log(`${path}: ${result.status} ${JSON.stringify(result)}`);
      if (result.status !== "PASS") failed = true;
    } catch {
      console.log(`${path}: BLOCKED invalid Lighthouse report`);
      failed = true;
    }
  }
  console.log(`LH_REPORTS: ${outDir} (temporary; inspect before sharing)`);
  console.log("LH_PROOF: separate from Node24 publication gate and field Core Web Vitals");
  return failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exitCode = run();
