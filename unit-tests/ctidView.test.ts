import assert from "node:assert/strict";
import test from "node:test";
import { selectCtidDigest } from "../lib/ctidDigest";
import {
	filterNews,
	type NewsFilters,
	newsCategory,
	recentSummary,
} from "../lib/ctidView";

const now = Date.parse("2026-11-28T12:00:00Z");
const filters: NewsFilters = {
	query: "",
	category: "all",
	severity: "all",
	days: 7,
	sort: "risk",
};

test("CTID sorts critical recent APIM and Entra ID before informational news", () => {
	const digest = selectCtidDigest([
		{
			title: "Microsoft Entra ID critical vulnerability",
			source: "Example",
			link: "https://example.com/entra",
			pubDate: "2026-11-27T12:00:00Z",
		},
		{
			title: "Azure API Management actively exploited",
			source: "Example",
			link: "https://example.com/apim",
			pubDate: "2026-11-28T10:00:00Z",
		},
		{
			title: "Kubernetes release",
			source: "Example",
			link: "https://example.com/k8s",
			pubDate: "2026-11-28T11:00:00Z",
		},
		{
			title: "Old critical vulnerability",
			source: "Example",
			link: "https://example.com/old",
			pubDate: "2026-10-01T00:00:00Z",
		},
		{
			title: "Undated critical vulnerability",
			source: "Example",
			link: "https://example.com/unknown",
		},
	]);
	const all = [...digest.homelab, ...digest.global, ...digest.other];
	const visible = filterNews(all, filters, now);
	assert.deepEqual(
		visible.map((item) => newsCategory(item)),
		["api", "identity", "cloud"],
	);
	assert.deepEqual(
		visible.slice(0, 2).map((item) => item.severity),
		["critical", "critical"],
	);
	assert.equal(
		filterNews(all, { ...filters, category: "identity" }, now).length,
		1,
	);
	assert.equal(filterNews(all, { ...filters, query: "apim" }, now).length, 1);
	assert.equal(filterNews(all, { ...filters, days: 0 }, now).length, 5);
	assert.equal(
		filterNews(all, { ...filters, sort: "date" }, now)[0].link,
		"https://example.com/k8s",
	);
});

test("24-hour counters and source filters count only the retrieved recent articles", () => {
	const digest = selectCtidDigest([
		{
			title: "APIM critical vulnerability",
			link: "https://example.com/api",
			source: "Microsoft",
			pubDate: "2026-11-28T10:00:00Z",
		},
		{
			title: "Entra ID CVE-2026-1234",
			link: "https://example.com/id",
			source: "CERT",
			pubDate: "2026-11-28T09:00:00Z",
		},
		{
			title: "Old critical vulnerability",
			link: "https://example.com/old",
			source: "CERT",
			pubDate: "2026-11-25T09:00:00Z",
		},
	]);
	const all = [...digest.homelab, ...digest.global, ...digest.other];
	assert.deepEqual(recentSummary(all, now), {
		total: 2,
		critical: 1,
		high: 1,
		api: 1,
		identity: 1,
	});
	assert.equal(
		filterNews(all, { ...filters, source: "Microsoft" }, now).length,
		1,
	);
});
