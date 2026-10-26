import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("standalone typecheck generates current Next route types before tsc", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.typecheck, "bash scripts/run-next-clean.sh typegen && tsc --noEmit");
  const page = read("app/[locale]/security/lexique/page.tsx");
  assert.match(page, /PageProps<"\/\[locale\]\/security\/lexique">/);
  assert.match(page, /const \{ locale \} = await params/);
});

test("route type generation preserves tracked next-env and runs once in quality gate", () => {
  const wrapper = read("scripts/run-next-clean.sh");
  const gate = read("scripts/agent-quality-gate.sh");
  assert.match(wrapper, /snapshot_next_env/);
  assert.match(wrapper, /trap restore_next_env EXIT INT TERM/);
  assert.match(wrapper, /npx next "\$@"/);
  assert.match(gate, /npm run typecheck/);
  assert.doesNotMatch(gate, /npx next typegen/);
});

test("Next install target and eslint-config-next match the lockfile", () => {
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  assert.equal(pkg.dependencies.next, lock.packages["node_modules/next"].version);
  assert.equal(pkg.devDependencies["eslint-config-next"],
    lock.packages["node_modules/eslint-config-next"].version);
  assert.equal(lock.packages[""].dependencies.next, pkg.dependencies.next);
});
