import assert from "node:assert/strict";
import test from "node:test";
import { githubStarsFromResponse } from "../app/fetchGithubStars";

test("githubStarsFromResponse accepts a non-negative integer", () => {
  assert.equal(githubStarsFromResponse({ stargazers_count: 42 }), 42);
  assert.equal(githubStarsFromResponse({ stargazers_count: 0 }), 0);
});

test("githubStarsFromResponse rejects malformed GitHub responses", () => {
  for (const payload of [
    null,
    {},
    { stargazers_count: "42" },
    { stargazers_count: -1 },
    { stargazers_count: 1.5 },
  ]) {
    assert.throws(() => githubStarsFromResponse(payload), /stargazers_count/);
  }
});
