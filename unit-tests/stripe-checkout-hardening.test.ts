import assert from "node:assert/strict";
import test from "node:test";
import {
  checkoutLocale,
  checkoutReturnUrls,
  originFromDomainEnv,
} from "../app/api/create-checkout-session/route";

test("Stripe return origin rejects credentials, paths and query fragments", () => {
  assert.equal(originFromDomainEnv("https://example.com/checkout"), null);
  assert.equal(originFromDomainEnv("https://example.com/?next=https://evil.test"), null);
  assert.equal(originFromDomainEnv("https://example.com/#fragment"), null);
  assert.equal(originFromDomainEnv("https://user:pass@example.com"), null);
  assert.equal(originFromDomainEnv("javascript:alert(1)"), null);
});

test("Stripe return origin only uses configured scheme and authority", () => {
  assert.equal(originFromDomainEnv(" https://example.com/ "), "https://example.com");
  assert.equal(originFromDomainEnv("https://example.com:8443"), "https://example.com:8443");
});

test("Stripe checkout locale is constrained and return URLs are deterministic", () => {
  assert.equal(checkoutLocale("fr"), "fr");
  assert.equal(checkoutLocale("de"), "en");
  assert.deepEqual(checkoutReturnUrls("https://example.com", "fr"), {
    successUrl: "https://example.com/fr/success?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "https://example.com/fr/cancel",
  });
});
