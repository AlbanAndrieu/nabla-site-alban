# Boucle roadmap — état au 21 novembre 2026

Mode sprint homelab validé par le propriétaire le 21/11/2026. Une seule PR Draft pour ce dépôt : branche `feat/roadmap-20261121`, base `master@6d76870`. Ce fichier garde l'état de la boucle hors du contexte de l'agent ; le supprimer une fois les questions tranchées.

## Compteur

- Passe : **1** (pas de réconciliation avant la passe 3).
- Périmètre : `docs/homelab-roadmap.md`, `docs/quality-roadmap.md`, `docs/stripe-hardening-roadmap.md` et la part Site de la ligne H17 du portefeuille nabla-compose.

## Passe 1

| Item | État | Preuve |
| --- | --- | --- |
| pfSense retiré le 18/11 : page `/pfsense`, contrat d'exposition Architecture, graphe OWNER | CODED, TESTED (L1) | `pfsenseRetirementNotice`, `hierarchicalReactFlow`, `homelabNetworkFlow*` |
| H17, part Site : aucun lecteur V1 ni export legacy Compose | CODED, TESTED (L1) | `homelabNoLegacyCatalogReaders` |
| S1 : suite catalogue V2 | TESTED (L1) | `npm run test:catalog:v2`, 88 PASS |
| Stripe : tests du webhook fail-closed | TESTED (L1) | 4 PASS ; lien vers la ligne A5 réparé |

Aucun de ces items n'est `DEPLOYED` ni `ACCEPTED` : pas d'observation navigateur ni runtime.

## Questions parquées

1. **Icônes S6.** Le contrôle `node scripts/sync-homelab-icons.mjs --source <nabla-compose>/catalog/service-icons.json --check` échoue : 9 fichiers manquent dans `public/assets/selfh-icons/` (apisix, bazarr, bitcoin, gluetun, honeypot, jellyfin, qbittorrent, recyclarr, seerr). Autoriser leur téléchargement depuis selfh.st, ou les faire pointer sur `generic-app.svg` dans nabla-compose ?
2. **A5 Stripe.** Quelle persistance pour les événements webhook (Vercel Marketplace Postgres/Redis, ou autre) ? Sans ce choix, les événements de paiement restent refusés en 503.
3. **Graphe réseau OWNER.** Recâbler la topologie sur Freebox → R7000 (double NAT, sans DMZ) et Pi-hole `172.17.0.24` comme DNS des clients, et retirer le mode de chemin « direct » ? Confirmer qu'aucun chemin public direct ne reviendra avant un nouveau pare-feu.
