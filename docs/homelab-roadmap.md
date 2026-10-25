# Roadmap active — nabla-site-alban

> Réconciliée le **25 octobre 2026**, après fusion de [Site #256](https://github.com/AlbanAndrieu/nabla-site-alban/pull/256).
> **Source d'autorité :** cette roadmap contient uniquement les tâches du site.
> [Historique intégral précédent](archive/homelab-roadmap-through-2026-10-25.txt)
> conservé sans suppression de preuve. Les actions Compose et FastAPI ont leurs
> propres roadmaps ; un merge et un déploiement READY ne valent pas recette navigateur.

## Dernier état vérifié — production

| Dimension | Preuve | Verdict |
| --- | --- | --- |
| Git | `master` et commit de merge #256 `99cf7e4016533532bee53a72964ffea1b4a54bc6` identiques | **PASS** |
| Publication | Vercel `dpl_ETdhg9XfxZijJ3ExA29a2q291SmV` READY, `target=production`, Node 24.x | **PASS build/déploiement** |
| Domaine | `www.albanandrieu.com` sur le même déploiement ; apex redirigé vers `www` | **PASS métadonnées Vercel** |
| Logs build | `Build Completed in /vercel/output [22s]` ; pas d'erreur de compilation dans les événements consultés | **PASS build** |
| Runtime | Aucune erreur regroupée Vercel sur 24 h ; recherche `error/fatal` sur 30 min sans résultat | **Aucune erreur observée, pas une recette** |
| HTTP public | Navigateur de l'agent : accès direct à Architecture/TrueNAS non disponible ; terminal de l'agent : DNS public indisponible | **BLOCKED côté agent** |
| OWNER/LAN | Aucun appel authentifié depuis le VLAN domestique | **NOT_RUN** |
| Source-only / L3 | Pas de checkout complet avec Node 24, `npm ci`, Playwright, Axe, Trivy et quality gate locale sur le merge | **NOT_RUN** |
| L1 Node 22/npm 10 | Six sources au blob SHA identique au merge ; 18 tests ciblés via source partielle | **18/18 PASS ; non L3** |

**Routes canoniques :** anglais `/`, `/architecture`, `/truenas` ;
français `/fr`, `/fr/architecture`, `/fr/truenas`.
Ne pas présenter `/en/architecture` comme canonique.

[Runbook de vérification production](runbooks/site-production-verification.md) ·
[Contrat des diagnostics et droits](homelab-diagnostics-and-access.md).

## P0 — Vérifier les parcours réellement publiés

- [ ] **S-01 Smoke HTTP et SHA :** exécuter depuis une machine disposant d'un
  DNS public fonctionnel `DEPLOYED_SHA=99cf7e4016533532bee53a72964ffea1b4a54bc6 node scripts/post-deploy-smoke.mjs`.
  Le script vérifie routes FR/EN, canonical/hreflang, sitemap, robots, carte sociale,
  SHA et refus de l'ancienne route opérationnelle. Conserver la sortie expurgée.
- [ ] **S-02 Navigateur :** tester Home, TrueNAS et Architecture FR/EN sur le
  même SHA. Vérifier le chargement des vrais logos, le fallback monogramme,
  les filtres, le graphe ReactFlow, C4 L1/L2 et son panneau de relations.
  Confirmer navigation au clavier, mobile, absence de console error.
- [x] **S-03a Recette navigateur LAN/externe :** script `audit:homelab` avec trois contextes attendus, inspection du stockage et des routes ; acceptation réelle sur les deux réseaux **NOT_RUN**.
- [ ] **S-03 OWNER :** depuis le Wi-Fi/VLAN autorisé, confronter
  `/api/homelab-access?diagnose=1` à la disponibilité des catalogues,
  à `/api/homelab-health` / sondes autorisées et au rendu des cartes.
  Une réponse `trusted` ne prouve pas que FastAPI ou TrueNAS répond.
- [ ] **S-04 Public :** depuis un réseau non autorisé et sans session Access,
  vérifier le mode SERVICE (si activé) et les refus OWNER. Contrôler
  JSON, HTML/RSC, console, requêtes réseau et `localStorage` : aucun token,
  adresse LAN, header d'accès ou diagnostic OWNER.
- [x] **S-05a Détection de Preview :** correction du script
  `vercel-ignore-build.sh` : lorsqu'un HEAD de merge n'a pas de
  `VERCEL_GIT_PREVIOUS_SHA` valide, construire par défaut plutôt que
  comparer seulement le premier parent. Un `git diff` impossible construit
  aussi par sécurité ; tests offline **4/4 PASS** sur de vrais dépôts Git locaux.
- [ ] **S-05 Quality :** lancer `just source-check`, build Next.js Node 24,
  tests unitaires et les gates locales pertinentes sur un checkout du
  **merge SHA**, sans relancer les workflows GitHub payants.

**Done P0 :** preuves HTTP/navigateur datées, parcours OWNER et SERVICE prouvés,
contrôle de confidentialité négatif et SHA exact. Ne jamais fermer sur READY seul.

## P0 — Diagnostics et contrôle d'accès côté site

**Livré dans #256 :** catalogue Backstage v2 sans repli runtime v1 ; index
de preuves résistant aux clés ambiguës ; classifieur d'erreurs `stage`,
réponse HTTP 503 expurgée pour les clients publics ; panneau d'incident
OWNER commun Architecture/TrueNAS ; révocation synchrone du snapshot C4
OWNER lors d'une transition de droits ; cache SERVICE versionné. Ces
invariants sont à préserver, pas à réimplémenter.

- [x] **S-06b Écho validé :** le Site indique `confirmed` uniquement lorsque FastAPI retourne l’ID W3C exact ; autrement `sent`. Producteur : [FastAPI #377](https://github.com/AlbanAndrieu/fastapi-sample/pull/377). Recette sur déploiements correspondants encore NOT_RUN.
- [x] **S-06a W3C traceparent Site → FastAPI SERVICE v2 :** généré au serveur et transmis ; ID exposé en réponse. Lecture dans les logs FastAPI non vérifiée.
- [ ] **S-06 Corrélation réelle :** propager un `trace_id` fiable à travers
  collecteur → FastAPI → Route Handler Next.js → support OWNER, avec
  logs expurgés et horodatages. Le `requestId` Site actuel est **local**
  et ne constitue pas une trace distribuée.
- [x] **S-07a Preuve HTTP fraîche :** un code 200 sans timestamp et source de sonde HTTP ne vaut pas un succès ; un résultat périmé ou interrompu reste `unknown`. Le détail OWNER précise origine/cache/deadline, HTTP et l’heure. Cinq tests purs Node 22 PASS dans un arbre isolé.
- [x] **S-07b Trace visible OWNER :** ID W3C reçu depuis la route SERVICE v2 visible uniquement dans le panneau de diagnostic OWNER, jamais conservé dans le cache public. La réception FastAPI n’est pas supposée.
- [ ] **S-07 Provenance lisible :** présenter par service les étapes
  catalogue → source FastAPI → DNS/TCP/TLS/HTTP/auth → observateur →
  horodatage/fraîcheur → rendu Site ; distinguer `unknown`, `stale`,
  `not-executed`, `403` et `down` sans attribuer une panne au hasard.
- [x] **S-08a Identité v2 dans le Site :** les cartes et compteurs
  n'acceptent plus de fallback de preuve par nom ou URL. La jointure
  `canonicalHomelabEvidence` exige l'ID identique et non ambigu ; sinon
  le résultat est `unknown`, sauf preuve directe ou état v2 par `entityRef`.
  Tests négatifs Node 22 ajoutés.
- [ ] **S-08b Contrat producteur :** confronter les `entityRef`, les IDs et
  les exporters réellement publiés par FastAPI/Compose à ce contrat. Documenter
  séparément les observateurs sans ID canonique ; ne pas réactiver de fallback.
- [x] **S-09a Isolation des échecs de revalidation :** ne réutiliser un catalogue, une topologie et des preuves que si le périmètre d'accès est inchangé et non révoqué. En cas de changement OWNER/SERVICE, vider ces données avant tout rendu ; tests négatifs Node 22 (5/5 PASS isolés).
- [ ] **S-09 Fin du mode SERVICE temporaire :** préparer un cutover
  `HOMELAB_PUBLIC_READONLY_ENABLED=false` lorsque les parcours OWNER ont
  leur alternative fonctionnelle. Tant qu'il reste actif, tester que seuls
  les endpoints de projection allowlistés sont accessibles et que les 503
  publics ne révèlent aucune phase privée.

## P1 — C4, icônes et expérience utilisateur

**Livré dans #256 :** `@xyflow/react` sans nouveau serveur de diagrammes,
vues C4 L1 Contexte et L2 Conteneurs/services bornées à 16 nœuds / 48 liens,
panneau de relations navigable et liste textuelle accessible. La vue L1
est conceptuelle ; L2 représente un sous-ensemble déclaré, pas la santé runtime.
Audit précédent des assets : 176 mappings, 125 fichiers distincts, aucun
asset Git manquant (preuve de dépôt, pas chargement navigateur).

- [x] **S-10a Projection C4 expurgée :** les nœuds rejettent les noms
  sensibles, les métadonnées non sûres et les types de relation inconnus.
  Test négatif local sur le modèle C4 sous Node 22.
- [x] **S-10a Chronologie accessible :** étapes Docker/LAN/TLS/HTTP/Cloudflare/Prometheus présentées en liste ordonnée OWNER avec statut et provenance existants ; pas de verdict de panne inventé.
- [ ] **S-10 WCAG 2.2 AA :** confirmer focus/lecteur d'écran, contraste,
  zoom, clavier, transitions C4 L1/L2, bouton d'effacement, responsive,
  FR/EN et alternatives textuelles. Corriger les anomalies démontrées.
- [x] **S-11a ReactFlow différé :** C4 et explorateur en chunks dynamiques séparés, montés à moins de 420 px du viewport, avec placeholders `aria-busy`, scroll et ancrages préservés.
- [ ] **S-11 Performance :** mesurer LCP/INP/CLS, poids du bundle ReactFlow,
  chargement différé des diagnostics, ETag/revalidation SERVICE, cache
  inter-onglets sans état OWNER et comportement des filtres avec beaucoup de services.
- [x] **S-12a Autorité unique des icônes :** `HomelabServiceCard` ignore le champ `iconSrc` distant et calcule chaque chemin via `homelabCatalogIcons.generated.ts`. Le cache public omet intentionnellement `iconSrc` ; ne pas le rajouter depuis FastAPI.
- [ ] **S-12 Icônes :** exécuter `just icons-local-check` et comparer au
  catalogue Compose lors de nouvelles apps. Confirmer erreurs HTTP 404 et
  `data-service-icon-fallback` dans le navigateur, sans substituer
  systématiquement un monogramme à un logo officiel disponible.
- [ ] **S-13 C4 L3 :** attendre des relations de composants explicitement
  publiées dans le catalogue d'autorité Compose/FastAPI. Étudier l'export
  Structurizr DSL plus tard ; aucun inventaire local parallèle.

## P1/P2 — Qualité, documentation et refactoring

- [ ] **S-14 Dédupliquer les adaptateurs** des snapshots de santé et de
  catalogue utilisés par TrueNAS/Architecture ; conserver des DTO distincts
  PUBLIC/SERVICE/OWNER et une unique logique d'autorisation **serveur**.
- [ ] **S-15 Dépister les consommateurs v1** (fixtures, scripts, tests)
  avant suppression ; les compatibilités historiques sont réservées aux tests,
  jamais utilisées en fallback de production.
- [ ] **S-16 Qualité transverse :** préserver les contrats local-first,
  Next.js/Node LTS, sécurité SAST/DAST, DSOMM, Stripe/PostHog dans
  [roadmap produit](quality-roadmap.md), sans importer leur backlog ici.
  Les skills externes déjà installés restent sous contrôle de l'utilisateur.

## Handoff sans duplication entre dépôts

| Producteur/autorité | Contrat attendu | Source d'autorité |
| --- | --- | --- |
| `nabla-compose` | Topologie déclarée, `catalogRevision`, icônes, ingress, APISIX POC, ADR/RACI, collecteur LAN | [Roadmap Compose](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/roadmap.md) · [APISIX #280](https://github.com/AlbanAndrieu/nabla-compose/pull/280) |
| `fastapi-sample` | Probes, identité/permissions, DTO OWNER/SERVICE, codes de diagnostic, timestamps et traces inter-services | [Roadmap FastAPI](https://github.com/AlbanAndrieu/fastapi-sample/blob/master/docs/engineering-roadmap.md) · [#376 fusionnée](https://github.com/AlbanAndrieu/fastapi-sample/pull/376) |
| `nabla-site-alban` | Contrôle d'exposition Route Handlers, C4, cartes, cache public, i18n, a11y, tests Preview et prod | Ce document |

**Convention :** `DONE (code)` ≠ `READY (Vercel)` ≠ `PASS (HTTP)` ≠
`PASS (navigateur)` ≠ `PASS (OWNER/LAN)`. Si non mesuré, inscrire
`NOT_RUN` ou `BLOCKED`. Ne pas recopier les tâches d'un autre dépôt.

### Suivi 429 OWNER et diagnostic local (#260, 25/10/2026)
- [x] **S-03b audit** : traiter HTTP 429 comme précontrôle bloqué, jamais comme refus OWNER; code de sortie 4 sans requêtes supplémentaires.
- [x] **S-03c confidentialité** : JWT limité à l'origine auditée, aucun secret dans la sortie, métadonnées de stockage contrôlées.
- [x] **S-07c UX** : chronologie Catalogue → DNS → TCP → TLS → HTTP → API et `unknown` pour DNS/API non mesurés.
- [ ] **S-03d LAN réel** : obtenir HTTP 200 sur `/api/homelab-access?diagnose=1`, puis valider OWNER et les sondes.
- [ ] **S-04 WAN réel** : `NOT_RUN` en absence de réseau extérieur; ne pas falsifier l'IP cliente.
- [ ] **S-06c trace FastAPI** : confirmer la version réellement déployée et l'écho exact de l'ID W3C.
- [ ] **S-11b** : recettes WCAG 2.2 AA et Web Vitals LCP/INP/CLS réels.
