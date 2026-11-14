/** Read-only source footprint: tracked local code, no network, no dependency install. */
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, extname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss", ".sh", ".bash", ".py"]);
const EXCLUDED_PREFIXES = ["public/", "docs/", ".agents/", ".claude/", ".cursor/", ".github/", ".opencode/", "messages/", "data/", "assets/", ".vercel/", ".vscode/"];
const EXCLUDED_SEGMENTS = new Set(["node_modules", ".next", "dist", "build", "coverage", "vendor", "generated", "__generated__", "fixtures", "snapshots", "archive", "old"]);

export function isSourcePath(path) {
  if (typeof path !== "string" || !path || path.startsWith("/") || path.includes("\\") ||
      path.split("/").some((part) => part === "." || part === ".." || !part)) return false;
  if (EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  if (path.split("/").some((part) => EXCLUDED_SEGMENTS.has(part))) return false;
  if (/\.d\.ts$|(?:^|\/)(?:package-lock\.json|yarn\.lock|pnpm-lock\.yaml|next-env\.d\.ts)$/.test(path)) return false;
  return CODE_EXTENSIONS.has(extname(path));
}

export function area(path) {
  const parts = path.split("/");
  if (parts[0] === "app") {
    const index = parts[1] === "[locale]" ? 2 : 1;
    const section = parts[index] || "root";
    if (section === "components") return "app/components/" + (parts[index + 1] ?? "root");
    return "app/" + section;
  }
  return parts[0] || "root";
}

export function lineStats(content) {
  const text = content.replace(/\r\n/g, "\n");
  const lines = text.length ? text.split("\n") : [];
  if (lines.length && lines.at(-1) === "") lines.pop();
  return { lines: lines.length, nonBlank: lines.filter((line) => line.trim().length).length,
    bytes: Buffer.byteLength(content, "utf8") };
}

export function summarizeSources(sources, top = 10) {
  const groups = new Map();
  let lines = 0, nonBlank = 0, bytes = 0;
  const files = [];
  for (const source of sources) {
    if (!isSourcePath(source.path)) continue;
    const count = lineStats(source.content);
    const label = area(source.path);
    const current = groups.get(label) ?? { area: label, files: 0, lines: 0, bytes: 0 };
    current.files++; current.lines += count.lines; current.bytes += count.bytes;
    groups.set(label, current);
    files.push({ path: source.path, lines: count.lines, bytes: count.bytes });
    lines += count.lines; nonBlank += count.nonBlank; bytes += count.bytes;
  }
  const large = files.filter((file) => file.lines > 600);
  return { files: files.length, lines, nonBlank, bytes, over300: files.filter((f) => f.lines > 300).length,
    over600: large.length, areas: [...groups.values()].sort((a, b) => b.lines - a.lines).slice(0, top),
    largest: files.sort((a, b) => b.lines - a.lines).slice(0, top) };
}

export function parseArgs(argv) {
  const options = { compare: null, top: 10, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--compare" && argv[i + 1] && !argv[i + 1].startsWith("--") && options.compare === null) {
      options.compare = argv[++i];
    } else if (argv[i] === "--top" && /^(?:[1-9]|1[0-9]|20)$/.test(argv[i + 1] ?? "")) {
      options.top = Number(argv[++i]);
    } else if (argv[i] === "--json") options.json = true;
    else throw new Error("CODE_FOOTPRINT_BAD_ARGS");
  }
  return options;
}

function checkedPaths(root) {
  let paths;
  let head;
  try {
    head = execFileSync("git", ["-C", root, "rev-parse", "--verify", "HEAD"], {
      encoding: "utf8", timeout: 5000, stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    paths = execFileSync("git", ["-C", root, "ls-files", "-z", "--cached"], {
      encoding: "utf8", timeout: 5000, maxBuffer: 8 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    }).split("\0").filter(Boolean);
  } catch { throw new Error("CODE_FOOTPRINT_CHECKOUT_MISSING"); }
  if (!/^[a-f0-9]{40}$/.test(head)) throw new Error("CODE_FOOTPRINT_HEAD_INVALID");
  if (paths.length > 20000) throw new Error("CODE_FOOTPRINT_TOO_MANY_FILES");
  return { paths, head };
}

export function analyzeCheckout(root = DEFAULT_ROOT, top = 10) {
  const abs = resolve(root);
  const { paths, head } = checkedPaths(abs);
  const sources = [];
  for (const path of paths) {
    if (!isSourcePath(path)) continue;
    const resolved = join(abs, path);
    try {
      if (!lstatSync(resolved).isFile()) continue; // no symlink traversal or external files
      const content = readFileSync(resolved, "utf8");
      sources.push({ path, content });
    } catch { throw new Error("CODE_FOOTPRINT_INCOMPLETE_CHECKOUT"); }
  }
  return { repo: abs, head, snapshot: "working-tree", ...summarizeSources(sources, top) };
}

export function formatSummary(report) {
  const header = "CODE_FOOTPRINT " + report.repo + " HEAD=" + report.head.slice(0, 12) +
    " files=" + report.files + " lines=" + report.lines + " nonblank=" + report.nonBlank +
    " bytes=" + report.bytes + " over300=" + report.over300 + " over600=" + report.over600;
  const areas = report.areas.map((g) => "  " + g.area + ": " + g.lines + " lines, " + g.files + " files");
  const files = report.largest.map((f) => "  " + f.lines + " " + f.path);
  return [header, "TOP_AREAS", ...areas, "TOP_FILES", ...files,
    "NOTE: working-tree contents; not a publication gate or complexity score."].join("\n");
}

export function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv);
    const local = analyzeCheckout(DEFAULT_ROOT, options.top);
    const reports = [local];
    if (options.compare) {
      if (!isAbsolute(options.compare) && !options.compare.startsWith("../"))
        throw new Error("CODE_FOOTPRINT_COMPARE_PATH_REQUIRED");
      const compare = analyzeCheckout(resolve(DEFAULT_ROOT, options.compare), options.top);
      if (compare.repo === local.repo) throw new Error("CODE_FOOTPRINT_DUPLICATE_ROOT");
      reports.push(compare);
    }
    if (options.json) process.stdout.write(JSON.stringify(reports) + "\n");
    else process.stdout.write(reports.map(formatSummary).join("\n\n") + "\n");
    return 0;
  } catch (cause) {
    console.error(cause?.message?.startsWith("CODE_FOOTPRINT_") ? cause.message : "CODE_FOOTPRINT_UNAVAILABLE");
    return 3;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exitCode = main();
