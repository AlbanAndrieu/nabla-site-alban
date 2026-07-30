import assert from "node:assert/strict";
import test from "node:test";

import { PRICING_TIERS } from "../lib/pricingTiers";

test("pricing tiers stay complete and aligned across locales", () => {
  const englishIds = PRICING_TIERS.en.map(({ id }) => id);
  const frenchIds = PRICING_TIERS.fr.map(({ id }) => id);

  assert.deepEqual(frenchIds, englishIds);
  assert.equal(new Set(englishIds).size, englishIds.length);
  assert.ok(
    [...PRICING_TIERS.en, ...PRICING_TIERS.fr].every(
      (tier) => tier.bullets.length >= 3 && tier.href.length > 0,
    ),
  );
});
