# Roadmap générale — produit et ingénierie Site Alban

**Réconciliée le 14 novembre 2026.** Autorité des priorités **transverses du site** (Next.js, sécurité, qualité, SEO, finances, livraison). Les détails de l'interface homelab sont suivis uniquement dans la [roadmap d'ingénierie homelab](homelab-roadmap.md). Les composants FastAPI et TrueNAS ne constituent **pas** une dette d'implémentation de ce dépôt.

[Historique complet avant cette réconciliation](archive/quality-roadmap-before-v2-reconciliation-2026-11-14.txt) · [Index documentaire](README.md) · [scripts opérateur](../scripts/README.md) · [FinOps Vercel](vercel-finops-runbook.md).

## Jalons intégrés et limites de preuve

| Périmètre | Code/Git vérifié | Production / limite |
| --- | --- | --- |
| Catalogue homelab Backstage V2 | [PR #301](https://github.com/AlbanAndrieu/nabla-site-alban/pull/301) **MERGED** le 13/11 ; source unique `/api/homelab-catalog-v2`, identités `entityRef`, `catalogRevision` et projection ReactFlow | **Non réceptionné** sur vrais parcours OWNER/LAN et SERVICE/WAN |
| Rendu V2 enrichi | Présentation du cycle de vie, type et criticités dans la PR courante ; cache SERVICE expurgé, sans URL ni secret | **CODED**, tests locaux et mesures navigateur exact-SHA à valider |
| Publication Vercel | Reprise documentée le 9/11 ; [#285](https://github.com/AlbanAndrieu/nabla-site-alban/pull/285), [#288](https://github.com/AlbanAndrieu/nabla-site-alban/pull/288), [#293](https://github.com/AlbanAndrieu/nabla-site-alban/pull/293) **MERGED** | SHA de production de la nouvelle branche, compteurs Fluid CPU et réception performance **NOT_VERIFIED** |
| Scripts FinOps et smoke | [#295](https://github.com/AlbanAndrieu/nabla-site-alban/pull/295), [#297](https://github.com/AlbanAndrieu/nabla-site-alban/pull/297), [#298](https://github.com/AlbanAndrieu/nabla-site-alban/pull/298) **MERGED** | API Hobby et consommations CPU réelles **NOT_MEASURED** ; scripts ≠ seuil Vercel actif |
| YubiKey et migrations React | Guide progressif, PIV/Entra, ReactFlow et pages React intégrés par PR antérieures | WCAG/SEO et fonctionnement navigateur sur le dernier SHA non présumés |

**Refactorings de la PR #303 (CODED, NOT_MEASURED) :** index OWNER O(N) partagé, index de santé réutilisés, timer de fraîcheur unique, alertes runtime non dupliquées et filtres V2 communs à TrueNAS/Architecture. Les tests ciblés ont été ajoutés mais ne constituent pas une gate L3 exécutée. Voir [la roadmap d’ingénierie](homelab-roadmap.md#optimisations-de-rendu-codées-non-mesurées).

**Publication vérifiée le 14 novembre :** PR #303 fusionnée ; [Vercel `dpl_A3B3CuHJVPjzbZ978CcmpEorX5Fv`](https://vercel.com/albanandrieus-projects/nabla-site-alban/A3B3CuHJVPjzbZ978CcmpEorX5Fv) est `READY` sur `64a203d8d78ad6c438837f32bdcdd79f6c52b32c`. Ce n'est ni L3 ni une recette navigateur. Billing Charges Hobby retourne `costs_not_found` : CPU **NOT_MEASURED**. La PR #305 (Draft) durcit le mode SERVICE et adapte les tests ; non déployée.

## Décision de priorité — choisir la prochaine vague

| ID | Priorité suggérée | Résultat vérifiable | Source d'exécution |
| --- | --- | --- | --- |
| **A1** | **P0** | Publier une qualité L3 sur le SHA de la PR : Node 24, npm 12, tests FR/EN, lint/TypeScript/build, SAST/SCA et absence de secrets | [Gate locale](../AGENTS.md), [scripts](../scripts/README.md) |
| **A2** | **P0** | Réception des pages TrueNAS/Architecture du catalogue V2, OWNER/LAN et SERVICE/WAN, identités et caches sans fuite | [Roadmap homelab S1–S4](homelab-roadmap.md) |
| **A3** | **P0** | Contrôles AppSec : ruleset/CodeQL/Trivy/Renovate, DAST ZAP réellement exécuté, preuves STRIDE/DSOMM | [Modèle de menaces](security-threat-model.md) |
| **A4** | **P0** | Mesurer Fluid Active CPU, provisioned memory, invocations et requêtes pour l'équipe Hobby, sans inventer de consommation | [FinOps](vercel-finops-runbook.md) |
| **A5** | **P0**, bloquant paiement | Persistance des événements Stripe, idempotence, sandbox et flux `2xx` transactionnels ; webhook financier reste fermé tant que non reçu | [Stripe](checkout-support-runbook.md) |
| **A6** | **P1** | Audit navigateur FR/EN, WCAG 2.2 AA, mobile 320/390 px, YubiKey, SEO canonical/hreflang/sitemap | [Vérification production](runbooks/site-production-verification.md) |
| **A7** | **P1** | Mesurer LCP/INP/CLS, réduire CSS/Bootstrap hérité et hydrations coûteuses sans dégrader la compatibilité | [Baseline](performance-baseline.md) |
| **A8** | **P2** | Refactorisation guidée des scripts, détection de code mort, dette Node/deps, ROI mesuré des agents et outils | [scripts](../scripts/README.md) |

**Ordre décidé le 14/11 : G7 → G6 → G8** — terminer d'abord l'affichage Backstage V2 (filtres, santé, icônes, C4), puis l'accessibilité FR/EN/SEO, enfin le nettoyage des scripts et de la documentation des agents. Les exigences A1/A2/A3 restent des critères de publication, non des tâches implicitement validées. Les textes et tests des filtres sont codés sur une branche Draft ; la recette navigateur et la gate L3 restent ouvertes.

## Livrables ouverts et garde-fous

### P0 — Qualité et publication

- [ ] Exécuter sur le **HEAD exact** de la PR (Node `>=24.22.1 <25` / npm `>=12.2.0 <13`) : `npm ci`, `npm run test:unit`, `npm run lint`, `npm run lint:css`, `npm run typecheck`, `npm run build` et `npm run quality:agent:publish`. Documenter les résultats, les échecs et le SHA ; CI `skipped` ≠ `PASS`.
- [ ] Exécuter les contrôles AppSec appropriés et confirmer la protection `master`. Vérifier le rapport ZAP de production : un scanner qui n'a pas démarré est `NOT_RUN`, pas sain.
- [ ] Relever dans Vercel les compteurs CPU et mémoire des fonctions, les appels, les requêtes Edge, les transferts et le temps de réponse ; si l'API Hobby ne les fournit pas, conserver `NOT_MEASURED`.
- [ ] Terminer la persistance/idempotence Stripe et les tests de sandbox avant tout retour `2xx` sur événement financier.

### P1 — Produit et expérience

- [ ] Tester FR/EN, défilement, clavier, thème, navigation et contraste ; inspecter les 320/390 px, ReactFlow et pages YubiKey.
- [ ] Valider canonical, `hreflang`, sitemap, redirections et indexabilité sur `www.albanandrieu.com` ; mesurer Lighthouse/P75 sur une période comparable.
- [ ] Analyser les coûts du SSR, les dépendances et les styles historiques avant refactor ; ne jamais activer de cache partagé pour OWNER.

### P2 — Efficacité des outils

- [ ] Conserver les points d'entrée canoniques, supprimer un wrapper **uniquement si aucun consommateur ne l'utilise** et si le rollback est documenté.
- [ ] Mesurer gains d'exécution et temps agent avant de multiplier les runners, outils ou quality gates.

## Contrat entre dépôts

- **Site Alban :** UX de cartes, affichage des métadonnées déclaratives, ReactFlow/C4, i18n, confidentialité et navigateur.
- **[FastAPI Sample](https://github.com/AlbanAndrieu/fastapi-sample/blob/master/docs/engineering-roadmap.md) :** read-models `/api/site/catalog/v2` et `/api/site/health/v2`, sondes horodatées, provenance, alertes.
- **[nabla-compose](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/roadmap-portfolio.md) :** Backstage source d'autorité, apps, DNS/exposition, Gatus/Prometheus, scripts système.
- **Bababou et OpenClaw :** leurs propres roadmaps ; aucune checklist dupliquée ici.

Le détail des décisions du 30/10 au 13/11, les métriques historiques et les explications de PR sont conservés dans [l'archive datée](archive/quality-roadmap-before-v2-reconciliation-2026-11-14.txt).
