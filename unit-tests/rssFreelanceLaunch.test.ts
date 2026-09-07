import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("RSS promotes the independent consulting launch with quote paths and a social image", async () => {
	const feed = await readFile(new URL("../public/feed.xml", import.meta.url), "utf8");

	assert.match(feed, /xmlns:media="http:\/\/search\.yahoo\.com\/mrss\/"/);
	assert.ok(feed.includes("<lastBuildDate>Mon, 07 Sep 2026 00:00:00 GMT</lastBuildDate>"));

	const launchIndex = feed.indexOf("Alban Andrieu launches freelance consulting");
	const previousItemIndex = feed.indexOf("Workstation Docker Compose");
	assert.ok(launchIndex >= 0, "freelance launch item should exist");
	assert.ok(
		previousItemIndex >= 0 && launchIndex < previousItemIndex,
		"freelance launch should be the newest RSS item",
	);

	for (const expected of [
		"https://albanandrieu.com/expertise",
		"https://albanandrieu.com/pricing",
		"https://albanandrieu.com/startup",
		"https://albanandrieu.com/contact",
		"tag:albanandrieu.com,2026-09-07:freelance-launch",
		"Request%20a%20quote",
	]) {
		assert.ok(feed.includes(expected), expected);
	}

	assert.match(feed, /<media:content[\s\S]*\/api\/social-card\?/);
	assert.ok(feed.includes('medium="image"'));
	assert.ok(feed.includes('type="image/png"'));
	assert.ok(feed.includes('width="1200"'));
	assert.ok(feed.includes('height="630"'));
});
