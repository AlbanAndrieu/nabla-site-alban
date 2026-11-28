import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { rankArticles, type FeedItem } from "../lib/cisoThreatFeed";
import {
  joinClassifiedArticles,
  validClassifiedFeed,
} from "../lib/server/rssRelevancePublic";

const hash = (stream: string, id: string) =>
  createHash("sha256").update(stream + "\0" + id, "utf8").digest("hex");
const REVISION = "sha256:" + "a".repeat(64);

const article = (title: string, id: string): FeedItem => ({
  link: "https://example.com/" + id,
  title,
  source: "CERT",
  rssId: hash("feed/approved", id),
});

test("opaque GReader identity uses Python-compatible SHA-256(streamId NUL id)", () => {
  const identity = hash("feed/public", "article-1");
  assert.match(identity, /^[0-9a-f]{64}$/);
  assert.notEqual(identity, hash("feed/private", "article-1"));
  assert.notEqual(identity, hash("feed/public", "article-2"));
});

test("rejects malformed, duplicate, private or over-broad AI decisions", () => {
  const valid = {
    schemaVersion: 1 as const,
    model: "rss-relevance" as const,
    catalogRevision: REVISION,
    promptVersion: 3,
    items: [{ article_id: hash("feed/approved", "a"), matched: ["traefik"] }],
  };
  assert.equal(validClassifiedFeed(valid), true);
  for (const invalid of [
    { ...valid, catalogRevision: "invalid" },
    { ...valid, promptVersion: 0 },
    { ...valid, items: [{ article_id: "https://internal", matched: ["traefik"] }] },
    { ...valid, items: [{ ...valid.items[0], reason: "secret" }] },
    { ...valid, items: [{ ...valid.items[0], matched: ["../../secret"] }] },
    { ...valid, items: [...valid.items, ...valid.items] },
  ]) assert.equal(validClassifiedFeed(invalid), false);
});

test("AI filters only articles already approved by FreshRSS server allowlist", () => {
  const a = article("CVE-2026-1111 patch", "a");
  const b = article("General news", "b");
  const unknown = article("Not approved", "private");
  const result = joinClassifiedArticles([a, b], {
    schemaVersion: 1,
    model: "rss-relevance",
    catalogRevision: REVISION,
    promptVersion: 3,
    items: [
      { article_id: a.rssId!, matched: ["traefik", "kubernetes"] },
      { article_id: unknown.rssId!, matched: ["redis"] },
    ],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].title, a.title);
  assert.deepEqual(result[0].aiTechnologies, ["traefik", "kubernetes"]);
  assert.deepEqual(rankArticles(result)[0].technologies, ["traefik", "kubernetes"]);
  assert.ok(!result[0].summary);
});

test("an accepted empty AI selection is not an implicit unfiltered fallback", () => {
  assert.deepEqual(joinClassifiedArticles([article("General news", "b")], {
    schemaVersion: 1,
    model: "rss-relevance",
    catalogRevision: REVISION,
    promptVersion: 3,
    items: [],
  }), []);
});
