import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const baselineScript = fileURLToPath(
	new URL("../scripts/verify-production-baseline.sh", import.meta.url),
);

type Fixture = {
	directory: string;
	parentSha: string;
	childSha: string;
};

type FixtureOptions = {
	path: string;
	deletePath?: boolean;
};

async function createFixture({
	path,
	deletePath = false,
}: FixtureOptions): Promise<Fixture> {
	const directory = await mkdtemp(
		join(tmpdir(), "alban-maintenance-baseline-"),
	);
	execFileSync("git", ["init"], { cwd: directory, stdio: "ignore" });
	execFileSync("git", ["config", "user.name", "CI"], {
		cwd: directory,
		stdio: "ignore",
	});
	execFileSync("git", ["config", "user.email", "ci@example.invalid"], {
		cwd: directory,
		stdio: "ignore",
	});

	await writeFile(
		join(directory, "package.json"),
		`${JSON.stringify({ name: "baseline-fixture", version: "1.0.0", private: true }, null, 2)}\n`,
	);

	if (deletePath) {
		await mkdir(dirname(join(directory, path)), { recursive: true });
		await writeFile(join(directory, path), "runtime source\n");
	}

	execFileSync("git", ["add", "."], { cwd: directory, stdio: "ignore" });
	execFileSync("git", ["commit", "-m", "feat: healthy production baseline"], {
		cwd: directory,
		stdio: "ignore",
	});
	const parentSha = execFileSync("git", ["rev-parse", "HEAD"], {
		cwd: directory,
		encoding: "utf8",
	}).trim();

	if (deletePath) {
		execFileSync("git", ["rm", path], { cwd: directory, stdio: "ignore" });
	} else {
		await mkdir(dirname(join(directory, path)), { recursive: true });
		await writeFile(join(directory, path), "maintenance change\n");
		execFileSync("git", ["add", path], { cwd: directory, stdio: "ignore" });
	}

	execFileSync("git", ["commit", "-m", "ci: maintenance follow-up"], {
		cwd: directory,
		stdio: "ignore",
	});
	const childSha = execFileSync("git", ["rev-parse", "HEAD"], {
		cwd: directory,
		encoding: "utf8",
	}).trim();

	return { directory, parentSha, childSha };
}

async function installCurlMock(fixture: Fixture) {
	const bin = join(fixture.directory, "bin");
	await mkdir(bin, { recursive: true });
	const curl = join(bin, "curl");
	const childStatuses = [
		{
			context: "Vercel",
			state: "success",
			description: "Canceled by Ignored Build Step",
			created_at: "2026-09-12T19:00:00Z",
		},
	];
	const healthyStatuses = [
		{
			context: "Vercel",
			state: "success",
			description: "Deployment has completed",
			created_at: "2026-09-12T18:00:00Z",
		},
		{
			context: "Production Post-deploy Smoke",
			state: "success",
			description: "Production smoke passed",
			created_at: "2026-09-12T18:01:00Z",
		},
		{
			context: "Production DAST",
			state: "success",
			description: "Production ZAP passed",
			created_at: "2026-09-12T18:02:00Z",
		},
	];
	const script = `#!/usr/bin/env bash
set -euo pipefail
url="\${!#}"
case "\${url}" in
  *"/commits/${fixture.childSha}/status"*)
    cat <<'JSON'
${JSON.stringify({ statuses: childStatuses })}
JSON
    ;;
  *"/commits/${fixture.parentSha}/status"*)
    cat <<'JSON'
${JSON.stringify({ statuses: healthyStatuses })}
JSON
    ;;
  *)
    echo "unexpected curl URL: \${url}" >&2
    exit 22
    ;;
esac
`;
	await writeFile(curl, script);
	await chmod(curl, 0o755);
	return bin;
}

function runBaseline(fixture: Fixture, bin: string, maintenanceHops = "5") {
	return spawnSync("bash", [baselineScript], {
		cwd: fixture.directory,
		encoding: "utf8",
		env: {
			...process.env,
			PATH: `${bin}:${process.env.PATH ?? ""}`,
			BASE_SHA: fixture.childSha,
			GH_TOKEN: "test-token",
			GITHUB_API_URL: "https://api.github.test",
			GITHUB_REPOSITORY: "example/repository",
			QUALITY_BASELINE_RELEASE_HOPS: "3",
			QUALITY_BASELINE_MAINTENANCE_HOPS: maintenanceHops,
		},
	});
}

test("production baseline inherits across a bounded maintenance-only commit", async (t) => {
	const fixture = await createFixture({ path: ".github/workflows/ci.yml" });
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(fixture);

	const result = runBaseline(fixture, bin);

	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /accepted maintenance-only baseline hop/);
	assert.match(
		result.stdout,
		/production-only statuses are absent on maintenance-only commit/,
	);
	assert.match(
		result.stdout,
		new RegExp(`production baseline healthy at ${fixture.parentSha}`),
	);
});

test("production baseline refuses to inherit across a deploy-relevant maintenance candidate", async (t) => {
	const fixture = await createFixture({ path: "app/runtime.ts" });
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(fixture);

	const result = runBaseline(fixture, bin);

	assert.equal(result.status, 1);
	assert.match(result.stderr, /PROD_BASE_MAINTENANCE_SCOPE/);
	assert.match(result.stderr, /app\/runtime\.ts/);
	assert.match(result.stderr, /cannot inherit an older production baseline/);
});

test("production baseline counts deleted runtime files as deploy-relevant", async (t) => {
	const fixture = await createFixture({
		path: "components/Runtime.tsx",
		deletePath: true,
	});
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(fixture);

	const result = runBaseline(fixture, bin);

	assert.equal(result.status, 1);
	assert.match(result.stderr, /PROD_BASE_MAINTENANCE_SCOPE/);
	assert.match(result.stderr, /components\/Runtime\.tsx/);
});

test("production baseline enforces the maintenance-only hop budget", async (t) => {
	const fixture = await createFixture({ path: "unit-tests/contract.test.ts" });
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(fixture);

	const result = runBaseline(fixture, bin, "0");

	assert.equal(result.status, 1);
	assert.match(result.stderr, /PROD_BASE_MAINTENANCE_HOPS/);
	assert.match(result.stderr, /maintenance-only hop budget 0/);
});
