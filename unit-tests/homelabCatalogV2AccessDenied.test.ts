import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  fetchSiteCatalogV2,
  SiteCatalogV2Error,
  SITE_CATALOG_V2_URL,
} from "../lib/homelabSiteCatalog";

const originalKey = process.env.DIAGNOSTICS_ACCESS_KEY;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (originalKey === undefined) delete process.env.DIAGNOSTICS_ACCESS_KEY;
  else process.env.DIAGNOSTICS_ACCESS_KEY = originalKey;
  globalThis.fetch = originalFetch;
});

test("deliberately invalid Vercel diagnostics key fails closed (401), no fallback or disclosure", async () => {
  process.env.DIAGNOSTICS_ACCESS_KEY = "1234"; // intentional fake test fixture only
  let requests = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests++;
    assert.equal(String(input), SITE_CATALOG_V2_URL);
    assert.equal(new Headers(init?.headers).get("X-Diagnostics-Key"), "1234");
    assert.equal(init?.redirect, "error");
    assert.equal(init?.cache, "no-store");
    return new Response(JSON.stringify({ detail: "credential rejected" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  await assert.rejects(fetchSiteCatalogV2(), (error: unknown) => {
    assert.ok(error instanceof SiteCatalogV2Error);
    assert.equal(error.reason, "access-denied");
    assert.doesNotMatch(error.message, /1234|credential rejected/);
    return true;
  });
  assert.equal(requests, 1, "must not retry or fall back to a public catalog");
});

test("403 remains access-denied and a non-deployed v2 endpoint (404) is unavailable", async () => {
  process.env.DIAGNOSTICS_ACCESS_KEY = "1234";
  for (const [status, expected] of [[403, "access-denied"], [404, "unavailable"]] as const) {
    globalThis.fetch = (async () => new Response(null, { status })) as typeof fetch;
    await assert.rejects(fetchSiteCatalogV2(), (error: unknown) => {
      assert.ok(error instanceof SiteCatalogV2Error);
      assert.equal(error.reason, expected);
      return true;
    });
  }
});

test("missing key never contacts the upstream", async () => {
  delete process.env.DIAGNOSTICS_ACCESS_KEY;
  globalThis.fetch = (async () => {
    throw new Error("must not call the API without a server-only key");
  }) as typeof fetch;
  await assert.rejects(fetchSiteCatalogV2(), (error: unknown) => {
    assert.ok(error instanceof SiteCatalogV2Error);
    assert.equal(error.reason, "key-missing");
    return true;
  });
});
