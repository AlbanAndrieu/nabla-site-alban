import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";

function parseTypeScript(source) {
  // The hook uses readonly constructor parameter properties. "strip" cannot
  // handle this legal TypeScript; "transform" lowers them without npm/Next.
  const js = stripTypeScriptTypes(source, { mode: "transform" });
  return spawnSync(process.execPath, ["--input-type=module", "--check"], {
    input: js, encoding: "utf8", timeout: 15_000,
  });
}

test("homelab TS hook parses with parameter properties on Node 22 or 24", () => {
  const file = fileURLToPath(new URL("../app/components/homelab/useHomelabHealth.ts", import.meta.url));
  const result = parseTypeScript(readFileSync(file, "utf8"));
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.equal(result.signal, null, result.stderr);
});

test("offline TypeScript parser rejects the missing comma that broke Vercel", () => {
  const badSource = [
    "class Example { constructor(readonly reason: string) {} }",
    "const state = { error: false",
    "healthUnavailable: false };",
  ].join("\n");
  assert.throws(
    () => parseTypeScript(badSource),
    /Expected ','|ERR_INVALID_TYPESCRIPT_SYNTAX|Unexpected identifier/,
  );
});
