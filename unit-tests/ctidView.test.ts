import assert from "node:assert/strict";
import test from "node:test";
import { selectCtidDigest } from "../lib/ctidDigest";
import { filterNews, newsCategory, type NewsFilters } from "../lib/ctidView";

const now = Date.parse("2026-11-28T12:00:00Z");
const filters: NewsFilters = { query: "", category: "all", severity: "all", days: 7, sort: "risk" };

test("CTID sorts critical recent APIM and Entra ID before informational news", () => {
	const digest = selectCtidDigest([
		{ title: "Microsoft Entra ID critical vulnerability", source: "Example", link: "https://example.com/entra", pubDate: "2026-11-27T12:00:00Z" },
		{ title: "Azure API Management actively exploited", source: "Example", link: "https://example.com/apim", pubDate: "2026-11-28T10:00:00Z" },
		{ title: "Kubernetes release", source: "Example", link: "https://example.com/k8s", pubDate: "2026-11-28T11:00:00Z" },
		{ title: "Old critical vulnerability", source: "Example", link: "https://example.com/old", pubDate: "2026-10-01T00:00:00Z" },
		{ title: "Undated critical vulnerability", source: "Example", link: "https://example.com/unknown" },
	]);
	const all = [...digest.homelab, ...digest.global, ...digest.other];
	const visible = filterNews(all, filters, now);
	assert.deepEqual(visible.map((item) => newsCategory(item)), ["api", "identity", "cloud"]);
	assert.deepEqual(visible.slice(0, 2).map((item) => item.severity), ["critical", "critical"]);
	assert.equal(filterNews(all, { ...filters, category: "identity" }, now).length, 1);
	assert.equal(filterNews(all, { ...filters, query: "apim" }, now).length, 1);
	assert.equal(filterNews(all, { ...filters, days: 0 }, now).length, 5);
	assert.equal(filterNews(all, { ...filters, sort: "date" }, now)[0].link, "https://example.com/k8s");
});
