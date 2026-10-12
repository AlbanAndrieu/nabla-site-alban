#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = new URL("../data/security/security-feeds.opml", import.meta.url);
const destination = new URL("../public/ciso-rss-feeds.json", import.meta.url);

function decodeXmlEntities(value) {
	return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (match, entity) => {
		const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
		if (Object.hasOwn(named, entity)) return named[entity];
		if (entity.startsWith("#")) {
			const radix = entity[1]?.toLowerCase() === "x" ? 16 : 10;
			const numeric = Number.parseInt(entity.slice(radix === 16 ? 2 : 1), radix);
			if (numeric > 0 && numeric <= 0x10ffff && !(numeric >= 0xd800 && numeric <= 0xdfff)) {
				return String.fromCodePoint(numeric);
			}
		}
		throw new Error(`Invalid XML entity: ${match}`);
	});
}

export function opmlToFeedUrls(xml) {
	if (!/<opml\s[^>]*version="2\.0"/i.test(xml) || !/<body\s*>/i.test(xml)) {
		throw new Error("Expected OPML 2.0 document with a body");
	}
	const urls = [];
	const seen = new Set();
	for (const match of xml.matchAll(/<outline\b[^>]*\bxmlUrl="([^"]+)"[^>]*\/?\s*>/gi)) {
		const value = decodeXmlEntities(match[1]);
		const url = new URL(value);
		if (url.protocol !== "https:" || url.username || url.password || url.hash) {
			throw new Error(`Unsafe or non-HTTPS RSS URL: ${value}`);
		}
		if (seen.has(url.href)) throw new Error(`Duplicate RSS URL: ${value}`);
		seen.add(url.href);
		urls.push(url.href);
	}
	if (!urls.length) throw new Error("No RSS feeds found in OPML");
	return urls;
}

export function generateFeedsJson(xml) {
	return `${JSON.stringify({ feeds: opmlToFeedUrls(xml) }, null, "\t")}\n`;
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invoked) {
	const output = generateFeedsJson(readFileSync(source, "utf8"));
	if (process.argv.includes("--check")) {
		if (readFileSync(destination, "utf8") !== output) {
			console.error("RSS JSON differs from the authoritative OPML; run node scripts/generate-security-rss.mjs");
			process.exitCode = 1;
		} else {
			console.log("RSS JSON matches authoritative OPML");
		}
	} else {
		writeFileSync(destination, output);
		console.log(`Generated ${fileURLToPath(destination)}`);
	}
}
