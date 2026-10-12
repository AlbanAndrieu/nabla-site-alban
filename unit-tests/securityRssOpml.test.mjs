import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { generateFeedsJson, opmlToFeedUrls } from "../scripts/generate-security-rss.mjs";

const source = readFileSync(new URL("../data/security/security-feeds.opml", import.meta.url), "utf8");
const published = readFileSync(new URL("../public/ciso-rss-feeds.json", import.meta.url), "utf8");

test("published security RSS JSON is byte-identical to generated OPML output", () => {
	assert.equal(generateFeedsJson(source), published);
});

test("OPML security sources are HTTPS, unique and non-empty", () => {
	const urls = opmlToFeedUrls(source);
	assert.ok(urls.length > 0);
	assert.equal(urls.length, new Set(urls).size);
	assert.ok(urls.every((url) => url.startsWith("https://")));
});

test("rejects duplicate URLs and insecure sources", () => {
	const xml = (urls) => `<opml version="2.0"><body>${urls
		.map((url) => `<outline type="rss" xmlUrl="${url}"/>`)
		.join("")}</body></opml>`;
	assert.throws(() => opmlToFeedUrls(xml(["https://example.com/a", "https://example.com/a"])), /Duplicate/);
	assert.throws(() => opmlToFeedUrls(xml(["http://example.com/"])), /Unsafe/);
	assert.throws(() => opmlToFeedUrls(xml(["https://user:secret@example.com/"])), /Unsafe/);
});
