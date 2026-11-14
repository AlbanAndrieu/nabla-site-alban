import assert from "node:assert/strict";
import test from "node:test";
import { area, formatSummary, isSourcePath, lineStats, parseArgs, summarizeSources } from "../scripts/code-footprint.mjs";

test("code footprint excludes public/vendor, generated, skills, secrets and document files", () => {
  for (const path of [
    "public/assets/vendor.js", "docs/quality-roadmap.md", ".agents/skills/a/SKILL.md",
    ".github/workflows/ci.yml", "node_modules/a/index.ts", "lib/generated/types.ts",
    "lib/schema.d.ts", "app/../private.ts", "/etc/passwd", "app/legacy/old/example.ts",
  ]) assert.equal(isSourcePath(path), false, path);
  for (const path of [
    "app/[locale]/nre/sections.tsx", "unit-tests/testQuality.test.mjs",
    "scripts/code-footprint.mjs", "lib/healthy.ts", "app/[locale]/nre/page.module.css",
  ]) assert.equal(isSourcePath(path), true, path);
});

test("physical and nonblank lines are counted without double-counting final newline", () => {
  assert.deepEqual(lineStats("one\n\ntwo\n"), { lines: 3, nonBlank: 2, bytes: 9 });
  assert.deepEqual(lineStats(""), { lines: 0, nonBlank: 0, bytes: 0 });
  assert.deepEqual(lineStats("a\r\nb"), { lines: 2, nonBlank: 2, bytes: 4 });
});

test("site areas distinguish app routes, nested components and tests", () => {
  assert.equal(area("app/[locale]/nre/sections.tsx"), "app/nre");
  assert.equal(area("app/components/homelab/HomelabServicesBlock.tsx"), "app/components/homelab");
  assert.equal(area("app/[locale]/security/yubikey/useCases.ts"), "app/security");
  assert.equal(area("unit-tests/example.test.ts"), "unit-tests");
});

test("summary keeps deterministic top counts and reports large maintained source", () => {
  const sources = [
    { path: "app/components/homelab/a.tsx", content: "a\n".repeat(601) },
    { path: "app/components/homelab/b.tsx", content: "b\n".repeat(301) },
    { path: "unit-tests/a.test.ts", content: "x\ny\n" },
    { path: "public/vendor/huge.js", content: "z\n".repeat(1000) },
  ];
  const summary = summarizeSources(sources, 2);
  assert.deepEqual({ files: summary.files, lines: summary.lines, nonBlank: summary.nonBlank,
    over300: summary.over300, over600: summary.over600 },
    { files: 3, lines: 904, nonBlank: 904, over300: 2, over600: 1 });
  assert.equal(summary.areas[0].area, "app/components/homelab");
  assert.equal(summary.largest[0].lines, 601);
  assert.match(formatSummary({ repo: "/repo", head: "b".repeat(40), ...summary }), /over600=1/);
});

test("CLI parsing is bounded, explicit and network-free", () => {
  assert.deepEqual(parseArgs(["--compare", "../nabla-site-bababou", "--top", "4", "--json"]),
    { compare: "../nabla-site-bababou", top: 4, json: true });
  assert.throws(() => parseArgs(["--top", "100"]), /CODE_FOOTPRINT_BAD_ARGS/);
  assert.throws(() => parseArgs(["--compare"]), /CODE_FOOTPRINT_BAD_ARGS/);
  assert.throws(() => parseArgs(["--unknown"]), /CODE_FOOTPRINT_BAD_ARGS/);
});
