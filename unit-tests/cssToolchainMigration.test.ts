import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";

async function cssFiles(directory: URL): Promise<URL[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const url = new URL(
				entry.isDirectory() ? `${entry.name}/` : entry.name,
				directory,
			);
			if (entry.isDirectory()) {
				return cssFiles(url);
			}
			return entry.isFile() && entry.name.endsWith(".css") ? [url] : [];
		}),
	);
	return files.flat();
}

test("project-owned CSS toolchain remains Tailwind free", async () => {
	const [globals, reset, packageRaw, lockRaw] = await Promise.all([
		readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
		readFile(new URL("../app/reset.css", import.meta.url), "utf8"),
		readFile(new URL("../package.json", import.meta.url), "utf8"),
		readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
	]);
	const pkg = JSON.parse(packageRaw) as {
		devDependencies?: Record<string, string>;
	};
	const lock = JSON.parse(lockRaw) as {
		packages?: Record<
			string,
			{ devDependencies?: Record<string, string> } | undefined
		>;
	};

	assert.match(globals, /^@import "\.\/reset\.css";$/m);
	assert.doesNotMatch(
		globals,
		/tailwindcss|@(?:apply|theme|utility|source|variant|custom-variant)\b/,
	);
	assert.doesNotMatch(
		reset,
		/--theme\(|@import\s+["']tailwindcss|@(?:apply|theme|utility|source|variant|custom-variant)\b/,
	);
	assert.match(reset, /box-sizing:\s*border-box/);
	assert.match(reset, /h1,[\s\S]*h6[\s\S]*font-size:\s*inherit/);
	assert.match(reset, /ol,[\s\S]*menu[\s\S]*list-style:\s*none/);
	assert.match(reset, /img,[\s\S]*object[\s\S]*display:\s*block/);
	assert.match(
		reset,
		/\[hidden\]:where\(:not\(\[hidden="until-found"\]\)\)[\s\S]*display:\s*none !important/,
	);

	assert.equal(pkg.devDependencies?.tailwindcss, undefined);
	assert.equal(pkg.devDependencies?.["@tailwindcss/postcss"], undefined);
	await assert.rejects(
		access(new URL("../postcss.config.mjs", import.meta.url)),
		(error: unknown) =>
			error instanceof Error && "code" in error && error.code === "ENOENT",
	);

	const lockRoot = lock.packages?.[""];
	assert.equal(lockRoot?.devDependencies?.tailwindcss, undefined);
	assert.equal(lockRoot?.devDependencies?.["@tailwindcss/postcss"], undefined);
	const tailwindPackages = Object.keys(lock.packages ?? {}).filter(
		(name) =>
			name === "node_modules/tailwindcss" ||
			name.startsWith("node_modules/@tailwindcss/"),
	);
	assert.deepEqual(tailwindPackages, []);
});

test("maintained CSS no longer imports Tailwind or uses Tailwind directives", async () => {
	const roots = [
		new URL("../app/", import.meta.url),
		new URL("../components/", import.meta.url),
	];
	const files = (await Promise.all(roots.map(cssFiles))).flat();
	const tailwindDirective =
		/@(apply|theme|utility|source|variant|custom-variant)\b/;
	const tailwindImport =
		/@import\s+["'][^"']*tailwindcss|tailwindcss\/(?:preflight|theme|utilities)\.css/;

	for (const file of files) {
		const source = await readFile(file, "utf8");
		assert.doesNotMatch(
			source,
			tailwindDirective,
			`${file.pathname} must stay Tailwind-directive free`,
		);
		assert.doesNotMatch(
			source,
			tailwindImport,
			`${file.pathname} must not import Tailwind CSS layers`,
		);
	}
});
