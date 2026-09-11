import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readTrueNasTransportEvidence } from "../lib/homelabTrueNasDiagnostics";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const runtimeRoots = ["app", "lib"] as const;
const sourceExtensions = new Set([
	".cjs",
	".js",
	".jsx",
	".mjs",
	".ts",
	".tsx",
]);
const legacyTrueNasRest = /\/api\/v2(?:[/?#"'`]|$)/;

async function runtimeSourceFiles(root: string): Promise<string[]> {
	const entries = await readdir(root, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map(async (entry) => {
			const path = join(root, entry.name);
			if (entry.isDirectory()) return runtimeSourceFiles(path);
			return sourceExtensions.has(extname(entry.name)) ? [path] : [];
		}),
	);
	return nested.flat();
}

function ownsTrueNasRuntime(path: string, source: string): boolean {
	return (
		/truenas/i.test(path) ||
		/\bTrueNAS\b/i.test(source) ||
		/\bTRUENAS_[A-Z0-9_]+\b/.test(source)
	);
}

test("maintained TrueNAS runtime code cannot reintroduce legacy /api/v2 REST endpoints", async () => {
	const files = (
		await Promise.all(
			runtimeRoots.map((root) =>
				runtimeSourceFiles(join(repositoryRoot, root)),
			),
		)
	).flat();
	const violations: string[] = [];

	for (const file of files) {
		const source = await readFile(file, "utf8");
		if (!ownsTrueNasRuntime(file, source)) continue;
		for (const [index, line] of source.split("\n").entries()) {
			if (legacyTrueNasRest.test(line)) {
				violations.push(`${relative(repositoryRoot, file)}:${index + 1}`);
			}
		}
	}

	assert.deepEqual(
		violations,
		[],
		`TrueNAS 26 requires JSON-RPC over WebSocket; legacy REST references found at ${violations.join(", ")}`,
	);
});

test("TrueNAS transport evidence preserves the observed WebSocket endpoint", () => {
	const evidence = readTrueNasTransportEvidence({
		target: "truenas",
		path_mode: "direct",
		websocket_uri: "wss://truenas.example.invalid/api/current",
		verify_ssl: true,
		stages: [],
	});

	assert.equal(
		evidence?.websocketUri,
		"wss://truenas.example.invalid/api/current",
	);
	assert.equal(evidence?.pathMode, "direct");
	assert.equal(evidence?.verifySsl, true);
});
