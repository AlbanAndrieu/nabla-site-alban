import assert from "node:assert/strict";
import test from "node:test";
import { isSafePublicServiceId, isSafePublicText } from "../lib/homelabPublicTextSafety.ts";

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

test("rejects private paths wrapped in punctuation or key-value fields", () => {
  for (const value of [
    "OpenRAG (/mnt/cpool/compose/app.env)",
    "Configuration: /etc/ssl/private/server.key",
    "trace=/home/operator/.ssh/id_rsa",
    "service[/root/.kube/config]",
    "secret_file=/run/secrets/service-api",
    "container=/var/lib/docker/volumes/private",
    "code=/workspace/users/agent/project/.env",
  ]) assert.equal(isSafePublicText(value), false, value);
});

test("keeps ordinary public descriptions containing relative URLs", () => {
  for (const value of ["Documentation /docs/index", "Services /architecture", "Proxy /api/status"]) {
    assert.equal(isSafePublicText(value), true, value);
  }
});

test("public service IDs reject numbers, objects, empty and non-canonical values", () => {
  for (const value of [123, 0, true, [], {}, null, undefined, "", "Grafana", "service_name", "service/path", "service--child"]) {
    assert.equal(isSafePublicServiceId(value), false, String(value));
  }
  for (const value of ["grafana", "grafana-api", "a1-b2", "service-42"]) {
    assert.equal(isSafePublicServiceId(value), true, value);
  }
});
