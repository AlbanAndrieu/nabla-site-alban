import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("TrueNAS cards show actionable health, not redundant LAN configuration prose", () => {
  const card = read("app/components/homelab/HomelabServiceCard.tsx");
  const grid = read("app/components/homelab/HomelabServiceGrid.tsx");
  assert.doesNotMatch(card, /Adresse\/port issus de la configuration|Address\/port from configuration/);
  assert.doesNotMatch(card, /data-owner-lan-declared|data-owner-internal-protocol/);
  assert.doesNotMatch(card, /internalTargetSource/);
  assert.doesNotMatch(grid, /internalTargetSource=\{/);
  assert.match(card, /data-lan-probe-state=\{lanProbe\?\.state \?\? "not-run"\}/);
  assert.match(card, /Protocole LAN non confirmé · schéma configuré utilisé/);
  assert.match(card, /data-owner-lan-route-mismatch/);
});

test("service pages omit long editorial copy but preserve health badges, filters and access gating", () => {
  const block = read("app/components/homelab/HomelabServicesBlock.tsx");
  const section = read("app/components/homelab/HomelabServicesSection.tsx");
  const privateServices = read("app/components/homelab/HomelabPrivateServices.tsx");
  assert.doesNotMatch(block, /Les services restent la finalité de la vue|Services remain the primary outcome/);
  assert.doesNotMatch(block, /className=\{styles\.healthSemantics\}/);
  assert.doesNotMatch(block, /GROUP_DESCRIPTION_KEY/);
  assert.doesNotMatch(section, /Cette plateforme regroupe des expérimentations|This platform supports infrastructure/);
  assert.doesNotMatch(privateServices, /Consultation extérieure en lecture seule|External read-only view:/);
  assert.match(privateServices, /access === "readonly"/);
  assert.match(privateServices, /<HomelabServicesBlock readOnly \/>/);
  assert.match(block, /data-homelab-health-filter=\{healthState\}/);
  assert.match(block, /data-group-issue-count=\{issueCount\}/);
});

test("Architecture remains status-first without redundant privacy or graph instructions", () => {
  const privateViews = read("app/[locale]/architecture/ArchitecturePrivateViews.tsx");
  const dashboard = read("app/[locale]/architecture/ArchitectureHealthDashboard.tsx");
  const topology = read("app/[locale]/architecture/ArchitectureTopologyView.tsx");
  const hierarchy = read("app/[locale]/architecture/ArchitectureServiceHierarchy.tsx");
  assert.doesNotMatch(privateViews, /Cartographie publiée en lecture seule|Published read-only architecture/);
  assert.doesNotMatch(privateViews, /Même diagramme que la page TrueNAS|Same diagram as the TrueNAS page/);
  assert.doesNotMatch(dashboard, /Les filtres s’appliquent aux services déclarés|blast-radius calculations/);
  assert.doesNotMatch(topology, /Utilisez la recherche et les contrôles du graphe|Use the graph search and controls/);
  assert.doesNotMatch(hierarchy, /GROUP_DESCRIPTION_KEY/);
  assert.match(privateViews, /access === "readonly"/);
  assert.match(topology, /<ArchitectureHealthDashboard/);
  assert.match(dashboard, /data-health-filter=\{state\}/);
  assert.match(hierarchy, /data-needs-attention=\{issueCount > 0/);
  assert.match(dashboard, /Published status/);
});
