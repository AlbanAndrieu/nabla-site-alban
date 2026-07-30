#!/usr/bin/env node
/**
 * OpenCommit reads `.opencommit-commitlint` at `${process.env.PWD}/.opencommit-commitlint`.
 * `PWD` is often unset in non-interactive shells, which breaks detection. Pin both here.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "node_modules", "opencommit", "out", "cli.cjs");
const env = { ...process.env, PWD: root };
const args = process.argv.slice(2);
const r = spawnSync(process.execPath, [cli, ...args], {
  stdio: "inherit",
  env,
  cwd: root,
});
process.exit(r.status === null ? 1 : r.status);
