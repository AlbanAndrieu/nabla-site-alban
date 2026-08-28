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
  assert.match(release, /git tag -a v0\.0\.0/);
  assert.match(release, /git rev-parse HEAD\^/);
  assert.match(release, /semantic-release@25\.0\.8/);
  assert.match(release, /@semantic-release\/changelog@6\.0\.3/);
  assert.match(release, /@semantic-release\/git@10\.0\.1/);
  assert.match(config, /- master/);
  assert.match(config, /tagFormat: "v\$\{version\}"/);
  assert.match(config, /npmPublish: false/);
  assert.match(config, /CHANGELOG\.md/);
  assert.match(config, /package-lock\.json/);
  assert.match(changelog, /^# Changelog/m);
});

test("release workflow configures a Git identity before creating annotated tags", async () => {
  const release = await source(".github/workflows/release.yml");
  const identityPosition = release.indexOf("git config --local user.name");
  const emailPosition = release.indexOf("git config --local user.email");
  const tagPosition = release.indexOf("git tag -a v0.0.0");

  assert.ok(identityPosition >= 0, "release workflow must configure git user.name");
  assert.ok(emailPosition >= 0, "release workflow must configure git user.email");
  assert.ok(tagPosition >= 0, "release workflow must create the annotated bootstrap tag");
  assert.ok(identityPosition < tagPosition, "git identity must be configured before tagging");
  assert.ok(emailPosition < tagPosition, "git email must be configured before tagging");
  assert.match(release, /github-actions\[bot\]/);
  assert.match(release, /41898282\+github-actions\[bot\]@users\.noreply\.github\.com/);
});

test("release configuration keeps feature alias and generated release commit out of CI loops", async () => {
  const config = await source(".releaserc.yaml");

  assert.match(config, /type: feature[\s\S]*release: minor/);
  assert.match(config, /chore\(release\): \$\{nextRelease\.version\} \[skip ci\]/);
});
