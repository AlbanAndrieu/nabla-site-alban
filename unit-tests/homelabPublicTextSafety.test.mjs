import assert from "node:assert/strict";
import test from "node:test";
import { isSafePublicText } from "../lib/homelabPublicTextSafety.ts";

test("accepts ordinary SERVICE display labels and descriptions", () => {
  assert.equal(isSafePublicText("Grafana", 150), true);
  assert.equal(isSafePublicText("État des services — monitoring"), true);
  assert.equal(isSafePublicText("Production Kubernetes"), true);
});

test("rejects addresses, URLs, private paths and embedded credentials", () => {
  for (const value of [
    "Grafana at http://172.17.0.24:9090",
    "172.17.0.24",
    "https://private.example/status",
    "tcp://service:9945",
    "monitor.int.albandrieu.com",
    "password=example-secret",
    "API_KEY:wrong",
    "token = abc",
    "private IPv6 fe80::1",
    "[fd00::1]:443",
    "configuration /mnt/cpool/secrets/runtime",
  ]) assert.equal(isSafePublicText(value), false, value);
});

test("rejects malformed and oversized display text", () => {
  for (const value of [null, undefined, {}, [], "", "   ", "bad\nheader", "a".repeat(501)]) {
    assert.equal(isSafePublicText(value), false);
  }
});
