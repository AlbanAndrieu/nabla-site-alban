import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = resolve(projectRoot, "public");
const vendorRoot = resolve(publicRoot, "assets/fontawesome-free-7.1.0-web");
const cssVendorRoot = resolve(publicRoot, "assets/fontawesome");

const retainedVendorFiles = [
	"LICENSE.txt",
	"js/brands.js",
	"js/fontawesome.js",
	"js/solid.js",
	"svgs/brands/linkedin-in.svg",
	"svgs/brands/react.svg",
] as const;

const retainedCssVendorFiles = [
	"css/brands.css",
	"css/fontawesome.css",
	"css/solid.css",
	"webfonts/fa-brands-400.woff2",
	"webfonts/fa-solid-900.woff2",
] as const;

async function collectFiles(
	root: string,
	options: { skipAssets?: boolean } = {},
): Promise<string[]> {
	const files: string[] = [];

	async function walk(directory: string): Promise<void> {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const absolute = resolve(directory, entry.name);
			if (entry.isDirectory()) {
				if (
					options.skipAssets &&
					directory === publicRoot &&
					entry.name === "assets"
				) {
					continue;
				}
				await walk(absolute);
				continue;
			}
			if (entry.isFile()) {
				files.push(relative(root, absolute).replaceAll("\\", "/"));
			}
		}
	}

	await walk(root);
	return files.sort();
}

async function sourceFiles(): Promise<string[]> {
	const roots = ["app", "components", "lib"].map((path) =>
		resolve(projectRoot, path),
	);
	return [
		...(await collectFiles(publicRoot, { skipAssets: true })).map((path) =>
			resolve(publicRoot, path),
		),
		...(
			await Promise.all(
				roots.map(async (root) =>
					(await collectFiles(root)).map((path) => resolve(root, path)),
				),
			)
		).flat(),
	].filter((path) =>
		[".html", ".js", ".ts", ".tsx"].some((extension) =>
			path.endsWith(extension),
		),
	);
}

test("vendored Font Awesome runtime keeps only files consumed by Alban", async () => {
	assert.deepEqual(await collectFiles(vendorRoot), retainedVendorFiles);
});

test("Font Awesome CSS runtime keeps only loaded styles and their webfonts", async () => {
	assert.deepEqual(await collectFiles(cssVendorRoot), retainedCssVendorFiles);

	const [brands, solid] = await Promise.all([
		readFile(resolve(cssVendorRoot, "css/brands.css"), "utf8"),
		readFile(resolve(cssVendorRoot, "css/solid.css"), "utf8"),
	]);
	assert.match(brands, /fa-brands-400\.woff2/);
	assert.match(solid, /fa-solid-900\.woff2/);
});

test("project consumers only reference retained Font Awesome JS and SVG assets", async () => {
	const referenced = new Set<string>();
	const pattern = /\/?assets\/fontawesome-free-7\.1\.0-web\/([^"'?\s<]+)/g;

	for (const path of await sourceFiles()) {
		const source = await readFile(path, "utf8");
		for (const match of source.matchAll(pattern)) {
			referenced.add(match[1]);
		}
	}

	assert.deepEqual([...referenced].sort(), [
		"js/brands.js",
		"js/fontawesome.js",
		"js/solid.js",
		"svgs/brands/linkedin-in.svg",
		"svgs/brands/react.svg",
	]);
});

test("Next and legacy consumers only reference retained Font Awesome CSS", async () => {
	const referenced = new Set<string>();
	const pattern = /\/assets\/fontawesome\/([^"'?\s<]+)/g;

	for (const path of await sourceFiles()) {
		const source = await readFile(path, "utf8");
		for (const match of source.matchAll(pattern)) {
			referenced.add(match[1]);
		}
	}

	assert.deepEqual([...referenced].sort(), [
		"css/brands.css",
		"css/fontawesome.css",
		"css/solid.css",
	]);
});
