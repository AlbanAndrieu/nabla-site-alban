import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/vercel-ignore-build.sh", import.meta.url));

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "site-vercel-ignore-"));
  git(root, "init", "-q", "-b", "master");
  git(root, "config", "user.name", "Agent Test");
  git(root, "config", "user.email", "agent@example.test");
  writeFileSync(join(root, "app.ts"), "export const version = 1;\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "initial");
  return root;
}

function ignore(cwd, env = {}) {
  return spawnSync("bash", [script], {
    cwd, encoding: "utf8",
    env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: "", VERCEL_GIT_COMMIT_REF: "feature", ...env },
  });
}

test("a docs-only non-merge commit is safely ignored", (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "docs", "readme.md"), "updated\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "docs");
  const result = ignore(root, { VERCEL_GIT_PREVIOUS_SHA: git(root, "rev-parse", "HEAD^") });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Only documentation/);
});

test("an application change is never skipped", (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "app.ts"), "export const version = 2;\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "application");
  const result = ignore(root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /Deploy-relevant change/);
});

test("a merge with docs-only first-parent delta still builds the application Preview", (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, "switch", "-qc", "feature");
  writeFileSync(join(root, "app.ts"), "export const version = 2;\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "application");
  git(root, "switch", "-q", "master");
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "docs", "readme.md"), "updated\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "docs");
  git(root, "switch", "-q", "feature");
  git(root, "merge", "-q", "--no-ff", "master", "-m", "merge docs");
  const result = ignore(root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /No verified previous deployment SHA or branch merge-base/);
});

test("an explicit preview checkpoint always builds even after docs-only changes", (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = ignore(root, { VERCEL_GIT_COMMIT_REF: "vercel-preview-pr258" });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /Validated checkpoint/);
});

test("docs-only HEAD cannot hide earlier runtime changes without previous Preview SHA", (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, "switch", "-qc", "feature");
  writeFileSync(join(root, "app.ts"), "export const version = 2;\\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "runtime");
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "docs", "readme.md"), "updated\\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "docs");
  const result = ignore(root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /build safely/);
});

test("first branch Preview compares full merge-base when master ref is available", (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const base = git(root, "rev-parse", "HEAD");
  git(root, "update-ref", "refs/remotes/origin/master", base);
  git(root, "switch", "-qc", "feature");
  writeFileSync(join(root, "app.ts"), "export const version = 2;\\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "runtime");
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "docs", "readme.md"), "updated\\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "docs");
  const result = ignore(root);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /entire branch against master merge-base/);
  assert.match(result.stdout, /Deploy-relevant change detected: app.ts/);
});

test("a docs-only branch with known master ref still skips without runtime changes", (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, "update-ref", "refs/remotes/origin/master", git(root, "rev-parse", "HEAD"));
  git(root, "switch", "-qc", "docs");
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "docs", "readme.md"), "updated\\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "docs");
  const result = ignore(root, { VERCEL_GIT_COMMIT_REF: "docs" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Only documentation/);
});
