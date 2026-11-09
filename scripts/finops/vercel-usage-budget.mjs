#!/usr/bin/env node
/**
 * Vercel Hobby budget evidence, intentionally read-only and local-first.
 * Reads official vercel usage --format json data from stdin or a file.
 * Never extrapolates billed CPU from HTTP duration, invocations, or prices.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const CPU_QUOTA_HOURS = 4;
const CPU_NAME = /(?:fluid[\s_-]*)?(?:active[\s_-]*cpu|cpu[\s_-]*active)/i;

function numeric(value) {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value === "string" && /^\s*\d+(?:\.\d+)?\s*$/.test(value)) return Number(value);
  return null;
}

function hours(quantity, unit) {
  const amount = numeric(quantity);
  if (amount === null || typeof unit !== "string") return null;
  const normalized = unit.trim().toLowerCase().replace(/[_\s-]+/g, "");
  if (/^(cpuh(?:ours?)?|hours?|hrs?|h)$/.test(normalized)) return amount;
  if (/^(cpums|milliseconds?|ms)$/.test(normalized)) return amount / 3_600_000;
  if (/^(cpus|seconds?|secs?|s)$/.test(normalized)) return amount / 3_600;
  return null;
}

export function analyzeUsage(document, { quotaHours = CPU_QUOTA_HOURS } = {}) {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    return { status: "INVALID", reason: "invalid-json-usage", cpuHours: null };
  }
  if (!Number.isFinite(quotaHours) || quotaHours <= 0) {
    return { status: "INVALID", reason: "invalid-quota", cpuHours: null };
  }

  // FOCUS API JSONL can be converted to {charges: [...]} ; CLI JSON is
  // advertised with {services: [...]}. Do not aggregate breakdown again.
  const entries = Array.isArray(document.services) ? document.services
    : Array.isArray(document.charges) ? document.charges : [];
  let total = 0;
  let matched = 0;
  let unmeasured = 0;
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const name = [entry.name, entry.service, entry.serviceName,
      entry.ServiceName, entry.SKUName, entry.skuName].filter((v) => typeof v === "string").join(" ");
    if (!CPU_NAME.test(name)) continue;
    matched++;
    const u = entry.unit ?? entry.usageUnit ?? entry.UsageUnit ?? entry.PricingUnit;
    const value = entry.quantity ?? entry.usageQuantity ?? entry.UsageQuantity
      ?? entry.usageValue ?? entry.amount ?? entry.usage;
    const cpu = hours(value, u);
    if (cpu === null) { unmeasured++; continue; }
    total += cpu;
  }
  if (!matched || unmeasured) {
    return {
      status: "NOT_MEASURED", reason: !matched ? "active-cpu-not-present" : "unrecognized-quantity-or-unit",
      cpuHours: null, quotaHours, matchingEntries: matched, unmeasuredEntries: unmeasured,
      source: "official-vercel-usage-export", billedCpuVerified: false,
    };
  }
  const ratio = total / quotaHours;
  const status = ratio >= 0.9 ? "CRITICAL" : ratio >= 0.75 ? "INVESTIGATE"
    : ratio >= 0.5 ? "WATCH" : "OK";
  return {
    status, reason: "reported-active-cpu", cpuHours: Number(total.toFixed(6)),
    quotaHours, percentOfQuota: Number((100 * ratio).toFixed(2)),
    remainingHours: Number(Math.max(0, quotaHours - total).toFixed(6)),
    matchingEntries: matched, unmeasuredEntries: 0,
    source: "official-vercel-usage-export", billedCpuVerified: true,
  };
}

function usage() {
  console.error("Usage: node scripts/finops/vercel-usage-budget.mjs [--input FILE | --stdin] [--strict]");
}

export function run(argv, stdin = () => readFileSync(0, "utf8")) {
  const options = new Set(["--stdin", "--strict", "--input"]);
  if (argv.some((arg) => !options.has(arg) && argv[argv.indexOf(arg) - 1] !== "--input")) {
    usage(); return 2;
  }
  const inputIndex = argv.indexOf("--input");
  if ((inputIndex >= 0 && (!argv[inputIndex + 1] || argv.includes("--stdin"))) ||
      (inputIndex === -1 && !argv.includes("--stdin"))) { usage(); return 2; }
  try {
    const raw = inputIndex >= 0 ? readFileSync(argv[inputIndex + 1], "utf8") : stdin();
    // Keep command bounded on local checkouts; do not print raw data or tokens.
    if (Buffer.byteLength(raw) > 2_000_000) throw new Error("usage-export-too-large");
    const result = analyzeUsage(JSON.parse(raw));
    console.log(JSON.stringify(result));
    return result.status === "INVALID" ? 2 :
      result.status === "NOT_MEASURED" ? 2 :
      argv.includes("--strict") && result.status !== "OK" ? 1 : 0;
  } catch (error) {
    console.log(JSON.stringify({ status: "NOT_MEASURED", reason: error instanceof SyntaxError ? "invalid-json" : "unreadable-export", cpuHours: null }));
    return 2;
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.exitCode = run(process.argv.slice(2));
}
