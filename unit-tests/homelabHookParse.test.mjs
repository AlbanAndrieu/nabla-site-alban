import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("homelab TS state hook parses under Node 22 without a Next build", () => {
  const file = fileURLToPath(new URL("../app/components/homelab/useHomelabHealth.ts", import.meta.url));
  const result = spawnSync(process.execPath, [
    "--experimental-strip-types", "--check", file,
  ], { encoding: "utf8", timeout: 15_000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.equal(result.signal, null, result.stderr);
});
