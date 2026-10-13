import assert from "node:assert/strict";
import test from "node:test";
import { fetchFreshRssPublicArticles } from "../lib/server/freshRssPublic";

test("FreshRSS publication defaults to closed without explicit opt-in", async () => {
	const beforeEnabled = process.env.FRESHRSS_PUBLICATION_ENABLED;
	const beforeAuth = process.env.FRESHRSS_GREADER_AUTH;
	try {
		delete process.env.FRESHRSS_PUBLICATION_ENABLED;
		process.env.FRESHRSS_GREADER_AUTH = "dummy-fixture-value";
		assert.equal(await fetchFreshRssPublicArticles(), null);
	} finally {
		if (beforeEnabled === undefined)
			delete process.env.FRESHRSS_PUBLICATION_ENABLED;
		else process.env.FRESHRSS_PUBLICATION_ENABLED = beforeEnabled;
		if (beforeAuth === undefined) delete process.env.FRESHRSS_GREADER_AUTH;
		else process.env.FRESHRSS_GREADER_AUTH = beforeAuth;
	}
});

test("FreshRSS refuses articles outside the canonical OPML-approved subscription IDs", async () => {
	const previousEnabled = process.env.FRESHRSS_PUBLICATION_ENABLED;
	const previousAuth = process.env.FRESHRSS_GREADER_AUTH;
	const previousFetch = globalThis.fetch;
	try {
		process.env.FRESHRSS_PUBLICATION_ENABLED = "true";
		process.env.FRESHRSS_GREADER_AUTH = "dummy-fixture-value";
		globalThis.fetch = async (input) => {
			const path = String(input);
			if (path.includes("/subscription/list")) {
				return Response.json({
					subscriptions: [
						{ id: "feed/approved", url: "https://kubernetes.io/feed.xml" },
						{ id: "feed/additional", url: "https://www.bleepingcomputer.com/feed/" },
						{
							id: "feed/unapproved",
							url: "https://private.example.com/feed.xml",
						},
					],
				});
			}
			return Response.json({
				items: [
					{
						title: "Kubernetes security bulletin",
						canonical: [{ href: "https://example.org/public" }],
						origin: { title: "Kubernetes", streamId: "feed/approved" },
					},
					{
						title: "Additional public feed",
						canonical: [{ href: "https://example.org/additional" }],
						origin: { title: "BleepingComputer", streamId: "feed/additional" },
					},
					{
						title: "Private homelab finding",
						canonical: [{ href: "https://example.org/private" }],
						origin: { title: "Private", streamId: "feed/unapproved" },
					},
					{
						title: "Missing origin: deny",
						canonical: [{ href: "https://example.org/missing" }],
					},
				],
			});
		};
		const articles = await fetchFreshRssPublicArticles();
		assert.deepEqual(
			articles?.map((article) => article.title),
			["Kubernetes security bulletin", "Additional public feed"],
		);
	} finally {
		globalThis.fetch = previousFetch;
		if (previousEnabled === undefined)
			delete process.env.FRESHRSS_PUBLICATION_ENABLED;
		else process.env.FRESHRSS_PUBLICATION_ENABLED = previousEnabled;
		if (previousAuth === undefined) delete process.env.FRESHRSS_GREADER_AUTH;
		else process.env.FRESHRSS_GREADER_AUTH = previousAuth;
	}
});
