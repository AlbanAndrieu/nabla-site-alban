import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const reviewedInstallScriptVersions = {
	"@parcel/watcher": ["2.6.0"],
	"@swc/core": ["1.15.46"],
	esbuild: ["0.28.1"],
	fsevents: ["2.3.2", "2.3.3"],
	"unrs-resolver": ["1.11.1"],
} as const;

function packageNameFromLockPath(path: string) {
	const marker = "node_modules/";
	const index = path.lastIndexOf(marker);
	return index === -1 ? "" : path.slice(index + marker.length);
}

test("npm install scripts stay explicitly denied and strict", async () => {
	const [packageJsonSource, lockSource, npmrc, workflow] = await Promise.all([
		readFile(new URL("../package.json", import.meta.url), "utf8"),
		readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
		readFile(new URL("../.npmrc", import.meta.url), "utf8"),
		readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
	]);
	const packageJson = JSON.parse(packageJsonSource) as {version?: string; engines?: {npm?: string}; allowScripts?: Record<string, boolean>};
	const lock = JSON.parse(lockSource) as {version?: string; packages: Record<string, {version?: string; hasInstallScript?: boolean}>};

	assert.equal(packageJson.engines?.npm, ">=11.17.0 <12");
	assert.deepEqual(packageJson.allowScripts, {"@parcel/watcher": false, "@swc/core": false, esbuild: false, fsevents: false, "unrs-resolver": false});
	assert.match(npmrc, /^strict-allow-scripts=true$/m);
	assert.doesNotMatch(npmrc, /dangerously-allow-all-scripts\s*=\s*true/);
	assert.match(workflow, /- "\.npmrc"/);
	assert.equal(lock.version, packageJson.version);
	assert.equal(lock.packages[""]?.version, packageJson.version);

	const installed = new Map<string, string[]>();
	for (const [path, metadata] of Object.entries(lock.packages)) {
		if (metadata.hasInstallScript !== true) continue;
		const name = packageNameFromLockPath(path);
		assert.equal(packageJson.allowScripts?.[name], false, `${name} has an install script but is not explicitly denied`);
		if (!metadata.version) continue;
		installed.set(name, [...(installed.get(name) ?? []), metadata.version]);
	}
	for (const [name, expected] of Object.entries(reviewedInstallScriptVersions)) {
		assert.deepEqual([...(installed.get(name) ?? [])].sort(), [...expected].sort(), `${name} install-script versions changed and require explicit review`);
	}
});
