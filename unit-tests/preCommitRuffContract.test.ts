import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

test("pre-commit keeps one auto-fixing Ruff lint authority before Ruff format", async () => {
	const config = await readFile(
		join(repositoryRoot, ".pre-commit-config.yaml"),
		"utf8",
	);
	const marker = "-   repo: https://github.com/astral-sh/ruff-pre-commit";
	const start = config.indexOf(marker);
	assert.notEqual(start, -1, "Ruff pre-commit repository must stay configured");

	const nextRepository = config.indexOf("\n-   repo:", start + marker.length);
	const ruffBlock = config.slice(
		start,
		nextRepository === -1 ? undefined : nextRepository,
	);
	const lintPosition = ruffBlock.indexOf("-   id: ruff-check");
	const formatPosition = ruffBlock.indexOf("-   id: ruff-format");

	assert.notEqual(lintPosition, -1, "ruff-check must stay configured");
	assert.notEqual(formatPosition, -1, "ruff-format must stay configured");
	assert.ok(
		lintPosition < formatPosition,
		"ruff-check must auto-fix before ruff-format",
	);
	assert.match(ruffBlock, /args: \[--fix, --unsafe-fixes\]/);
	assert.doesNotMatch(ruffBlock, /^\s*-\s+id:\s+ruff\s*$/m);
});
