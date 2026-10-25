import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("homelab TS hook parses under supported local runtimes without a Next build", () => {
  const file = fileURLToPath(new URL("../app/components/homelab/useHomelabHealth.ts", import.meta.url));
  const source = stripTypeScriptTypes(readFileSync(file, "utf8"), { mode: "strip" });
  const result = spawnSync(process.execPath, ["--input-type=module", "--check"], {
    input: source, encoding: "utf8", timeout: 15_000,
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.equal(result.signal, null, result.stderr);
});
