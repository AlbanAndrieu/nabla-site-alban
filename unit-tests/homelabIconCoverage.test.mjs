import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { HOMELAB_CATALOG_ICON_FILES, homelabCatalogIconSrc, homelabServiceIconSrc } from "../lib/homelabCatalogIcons.ts";

// Regression snapshot of the canonical nabla-compose service and Backstage app IDs
// on 2026-10-24. This is a test fixture, NOT a second runtime inventory authority.
const canonicalIds = [
  "2fauth",
  "adguardhome",
  "affine",
  "aistor",
  "akvorado",
  "anythingllm",
  "anythingllm-albandrieu",
  "autokuma",
  "autoxpose",
  "bichon",
  "cartography",
  "clamav",
  "clickhouse",
  "code",
  "code-server",
  "convertx",
  "crowdsec",
  "cyberbro",
  "ddns-updater",
  "defectdojo",
  "dependency-track",
  "dockhand",
  "docling",
  "domain-watchdog",
  "dozzle",
  "drawio",
  "dsomm",
  "elasticsearch",
  "freshrss",
  "garage",
  "garage-admin",
  "garage-webui",
  "gatus",
  "grafana",
  "graylog",
  "haproxy-exporter",
  "heimdall",
  "hello-int",
  "hermes",
  "homarr",
  "home",
  "homeassistant",
  "influxdb",
  "ittools",
  "joplin",
  "kafka",
  "karakeep",
  "keycloak",
  "langflow",
  "langfuse",
  "languagetool",
  "lidarr",
  "litellm",
  "litellm-albandrieu",
  "localai",
  "localai-gpu",
  "minio",
  "mongo",
  "n8n",
  "neo4j",
  "netalertx",
  "netbootxyz",
  "netbox",
  "nexus",
  "nginx",
  "nginx-proxy-manager",
  "npmplus",
  "ntopng",
  "obsidian",
  "ollama",
  "ollama-gpu",
  "opconnect",
  "open-speed-test",
  "open-webui",
  "openarchiver",
  "openclaw",
  "opencre",
  "openhands",
  "openrag",
  "opensearch",
  "opensearch-exporter",
  "openwebui",
  "paperless-ai",
  "paperless-ngx",
  "pfsense",
  "pgadmin",
  "pihole",
  "plumber",
  "plumber-api-albandrieu",
  "portainer",
  "portracker",
  "portracker-albandrieu",
  "postgres",
  "postgresql",
  "prometheus",
  "prowlarr",
  "pyroscope",
  "radarr",
  "reactive-albandrieu",
  "reactive-resume",
  "redis",
  "sabnzbd",
  "sample",
  "scanopy",
  "scorecard",
  "scrutiny",
  "scrutiny-collector-albandrieu",
  "searxng",
  "sentry",
  "sentry-clickhouse",
  "sonarqube",
  "sonarr",
  "speedtest",
  "squid",
  "stirling",
  "stirling-albandrieu",
  "suricata",
  "sybase-exporter",
  "traefik",
  "transmission",
  "truenas",
  "uptime-kuma",
  "vaultwarden",
  "watchtower",
  "wazuh",
  "wordpress"
];

test("every currently declared service has its own valid bundled icon", () => {
  for (const id of canonicalIds) {
    const path = homelabCatalogIconSrc(id);
    assert.notEqual(path, "assets/selfh-icons/generic-app.svg", id);
    assert.match(path, /^assets\/selfh-icons\/[a-zA-Z0-9._-]+\.(svg|png|jpg)$/);
    assert.equal(existsSync(new URL("../public/" + path, import.meta.url)), true, id + " -> " + path);
  }
});

test("all explicit icon aliases refer to real local files", () => {
  for (const [id, file] of Object.entries(HOMELAB_CATALOG_ICON_FILES)) {
    assert.equal(existsSync(new URL("../public/assets/selfh-icons/" + file, import.meta.url)), true, id + " -> " + file);
  }
});

test("Backstage subcomponents reuse their specific parent icon", () => {
  assert.equal(homelabCatalogIconSrc("defectdojo-api"), homelabCatalogIconSrc("defectdojo"));
  assert.equal(homelabCatalogIconSrc("openrag-parser"), homelabCatalogIconSrc("openrag"));
  assert.equal(homelabCatalogIconSrc("opensearch-exporter"), "assets/selfh-icons/opensearch.svg");
});

test("current site assets override stale upstream paths and reject external logos", () => {
  assert.equal(homelabServiceIconSrc("traefik", "assets/selfh-icons/traefik.png"), "assets/selfh-icons/traefik.svg");
  assert.equal(homelabServiceIconSrc("joplin", "assets/selfh-icons/joplin.png"), "assets/selfh-icons/joplin.svg");
  assert.equal(homelabServiceIconSrc("unknown-service", "https://evil.example/logo.svg"), "assets/selfh-icons/generic-app.svg");
  assert.equal(homelabServiceIconSrc("unknown-service", "assets/selfh-icons/grafana.png"), "assets/selfh-icons/grafana.png");
});
