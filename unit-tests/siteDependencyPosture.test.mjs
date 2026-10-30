import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = name => JSON.parse(readFileSync(new URL("../" + name, import.meta.url), "utf8"));
const parseVersion = version => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  assert.ok(match, `non-exact dependency version: ${version}`);
  return match.slice(1).map(Number);
};
const atLeast = (actual, minimum) => {
  const a = parseVersion(actual), b = parseVersion(minimum);
  return a[0] === b[0] && (a[1] > b[1] || a[1] === b[1] && a[2] >= b[2]);
};

test("installed Next.js and image stack satisfy documented October 2026 security floor", () => {
  const pkg = read("package.json"), lock = read("package-lock.json").packages;
  const next = lock["node_modules/next"], sharp = lock["node_modules/sharp"];
  assert.ok(atLeast(next.version, "16.4.1"), "Next.js must include the Oct 14 2026 RCE/DoS fixes");
  assert.ok(atLeast(sharp.version, "0.35.5"), "sharp must include the SVG image security fix");
  assert.equal(pkg.dependencies.next, next.version);
  assert.equal(pkg.devDependencies["eslint-config-next"], lock["node_modules/eslint-config-next"].version);
  assert.equal(pkg.dependencies.react.replace("^", ""), lock["node_modules/react"].version);
  assert.equal(pkg.dependencies["react-dom"].replace("^", ""), lock["node_modules/react-dom"].version);
  for (const key of ["node_modules/next", "node_modules/sharp", "node_modules/react", "node_modules/react-dom"]) {
    assert.match(lock[key].integrity || "", /^sha512-/);
  }
});

test("Renovate is bounded, review-only and delays non-security updates", () => {
  const config = read("renovate.json");
  assert.equal(config.automerge, false);
  assert.equal(config.prConcurrentLimit, 2);
  assert.equal(config.branchConcurrentLimit, 2);
  assert.equal(config.prHourlyLimit, 1);
  assert.equal(config.rebaseWhen, "conflicted");
  assert.ok(config.packageRules.some(rule => rule.minimumReleaseAge === "7 days"));
  assert.ok(config.packageRules.some(rule =>
    rule.groupName === "Next.js stack" && rule.matchPackageNames.includes("eslint-config-next")
  ));
});

test("security configuration is versioned but cannot substitute for a live GitHub ruleset", () => {
  const rules = read(".github/rulesets/master-quality.json");
  assert.equal(rules.enforcement, "active");
  assert.deepEqual(rules.conditions.ref_name.include, ["~DEFAULT_BRANCH"]);
  assert.ok(rules.rules.some(rule => rule.type === "pull_request"));
  assert.ok(rules.rules.some(rule => rule.type === "non_fast_forward"));
  assert.ok(rules.rules.some(rule => rule.type === "deletion"));
  const checks = rules.rules.find(rule => rule.type === "required_status_checks");
  assert.deepEqual(checks.parameters.required_status_checks.map(x => x.context).sort(),
    ["CI policy guard", "quality"]);
  assert.ok(!rules.bypass_actors.some(x => x.bypass_mode === "always"));
});
