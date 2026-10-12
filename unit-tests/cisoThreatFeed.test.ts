import assert from "node:assert/strict";
import test from "node:test";
import { normalizeArticle, rankArticles, safeArticleUrl, plainText } from "../lib/cisoThreatFeed";

test("blocks unsafe article schemes and private addresses", () => {
  for (const url of [
    "javascript:alert(1)", "http://example.com", "https://127.0.0.1/x",
    "https://172.17.0.24/x", "https://x.int.albandrieu.com",
  ]) {
    assert.equal(safeArticleUrl(url), null);
  }
  assert.equal(
    safeArticleUrl("https://example.com/post?utm_source=foo#section"),
    "https://example.com/post",
  );
});

test("normalizes untrusted summaries as plain text", () => {
  assert.equal(plainText("<script>alert(1)</script><b>Patch</b>"), "alert(1) Patch");
  assert.equal(normalizeArticle({ link: "https://example.com", title: "" }), null);
});

test("matches inventory terms on boundaries and de-duplicates tracking links", () => {
  const ranked = rankArticles([
    { title: "Critical Kubernetes CVE-2026-12345", link: "https://example.com/a", source: "CISA", summary: "<p>Docker affected</p>" },
    { title: "Critical Kubernetes CVE-2026-12345", link: "https://example.com/a?utm_source=rss", source: "Mirror" },
    { title: "Redispatch news unrelated", link: "https://example.com/b", source: "General" },
    { title: "Regular security brief", link: "https://example.com/c", source: "General" },
  ]);
  assert.equal(ranked.length, 3);
  assert.deepEqual(ranked[0].technologies, ["Kubernetes", "Docker"]);
  assert.equal(ranked[0].urgent, true);
  assert.deepEqual(ranked.find((entry) => entry.title.startsWith("Redispatch"))?.technologies, []);
  assert.ok(ranked[0].priority > ranked[1].priority);
});
