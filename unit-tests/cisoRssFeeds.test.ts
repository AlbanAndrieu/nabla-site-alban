import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const FEEDS_CONFIG = new URL("../public/ciso-rss-feeds.json", import.meta.url);

test("CISO RSS configuration contains valid feed URLs", async () => {
	const configSource = await readFile(FEEDS_CONFIG, "utf8");
	const config = JSON.parse(configSource) as { feeds?: unknown };

	assert.ok(
		Array.isArray(config.feeds),
		"The RSS configuration must expose a feeds array",
	);
	assert.ok(config.feeds.length > 0, "The feeds array must not be empty");
	assert.ok(config.feeds.every((feed) => typeof feed === "string"));
	assert.ok(
		config.feeds.every((feed) => /^https?:\/\//.test(feed)),
		"Every feed must use an HTTP(S) URL",
	);
	assert.ok(
		config.feeds.every((feed) => !feed.includes("&amp;")),
		"Feed URLs must contain decoded query separators",
	);
});
