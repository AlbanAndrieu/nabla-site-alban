#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_FILE = path.join(process.cwd(), "messages", "en.json");
const TARGET_FILE = path.join(process.cwd(), "messages", "fr.json");

const apiUrl =
	process.env.LIBRETRANSLATE_URL?.trim() ||
	"https://libretranslate.com/translate";
const apiKey = process.env.LIBRETRANSLATE_API_KEY?.trim();

function flattenObject(input, prefix = "", output = {}) {
	for (const [key, value] of Object.entries(input)) {
		const next = prefix ? `${prefix}.${key}` : key;
		if (value && typeof value === "object" && !Array.isArray(value)) {
			flattenObject(value, next, output);
		} else {
			output[next] = String(value ?? "");
		}
	}
	return output;
}

function setByPath(target, dottedPath, value) {
	const keys = dottedPath.split(".");
	let cursor = target;
	for (const key of keys.slice(0, -1)) {
		if (!cursor[key] || typeof cursor[key] !== "object") {
			cursor[key] = {};
		}
		cursor = cursor[key];
	}
	cursor[keys[keys.length - 1]] = value;
}

async function translateOne(text) {
	const response = await fetch(apiUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			q: text,
			source: "en",
			target: "fr",
			format: "text",
			api_key: apiKey,
		}),
	});

	if (!response.ok) {
		throw new Error(`LibreTranslate HTTP ${response.status}`);
	}

	const payload = await response.json();
	const translated = payload?.translatedText;
	if (typeof translated !== "string" || translated.length === 0) {
		throw new Error("LibreTranslate returned empty translatedText");
	}
	return translated;
}

async function main() {
	const sourceRaw = await readFile(SOURCE_FILE, "utf8");
	const source = JSON.parse(sourceRaw);
	const flattened = flattenObject(source);
	const out = {};

	for (const [key, value] of Object.entries(flattened)) {
		// Keep key placeholders stable while translating complete text.
		const translated = await translateOne(value);
		setByPath(out, key, translated);
	}

	await mkdir(path.dirname(TARGET_FILE), { recursive: true });
	await writeFile(TARGET_FILE, `${JSON.stringify(out, null, 2)}\n`, "utf8");
	console.log(
		`Updated ${path.relative(process.cwd(), TARGET_FILE)} with LibreTranslate.`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
