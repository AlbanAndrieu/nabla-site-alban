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
  exposure_intent: "public",
  exposure: { declared: {external: true, internal_host: "172.17.0.24", internal_port: 8085} },
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

test("navigation omits health-check query credentials and fragments", () => {
  const sensitive = { ...snapshot, services: [{
    ...entry, url: "https://gatus.albandrieu.com/health?token=private#secret",
  }] };
  assert.equal(
    observedOwnerServiceNavigation(service, sensitive).externalUrl,
    "https://gatus.albandrieu.com/health",
  );
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


test("LAN targets restore from declared FastAPI exposure when internal probes are disabled", () => {
  const withoutInternalProbes = {
    ...snapshot,
    internal_probes_enabled: false,
    internal_services: [],
  };
  const result = observedOwnerServiceNavigation(service, withoutInternalProbes);
  assert.equal(result.service.internalHost, "172.17.0.24");
  assert.equal(result.service.internalPort, 8085);
  assert.equal(result.internalTargetSource, "declared");
  assert.equal(result.internalProtocolObserved, false);
  assert.equal(result.externalUrl, "https://gatus.albandrieu.com/");
});

test("internal intent and disabled endpoints never acquire a public link", () => {
  const internal = { ...entry,
    exposure_intent: "internal",
    exposure: { declared: { external: false, endpoint_enabled: true, internal_host: "172.17.0.24", internal_port: 8085 } },
  };
  assert.equal(
    observedOwnerServiceNavigation(service, { ...snapshot, services: [internal] }).externalUrl,
    "",
  );
  const disabled = { ...entry,
    exposure: { declared: { external: true, endpoint_enabled: false, internal_host: "172.17.0.24", internal_port: 8085 } },
  };
  assert.equal(
    observedOwnerServiceNavigation(service, { ...snapshot, services: [disabled] }).externalUrl,
    "",
  );
});

test("Cloudflare origin drift is disclosed instead of rewriting declared ports", () => {
  const withDrift = { ...entry,
    exposure: {
      declared: { external: true, internal_host: "172.17.0.24", internal_port: 30287 },
      observed: {
        cloudflare_origin_service: "http://172.17.0.24:8085",
        cloudflare_origin_matches_topology: false,
      },
    },
  };
  const result = observedOwnerServiceNavigation(service,
    { ...snapshot, services: [withDrift], internal_services: [] });
  assert.equal(result.service.internalPort, 30287);
  assert.equal(result.internalRouteMismatch, true);
  assert.equal(result.internalProtocolObserved, false);
});

test("public cards cannot show owner evidence or clickable private endpoints", () => {
  const root = new URL("../", import.meta.url);
  const grid = readFileSync(new URL("app/components/homelab/HomelabServiceGrid.tsx", root), "utf8");
  const card = readFileSync(new URL("app/components/homelab/HomelabServiceCard.tsx", root), "utf8");
  const block = readFileSync(new URL("app/components/homelab/HomelabServicesBlock.tsx", root), "utf8");
  assert.match(grid, /readOnly \|\| healthUnavailable \? null : snapshot/);
  assert.match(grid, /readOnly=\{readOnly\}/);
  assert.match(block, /readOnly=\{readOnly\}/);
  assert.match(card, /!readOnly && snapshot/);
  assert.match(card, /!readOnly && typeof svc.internalHost/);
  assert.match(card, /!readOnly && svc.endpointEnabled/);
});

test("cards precede a deferred ReactFlow and troubleshooting is opt-in", () => {
  const root = new URL("../", import.meta.url);
  const block = readFileSync(new URL("app/components/homelab/HomelabServicesBlock.tsx", root), "utf8");
  const troubleshooting = readFileSync(new URL("app/components/homelab/ServiceTroubleshootingEvidence.tsx", root), "utf8");
  const summary = readFileSync(new URL("app/components/homelab/ServiceOwnerEvidenceSummary.tsx", root), "utf8");
  assert.ok(block.indexOf('data-homelab-service-hierarchy') < block.indexOf('data-homelab-service-reactflow'));
  assert.match(block, /IntersectionObserver/);
  assert.match(block, /graphInView \? \(/);
  assert.match(troubleshooting, /if \(!anchoredDetails\.open\) return/);
  for (const id of ["docker", "https", "cloudflare", "http", "latency", "prometheus"]) {
    assert.match(summary, new RegExp('key: "' + id + '"'));
  }
  assert.match(summary, /const boardStale = snapshot\\.health_board/);
  assert.match(summary, /const stale = unavailable \\|\\| snapshot\\.truenas_runtime_stale/);
  assert.match(summary, /data-owner-board-stale/);
  assert.match(summary, /access_protected_origin_unverified/);
  const probeHelper = readFileSync(new URL("lib/homelabProbeEvidencePresentation.ts", root), "utf8");
  assert.match(probeHelper, /direct_probe_observed_at/);
  assert.match(probeHelper, /internal_probe_observed_at/);
  assert.match(summary, /runtime_primary_container_issue/);
  assert.match(summary, /internal_probes_enabled === false/);
  assert.match(summary, /probeMetric\("lan"/);

});
