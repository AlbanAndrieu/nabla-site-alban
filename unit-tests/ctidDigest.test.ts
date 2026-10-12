import assert from "node:assert/strict";
import test from "node:test";
import { rankArticles } from "../lib/cisoThreatFeed";
import { editorialSeverity, selectCtidDigest } from "../lib/ctidDigest";

test("CTID ranks signals editorially without claiming technical evidence", () => {
	const articles = rankArticles([
		{
			link: "https://example.com/a",
			title: "Actively exploited Kubernetes zero-day",
			source: "CERT",
		},
		{
			link: "https://example.com/b",
			title: "Security research update",
			source: "News",
		},
	]);
	assert.equal(editorialSeverity(articles[0]), "critical");
	assert.equal(editorialSeverity(articles[1]), "informational");
});

test("CTID selects up to ten distinct priorities in two categories and keeps the rest", () => {
	const articles = Array.from({ length: 16 }, (_, index) => ({
		title:
			index % 2 === 0
				? `Kubernetes CVE-2026-${1000 + index}`
				: `General security bulletin ${index}`,
		link: `https://example.com/${index}`,
		source: "CERT",
	}));
	const digest = selectCtidDigest(articles);
	assert.equal(digest.homelab.length + digest.global.length, 10);
	assert.equal(digest.other.length, 6);
	assert.ok(
		digest.homelab.every((article) =>
			article.technologies.includes("Kubernetes"),
		),
	);
	assert.ok(digest.global.every((article) => !article.technologies.length));
	assert.ok(digest.homelab.every((article) => article.serviceIds.length === 0));
});

test("CTID assigns service links only for known public TrueNAS anchors", () => {
	const digest = selectCtidDigest([
		{
			link: "https://example.com/postgres",
			title: "PostgreSQL vulnerability",
			source: "CERT",
		},
	]);
	assert.deepEqual(digest.homelab[0].serviceIds, ["postgresql"]);
});
