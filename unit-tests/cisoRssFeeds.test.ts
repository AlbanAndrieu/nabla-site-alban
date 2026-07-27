import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const LEGACY_PAGE = new URL("../public/ciso.html", import.meta.url);
const FEEDS_CONFIG = new URL("../public/ciso-rss-feeds.json", import.meta.url);

function extractLegacyFeeds(html: string): string[] {
	const arrayStart = html.indexOf("const rssFeeds = [");
	const arrayEnd = html.indexOf("];", arrayStart);
	assert.notEqual(arrayStart, -1, "The legacy RSS array must exist");
	assert.notEqual(arrayEnd, -1, "The legacy RSS array must be closed");

	return html
		.slice(arrayStart, arrayEnd)
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.startsWith('"'))
		.map((line) => JSON.parse(line.replace(/,$/, "")) as string);
}

test("CISO RSS JSON preserves every feed from the static reference", async () => {
	const [html, configSource] = await Promise.all([
		readFile(LEGACY_PAGE, "utf8"),
		readFile(FEEDS_CONFIG, "utf8"),
	]);
	const config = JSON.parse(configSource) as { feeds?: unknown };

	assert.ok(
		Array.isArray(config.feeds),
		"The RSS configuration must expose a feeds array",
	);
	assert.deepEqual(config.feeds, extractLegacyFeeds(html));
	assert.ok(config.feeds.every((feed) => typeof feed === "string"));
});
