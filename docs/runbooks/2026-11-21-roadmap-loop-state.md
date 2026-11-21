# Boucle roadmap — état au 21 novembre 2026

Mode sprint homelab validé par le propriétaire le 21/11/2026. Une seule PR Draft pour ce dépôt : branche `feat/roadmap-20261121`, base `master@6d76870`. Ce fichier garde l'état de la boucle hors du contexte de l'agent ; le supprimer une fois les questions tranchées.

## Compteur

- Passe : **2** (réconciliation à la passe 3).
- Périmètre : `docs/homelab-roadmap.md`, `docs/quality-roadmap.md`, `docs/stripe-hardening-roadmap.md` et la part Site de la ligne H17 du portefeuille nabla-compose.

## Passe 1

| Item | État | Preuve |
| --- | --- | --- |
| pfSense retiré le 18/11 : page `/pfsense`, contrat d'exposition Architecture, graphe OWNER | CODED, TESTED (L1) | `pfsenseRetirementNotice`, `hierarchicalReactFlow`, `homelabNetworkFlow*` |
| H17, part Site : aucun lecteur V1 ni export legacy Compose | CODED, TESTED (L1) | `homelabNoLegacyCatalogReaders` |
| S1 : suite catalogue V2 | TESTED (L1) | `npm run test:catalog:v2`, 88 PASS |
| Stripe : tests du webhook fail-closed | TESTED (L1) | 4 PASS ; lien vers la ligne A5 réparé |

Aucun de ces items n'est `DEPLOYED` ni `ACCEPTED` : pas d'observation navigateur ni runtime.

## Passe 2

Les trois questions parquées en passe 1 sont tranchées par le propriétaire le 21/11/2026 (icônes selfh.st, registre Postgres Neon pour A5, recâblage du graphe OWNER).

| Item | État | Preuve |
| --- | --- | --- |
| S6 : 9 icônes du catalogue Compose (7 selfh.st, `apisix.svg` logo officiel, `honeypot.svg` repli générique), mapping régénéré | CODED, TESTED (L1) | `sync-homelab-icons.mjs --check` PASS ; `homelabIconSync`, `homelabCatalogIconAssets`, `homelabIconCoverage` |
| Graphe OWNER : Freebox → R7000 `172.17.0.1` → Pi-hole, sans pfSense/Unbound/HAProxy ni mode « direct » | CODED, TESTED (L1) | `homelabNetworkFlow`, `homelabNetworkFlowGraph`, `publicHomelabPrivacy` |
| A5 Stripe : registre `stripe_webhook_events` (clé primaire `evt_…`), insertion idempotente, 503 sans `DATABASE_URL` | CODED, TESTED (L1) | `stripeEventLedger` (5), `stripe-webhook` |
| A5 : provisionnement Neon, création de la table, recette sandbox | NOT_RUN | étapes dans `docs/stripe-hardening-roadmap.md#runbook`, à faire par le propriétaire |

`npm run test:unit` PASS. Rien n'est `DEPLOYED` ni `ACCEPTED` : ni observation navigateur des icônes et du graphe OWNER, ni base Neon.

## Questions parquées

Aucune.
