import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(
	new URL("../scripts/manage-master-ruleset.sh", import.meta.url),
);
const CONFIG = fileURLToPath(
	new URL("../.github/rulesets/master-quality.json", import.meta.url),
);

type MockMode = "exact" | "drift" | "missing";

async function mockGh(mode: MockMode) {
	const cwd = await mkdtemp(path.join(os.tmpdir(), "nabla-ruleset-gh-"));
	const ghPath = path.join(cwd, "gh");
	const actualPath = path.join(cwd, "actual.json");
	const statePath = path.join(cwd, "state.txt");
	const logPath = path.join(cwd, "calls.log");
	const config = await readFile(CONFIG, "utf8");
	const actual = JSON.parse(config);
	if (mode === "drift") actual.enforcement = "disabled";
	await writeFile(actualPath, JSON.stringify(actual));
	await writeFile(statePath, mode === "missing" ? "missing" : "existing");
	await writeFile(logPath, "");
	await writeFile(
		ghPath,
		`#!/usr/bin/env bash
set -euo pipefail
shift # api
method="GET"
endpoint=""
input=""
while (($# > 0)); do
  case "$1" in
    -H) shift 2 ;;
    --method) method="$2"; shift 2 ;;
    --input) input="$2"; shift 2 ;;
    *) endpoint="$1"; shift ;;
  esac
done
printf '%s %s\\n' "\${method}" "\${endpoint}" >> "${logPath}"
state="$(cat "${statePath}")"
if [[ "\${endpoint}" == *"rulesets?per_page=100" ]]; then
  if [[ "\${state}" == "missing" ]]; then
    printf '[]\\n'
  else
    printf '[{"id":42,"name":"master-quality-and-pr-safety"}]\\n'
  fi
elif [[ "\${endpoint}" == *"rulesets/42" && "\${method}" == "GET" ]]; then
  cat "${actualPath}"
elif [[ "\${endpoint}" == */rulesets && "\${method}" == "POST" ]]; then
  cp "\${input}" "${actualPath}"
  printf 'existing' > "${statePath}"
  printf '{"id":42}\\n'
elif [[ "\${endpoint}" == *"rulesets/42" && "\${method}" == "PUT" ]]; then
  cp "\${input}" "${actualPath}"
  printf 'existing' > "${statePath}"
  printf '{"id":42}\\n'
else
  printf 'unexpected request: %s %s\\n' "\${method}" "\${endpoint}" >&2
  exit 9
fi
`,
	);
	await chmod(ghPath, 0o755);
	return { cwd, logPath };
}

function testEnv(mockDir: string) {
	return {
		...process.env,
		PATH: `${mockDir}:${process.env.PATH}`,
		GITHUB_REPOSITORY: "AlbanAndrieu/nabla-site-alban",
	};
}

test(
	"master ruleset pins unconditional checks without making conditional Preview checks globally required",
	async () => {
		const config = JSON.parse(await readFile(CONFIG, "utf8"));
		const statusRule = config.rules.find(
			(rule: { type: string }) => rule.type === "required_status_checks",
		);
		const contexts = statusRule.parameters.required_status_checks.map(
			(check: { context: string }) => check.context,
		);
		assert.deepEqual(contexts.sort(), ["CI policy guard", "quality"]);
		assert.equal(contexts.includes("Vercel"), false);
		assert.equal(contexts.includes("Playwright Preview E2E"), false);
		assert.deepEqual(config.conditions.ref_name.include, ["~DEFAULT_BRANCH"]);
		assert.deepEqual(config.bypass_actors, [
			{ actor_id: 7859836, actor_type: "User", bypass_mode: "pull_request" },
		]);
	},
);

test(
	"ruleset audit passes only when GitHub matches the repository-owned config",
	async () => {
		for (const [mode, shouldPass] of [
			["exact", true],
			["drift", false],
		] as const) {
			const mock = await mockGh(mode);
			try {
				if (shouldPass) {
					const result = await execFileAsync("bash", [SCRIPT, "--check"], {
						env: testEnv(mock.cwd),
					});
					assert.match(result.stdout, /RULESET_OK/);
				} else {
					await assert.rejects(
						execFileAsync("bash", [SCRIPT, "--check"], {
							env: testEnv(mock.cwd),
						}),
						(error: { stderr?: string }) =>
							Boolean(error.stderr?.includes("RULESET_DRIFT")),
					);
				}
			} finally {
				await rm(mock.cwd, { recursive: true, force: true });
			}
		}
	},
);

test(
	"ruleset apply creates missing state and updates drift before verifying exact state",
	async () => {
		for (const [mode, expectedMethod, expectedMessage] of [
			["missing", "POST", "RULESET_CREATE"],
			["drift", "PUT", "RULESET_UPDATE"],
		] as const) {
			const mock = await mockGh(mode);
			try {
				const result = await execFileAsync("bash", [SCRIPT, "--apply"], {
					env: testEnv(mock.cwd),
				});
				assert.match(result.stdout, new RegExp(expectedMessage));
				assert.match(result.stdout, /RULESET_OK/);
				assert.match(
					await readFile(mock.logPath, "utf8"),
					new RegExp(expectedMethod),
				);
			} finally {
				await rm(mock.cwd, { recursive: true, force: true });
			}
		}
	},
);
