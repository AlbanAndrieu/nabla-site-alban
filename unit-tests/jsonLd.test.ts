import assert from "node:assert/strict";
import test from "node:test";

import { serializeJsonLd } from "../components/JsonLd";

test("serializeJsonLd escapes markup that could terminate its script", () => {
  const serialized = serializeJsonLd({
    "@context": "https://schema.org",
    name: "</script><script>alert(1)</script>",
  });

  assert.doesNotMatch(serialized, /</);
  assert.match(serialized, /\\u003c\/script>/);
});
