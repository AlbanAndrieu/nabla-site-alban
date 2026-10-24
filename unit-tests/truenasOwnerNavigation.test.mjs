import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { observedOwnerServiceNavigation } from "../lib/homelabOwnerServiceNavigation.ts";

const service = {
  id: "gatus", name: "Gatus", entityRef: "component:default/gatus",
  endpointEnabled: false,
};
const entry = {
  id: "gatus", name: "Gatus", url: "https://gatus.albandrieu.com/",
  reachable: true, http_status: 200, state: "ok",
  tunnel_status: "HEALTHY", runtime_state: "RUNNING",
};
const snapshot = {
  schema_version: 5, checked_at: "2026-10-24T12:00:00Z",
  services: [entry],
  internal_services: [{
    id: "gatus", name: "Gatus", host: "172.17.0.24",
    port: 8085, reachable: true, state: "ok",
  }],
};

test("only an OWNER snapshot can produce navigable targets", () => {
  assert.equal(observedOwnerServiceNavigation(service, null).externalUrl, "");
  assert.equal(observedOwnerServiceNavigation(service, null).service.endpointEnabled, false);
  const result = observedOwnerServiceNavigation(service, snapshot);
  assert.equal(result.externalUrl, "https://gatus.albandrieu.com/");
  assert.equal(result.service.endpointEnabled, true);
  assert.equal(result.service.external, true);
  assert.equal(result.service.tunnelSecure, true);
  assert.equal(result.service.internalHost, "172.17.0.24");
  assert.equal(result.service.internalPort, 8085);
  assert.equal(result.internalProtocolObserved, false);
});

test("internal-only probe cannot become an external or guessed hostname link", () => {
  const privateOnly = { ...snapshot, services: [{ ...entry, url: "http://172.17.0.24:8085" }] };
  const result = observedOwnerServiceNavigation(service, privateOnly);
  assert.equal(result.externalUrl, "");
  assert.equal(result.service.endpointEnabled, false);
  assert.equal(result.service.internalSecure, false);
  assert.equal(result.internalProtocolObserved, true);
});

test("unmatched, malformed and credentialed endpoints fail closed", () => {
  assert.equal(observedOwnerServiceNavigation({ id: "missing", name: "Missing", endpointEnabled: false }, snapshot).externalUrl, "");
  for (const url of ["javascript:alert(1)", "https://user:password@example.com", "not-a-url"]) {
    const bad = { ...snapshot, services: [{ ...entry, url }] };
    assert.equal(observedOwnerServiceNavigation(service, bad).externalUrl, "");
  }
  const duplicate = { ...snapshot, services: [entry, entry] };
  assert.equal(observedOwnerServiceNavigation(service, duplicate).externalUrl, "");
});

test("public cards cannot show owner evidence or clickable private endpoints", () => {
  const root = new URL("../", import.meta.url);
  const grid = readFileSync(new URL("app/components/homelab/HomelabServiceGrid.tsx", root), "utf8");
  const card = readFileSync(new URL("app/components/homelab/HomelabServiceCard.tsx", root), "utf8");
  const block = readFileSync(new URL("app/components/homelab/HomelabServicesBlock.tsx", root), "utf8");
  assert.match(grid, /readOnly \? null : snapshot/);
  assert.match(grid, /readOnly=\{readOnly\}/);
  assert.match(block, /readOnly=\{readOnly\}/);
  assert.match(card, /!readOnly && snapshot/);
  assert.match(card, /!readOnly && typeof svc.internalHost/);
  assert.match(card, /!readOnly && svc.endpointEnabled/);
});
