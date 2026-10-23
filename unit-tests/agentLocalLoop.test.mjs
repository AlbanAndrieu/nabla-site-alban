import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const load = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
test("local loop is Git-aware and pre-commit-only", () => {
 const script = load("scripts/agent-local-loop.sh");
 assert.match(script, /collect_changed_files/);
 assert.match(script, /git merge-base/);
 assert.match(script, /pre-commit run --hook-stage pre-commit --files/);
 assert.match(script, /QG_LOOP_L2_PASS/);
 assert.doesNotMatch(script, /npm run build|quality:agent:publish\s*$/m);
});
test("just and mise expose the same loop", () => {
 assert.match(load("justfile"), /\nloop:\n\s+bash scripts\/agent-local-loop\.sh/);
 assert.match(load("mise.toml"), /\[tasks\.agent-loop\]/);
});
