# Roadmap active — nabla-site-alban

**Réconciliation : 24 octobre 2026.** Ce fichier ne décrit que les changements **exécutés dans ce dépôt**. Les tâches d'infrastructure et de collecte appartiennent aux roadmaps [Compose](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/roadmap.md) et [FastAPI](https://github.com/AlbanAndrieu/fastapi-sample/blob/master/docs/engineering-roadmap.md). Les anciennes tâches détaillées restent consultables dans [l'historique avant nettoyage](https://github.com/AlbanAndrieu/nabla-site-alban/blob/e3649e3c2332147fb06181dbccdf5a300398de64/docs/homelab-roadmap.md). Aucun `DONE` n'est déduit d'un merge.

## P0 — Reprendre le déploiement Vercel du site

- [x] Diagnostiquer les journaux du déploiement `dpl_79f381ZKNByyB24ay5dz8WjjkV9T` de `master` après Site #254 : échec TypeScript `TS17001`, attribut `data-evidence-key` dupliqué dans `ServiceOwnerEvidenceSummary.tsx`.
- [x] Supprimer l'attribut JSX dupliqué dans une PR Site dédiée ; ajouter un contrat qui empêche la régression.
- [ ] Exécuter les gates locales `just offline-l1`, `just p0`, `just quality`, `npm run typecheck`, `npm run build`, les tests unitaires et Playwright au **même SHA**. Ne pas lancer de CI GitHub payante.
- [ ] Vérifier une Preview du même SHA, puis établir une stratégie de publication Vercel selon les permissions disponibles. Ne pas affirmer que #254 est en prod quand le domaine pointe encore vers `092753b6b2eff983f2eb6922871fd0950625376d`.
- [ ] Contrôler en production après déploiement les pages `/fr/truenas`, `/en/truenas`, `/fr/architecture`, les icônes locales, la navigation clavier, les liens externes et le graphe ReactFlow ; consigner SHA/HTTP/horodatage. Un déploiement READY seul ne valide pas la page.

**Done :** build Next.js et tests au SHA exact, domaine de production sur ce SHA, recettes FR/EN publiques et OWNER effectuées.

## P0 — Terminer la migration d'affichage Backstage v2

- [ ] Garder la lecture des catalogues via `/api/homelab-catalog-v2` et la source Compose unique `catalogRevision`. Identifier puis retirer seulement les **consommateurs runtime encore actifs** des anciens endpoints/JSON v1 ; ne pas supprimer de module utilisé par la projection v2 ou par des tests tant que la couverture n'est pas équivalente.
- [ ] Assurer une correspondance non ambiguë `entityRef` pour les cartes et le graphe, y compris sous-composants, ressources et exporters. Un ID absent ou ambigu affiche `unknown`.
- [ ] Résoudre les icônes à partir du mapping généré Compose `lib/homelabCatalogIcons.generated.ts` ; vérifier les assets réels, l'attribution et les chemins d'icônes sur FR/EN. Aucun second référentiel `iconSrc`.
- [ ] Afficher le DTO OWNER FastAPI sans modifier la politique de santé côté navigateur : Docker app + conteneur principal, HTTP/HTTPS/TLS, tunnel Cloudflare, latence **si datée**, horodatage et état de chaque sonde. Respecter `disabled`, `not-configured`, `not-executed`, `stale`, `failed` et `observed`.
- [ ] Rendre les liens externes/LAN **uniquement si autorisés**, étiqueter `déclaré, non sondé`, éviter les paramètres sensibles et afficher les erreurs `owner-boundary` sans créer d'URL de secours fictive.
- [ ] Dans la vue SERVICE publique, conserver seulement le read-model expurgé et son cache `localStorage` versionné (TTL catalogue 15 min, santé 2 min), avec cache restauré `unknown` et aucun état OWNER.

**Done :** même `catalogRevision` sur les deux vues ; diagnostics complets seulement en OWNER ; aucune fuite LAN ou clé dans le bundle public.

## P0 — Tests de confidentialité et accès OWNER

- [ ] Depuis le Wi-Fi autorisé, comparer `/api/homelab-access?diagnose=1`, `/api/homelab-health`, `/api/homelab-probes` et les cartes. Le statut `authorized` du CIDR ne prouve pas que l'upstream OWNER est accessible.
- [ ] Depuis un réseau extérieur, vérifier `public-readonly` et le refus des routes OWNER ; aucune IP privée, preuve de sonde, posture ni secret en JSON/HTML/RSC/assets/CDN.
- [ ] Distinguer 401/403/503, timeout, snapshot ancien et absence de sonde. Tester révocation de session, retour réseau, expiration du cache et accès Cloudflare avec JWT vérifié.
- [ ] Maintenir BetterLeaks, SAST/DAST, Trivy et les contrôles de qualité du dépôt ; éviter de dupliquer les workflows GitHub coûteux.

**Done :** refus extérieurs et affichage OWNER prouvés au SHA en production, avec contrôles de confidentialité.

## P1 — Performance, accessibilité et UX

- [ ] Mesurer LCP/INP/CLS et le poids JS de `/fr/truenas` (production vs Preview), vérifier que les cartes s'affichent avant ReactFlow et que les panneaux diagnostics sont chargés seulement à l'ouverture.
- [ ] Dédupliquer la revalidation SERVICE entre TrueNAS et Architecture ; évaluer `ETag` et `BroadcastChannel` avec clé `catalogRevision`, sans partager de donnée OWNER entre onglets.
- [ ] Évaluer `content-visibility` ou virtualisation pour les groupes nombreux après tests de focus, recherche, filtres et lecteurs d'écran.
- [ ] Maintenir un registre de preuves compact, nombres tabulaires, erreurs explicites et traductions FR/EN sans doublons de contrôles.

## P1 — Sécurité et contenus du site

- [ ] Vérifier les documents `security.txt`, vie privée et pages sécurité/DSOMM contre leurs références canoniques ; ne pas recopier les métriques ou évaluations de sécurité de FastAPI dans le site.
- [ ] Conserver la convergence des quality gates génériques avec `nabla-site-bababou`, sans introduire de données ou particularités métier dans Site Alban.
- [ ] Confirmer par des tests les intégrations Stripe/PostHog déjà configurées, désactivées par défaut si une collecte métier est nouvelle ; conserver leurs plans dans leurs documents dédiés plutôt que dans cette roadmap homelab.

## P1 — Skill `frontend-design` : installation par l'utilisateur

- [ ] Lors de la reprise du design, **demander à l'utilisateur de l'installer lui-même** : `npx skills use "https://github.com/anthropics/skills" --skill "frontend-design"`. Ne pas l'installer automatiquement.
- [ ] Lire la sortie complète fournie par l'utilisateur et résoudre les chemins relatifs depuis le répertoire `supporting-files` annoncé ; vérifier la provenance avant utilisation.
- [ ] Demander séparément l'accord avant d'installer tout autre skill externe ; ne rien installer sur TrueNAS/Talos.

## Dépendances inter-dépôts — référencées, non reprises comme tâches du site

| Propriétaire | Livrable requis par le site | Lien |
| --- | --- | --- |
| `fastapi-sample` | Sondes LAN par service, timestamps fiables, Gatus/Prometheus/exporters, statuts HTTP/TLS/Cloudflare et contrat OWNER versionné | [Roadmap FastAPI](https://github.com/AlbanAndrieu/fastapi-sample/blob/master/docs/engineering-roadmap.md) |
| `nabla-compose` | Collecteur TrueNAS autorisé, LAN probes, catalogue Backstage/icons, DNS/Traefik/Tunnel, secrets Vaultwarden et politiques réseau | [Roadmap Compose](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/roadmap.md) |
| `nabla-compose` | Talos/Kubernetes, migration TrueNAS 26, pfSense/Unbound/pflow, Akvorado, OpenRAG, GitHub App/DefectDojo | [PR Compose #274](https://github.com/AlbanAndrieu/nabla-compose/pull/274) |

**Règle de clôture :** source ≠ test réussi ≠ déploiement READY ≠ recette fonctionnelle. Conserver `NOT_RUN`, `stale` et `unknown` sans inventer de résultats. Aucun merge automatique.
