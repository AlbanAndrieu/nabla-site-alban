import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("semantic-release bootstraps Site Alban at 0.0.1 after green master CI", async () => {
  const [pkgRaw, release, config, changelog] = await Promise.all([
    source("package.json"),
    source(".github/workflows/release.yml"),
    source(".releaserc.yaml"),
    source("CHANGELOG.md"),
  ]);
  const pkg = JSON.parse(pkgRaw) as { version?: string };

  assert.equal(pkg.version, "0.0.1");
  assert.match(release, /workflow_run:/);
  assert.match(release, /CI \(Quality and Security\)/);
  assert.match(release, /head_branch == 'master'/);
  assert.match(release, /semantic-release@25\.0\.8/);
  assert.match(release, /@semantic-release\/changelog@6\.0\.3/);
  assert.match(release, /@semantic-release\/git@10\.0\.1/);
  assert.match(release, /@semantic-release\/npm@13\.1\.3/);
  assert.match(config, /- master/);
  assert.match(config, /tagFormat: "v\$\{version\}"/);
  assert.match(config, /npmPublish: false/);
  assert.match(config, /CHANGELOG\.md/);
  assert.match(config, /package-lock\.json/);
  assert.match(changelog, /^# Changelog/m);
});

test("release bootstrap anchors v0.0.0 before semantic-release workflow changes", async () => {
  const release = await source(".github/workflows/release.yml");
  const identityPosition = release.indexOf("git config --local user.name");
  const configCommitPosition = release.indexOf("git log --reverse --format=%H -- .releaserc.yaml");
  const tagPosition = release.indexOf('git tag v0.0.0 "${BASELINE_SHA}"');

  assert.ok(identityPosition >= 0, "release workflow must configure git user.name");
  assert.ok(configCommitPosition >= 0, "release workflow must locate the first release config commit");
  assert.ok(tagPosition >= 0, "release workflow must create the technical baseline tag");
  assert.ok(identityPosition < tagPosition, "git identity must be configured before bootstrap mutations");
  assert.ok(configCommitPosition < tagPosition, "baseline must be resolved before creating v0.0.0");
  assert.match(release, /BASELINE_SHA="\$\(git rev-parse "\$\{RELEASE_CONFIG_COMMIT\}\^"\)"/);
  assert.match(release, /gh api --method POST/);
  assert.match(release, /repos\/\$\{GITHUB_REPOSITORY\}\/git\/refs/);
  assert.match(release, /git config --local user.email/);
  assert.doesNotMatch(release, /git commit --allow-empty/);
  assert.doesNotMatch(release, /git push origin HEAD:master/);
});

test("release bootstrap creates only the tag ref through the GitHub API", async () => {
  const release = await source(".github/workflows/release.yml");
  const bootstrapStart = release.indexOf("      - name: Bootstrap semantic-release baseline");
  const bootstrapEnd = release.indexOf("      - name: Verify first-release bootstrap version");
  const bootstrapStep = release.slice(bootstrapStart, bootstrapEnd);

  assert.match(bootstrapStep, /gh api --method POST/);
  assert.match(bootstrapStep, /repos\/\$\{GITHUB_REPOSITORY\}\/git\/refs/);
  assert.match(bootstrapStep, /-f ref="refs\/tags\/v0\.0\.0"/);
  assert.match(bootstrapStep, /-f sha="\$\{BASELINE_SHA\}"/);
  assert.doesNotMatch(bootstrapStep, /git push origin refs\/tags\/v0\.0\.0/);
  assert.doesNotMatch(bootstrapStep, /git diff-tree/);
});

test("release bootstrap keeps authentication available when git invokes the gh credential helper", async () => {
  const release = await source(".github/workflows/release.yml");
  const bootstrapStart = release.indexOf("      - name: Bootstrap semantic-release baseline");
  const bootstrapEnd = release.indexOf("      - name: Verify first-release bootstrap version");
  const bootstrapStep = release.slice(bootstrapStart, bootstrapEnd);

  assert.ok(bootstrapStart >= 0, "release workflow must contain the bootstrap step");
  assert.ok(bootstrapEnd > bootstrapStart, "bootstrap step must precede first-release validation");
  assert.match(
    bootstrapStep,
    /env:\s+GH_TOKEN: \$\{\{ steps\.release_app_token\.outputs\.token \|\| secrets\.GITHUB_TOKEN \}\}/,
  );
  assert.match(bootstrapStep, /gh api --method POST/);
});

test("release bootstrap keeps release App permissions minimal and scopes its private key", async () => {
  const release = await source(".github/workflows/release.yml");
  const jobEnv = release.slice(release.indexOf("    env:"), release.indexOf("    steps:"));

  assert.match(jobEnv, /RELEASE_APP_CLIENT_ID/);
  assert.doesNotMatch(jobEnv, /RELEASE_APP_PRIVATE_KEY/);
  assert.match(release, /private-key: \$\{\{ secrets\.RELEASE_APP_PRIVATE_KEY \}\}/);
  assert.doesNotMatch(release, /permission-workflows:/);
});

test("release normalizes package-lock metadata before semantic-release", async () => {
  const release = await source(".github/workflows/release.yml");
  const normalizePosition = release.indexOf("Normalize npm lock metadata");
  const semanticPosition = release.indexOf("Run semantic-release");

  assert.ok(normalizePosition >= 0, "release workflow must normalize npm lock metadata");
  assert.ok(semanticPosition > normalizePosition, "lock metadata must be normalized before semantic-release");
  assert.match(release, /npm install --package-lock-only --ignore-scripts --no-audit --no-fund/);
});

test("release configuration keeps feature alias and generated release commit out of CI loops", async () => {
  const config = await source(".releaserc.yaml");

  assert.match(config, /type: feature[\s\S]*release: minor/);
  assert.match(config, /chore\(release\): \$\{nextRelease\.version\} \[skip ci\]/);
});
