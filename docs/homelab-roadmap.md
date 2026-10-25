# Roadmap active — nabla-site-alban


## P1 — Diagrammes C4 interactifs (ADR-0001, Site owner)

**Décision et RACI :** [Compose architecture governance](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/architecture-governance.md).
- [x] Choisir `@xyflow/react` existant : pas de Mermaid concurrent, d'iframe ni de serveur Structurizr à administrer.
- [x] Ajouter `L1 Contexte` (acteurs et systèmes externes, conceptuel) et `L2 Conteneurs/services` (nœuds et relations depuis la topologie Backstage v2 déjà chargée).
- [x] Borner L2 à 16 nœuds, 48 liens, ordonner de façon déterministe et ne pas recopier URL LAN, headers, probes ou secrets dans le modèle C4.
- [x] Prévoir version textuelle accessible, sélecteur clavier et respect du scroll sur mobile.
- [x] Ajouter un drill-down C4 au clic/clavier : relations entrantes/sortantes déclarées, mise en évidence, navigation vers un service adjacent et effacement explicite de la sélection. Aucun état runtime inféré.
- [ ] Confirmer en Preview exact-SHA les diagrammes et leur lisibilité FR/EN, l'accès PUBLIC/OWNER, l'absence de données privées et la navigation avec un lecteur d'écran.
- [ ] **L3 Composants** seulement après ajout des relations de composants dans la source Compose/Backstage v2, sans inférer des nœuds C4 depuis les services Docker.
- [ ] Évaluer un export facultatif Structurizr DSL depuis la même source après usage réel ; aucune dépendance au serveur Structurizr.

**Done :** contrôle `just source-check`, build Next.js Node 24 et test navigateur vérifiés au même HEAD. C4 décrit l'architecture, pas la santé runtime.

## P0 — Corrélation des causes et contrôle d'accès (25 octobre 2026)

**Document canonique Site :** [diagnostic et accès](homelab-diagnostics-and-access.md). Gouvernance des décisions transverses : [Compose ADR et dispatch](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/architecture-governance.md).
- [x] Qualifier la phase d'erreur du catalogue côté serveur Next.js et accepter
  uniquement les codes FastAPI autorisés ; exposer un `requestId` Site sur 503
  OWNER, sans corps d'erreur amont ni IP/secret.
- [x] Ajouter des tests purs de classification d'erreur dans `just source-check`.
- [ ] Relier les IDs de trace Site / API / collecteur via OpenTelemetry ; ne pas
  assimiler le `requestId` Site actuel à un trace ID partagé.
- [x] Mutualiser entre les cartes TrueNAS et le panneau Architecture la raison de refus catalogue et la référence d'incident OWNER, sans divulgation au mode SERVICE. Test de contrat ajouté.
- [x] Rejeter le catalogue Architecture OWNER dès le premier rendu suivant une transition vers SERVICE, avant le nettoyage React asynchrone (`catalogScopeMatches`). Ajouter un test contre la régression.
- [x] Assainir également **les réponses HTTP 503** des deux routes catalogue pour les visiteurs publics ; un accès SERVICE temporaire ne doit pas exposer `stage`, `requestId` ni la raison de configuration privée, même hors React. Réautoriser OWNER au serveur et tester le contrat.
- [ ] Montrer une chronologie compacte : catalogue → FastAPI → TrueNAS → Site,
  avec observateur/phase/fraîcheur et cause explicite dans les cartes OWNER.
- [ ] Valider droits PUBLIC/SERVICE/OWNER, réseau LAN, JWT Cloudflare et refus
  d'en-têtes spoofés sur une Preview accessible au SHA exact.
- [ ] Conserver le transport, l'authentification et l'autorisation **dans le serveur**
  avant l'arrivée d'une gateway ou de Keycloak.


**Réconciliation : 24 octobre 2026.** [Site #255](https://github.com/AlbanAndrieu/nabla-site-alban/pull/255) fusionnée (`86627eb7`) et publiée en production sur Vercel (READY). [PR de reprise Site #256](https://github.com/AlbanAndrieu/nabla-site-alban/pull/256) (Draft). La recette fonctionnelle OWNER/SERVICE reste ouverte. Ce fichier ne décrit que les changements **exécutés dans ce dépôt**. Les tâches d'infrastructure et de collecte appartiennent aux roadmaps [Compose](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/roadmap.md) et [FastAPI](https://github.com/AlbanAndrieu/fastapi-sample/blob/master/docs/engineering-roadmap.md). Les anciennes tâches détaillées restent consultables dans [l'historique avant nettoyage](https://github.com/AlbanAndrieu/nabla-site-alban/blob/e3649e3c2332147fb06181dbccdf5a300398de64/docs/homelab-roadmap.md). Aucun `DONE` n'est déduit d'un merge.

## P0 — Reprendre le déploiement Vercel du site

- [x] Diagnostiquer les journaux du déploiement `dpl_79f381ZKNByyB24ay5dz8WjjkV9T` de `master` après Site #254 : échec TypeScript `TS17001`, attribut `data-evidence-key` dupliqué dans `ServiceOwnerEvidenceSummary.tsx`.
- [x] Supprimer l'attribut JSX dupliqué dans une PR Site dédiée ; ajouter un contrat qui empêche la régression.
- [ ] Exécuter les gates locales `just offline-l1`, `just p0`, `just quality`, `npm run typecheck`, `npm run build`, les tests unitaires et Playwright au **même SHA**. Ne pas lancer de CI GitHub payante.
- [x] Preview Vercel du SHA `0d99738b` READY, puis fusion de Site #255. Production `www.albanandrieu.com` aliasée à `86627eb7` sur déploiement `dpl_D44EXX5iJKij8hbnHA4hTHuGjwy3` READY.
- [ ] Recette réelle HTTP et navigateur au commit de production : page TrueNAS FR/EN, architecture, OWNER/LAN autorisé et SERVICE public expurgé ; statut READY seul insuffisant.
- [ ] Contrôler en production après déploiement les pages `/fr/truenas`, `/en/truenas`, `/fr/architecture`, les icônes locales, la navigation clavier, les liens externes et le graphe ReactFlow ; consigner SHA/HTTP/horodatage. Un déploiement READY seul ne valide pas la page.

**Done :** build Next.js et tests au SHA exact, domaine de production sur ce SHA, recettes FR/EN publiques et OWNER effectuées.

## P1 — Résilience visuelle des icônes TrueNAS et ReactFlow

- [x] Si un asset local est absent ou si son chargement échoue, remplacer l'image cassée par un monogramme **spécifique au service**. Même contrat pour les cartes et les nœuds ReactFlow, sans chargement depuis un CDN ni HTML arbitraire.
- [x] Utiliser une identité visuelle locale déterministe (initiales et couleur calculée sur l'identifiant canonique), sans modifier les icônes officielles lorsque leurs assets se chargent.
- [x] Ajouter 6 tests unitaires au module sans dépendances (6/6 exécutés sous Node 22, contrôle TypeScript strict ciblé réussi), et trois contrats statiques d'intégration dans `just source-check`.
- [ ] Exécuter les nouveaux contrats sur le checkout complet, puis TypeScript/Next.js et Playwright au **HEAD exact** de la PR #255. Vérifier dans le navigateur les images 404 et les changements d'identifiant, et surveiller l'attribut `data-service-icon-fallback` pour auditer les fichiers défectueux.
- [x] Auditer les assets au commit publié `86627eb7` : 176 identités associées à 125 fichiers distincts, **aucun asset référencé manquant**, et `generic-app.svg` présent (preuve L0 Git).
- [x] Ajouter `just icons-local-check` et son contrat sans dépendance Compose, branchés sur `just source-check`, pour détecter fichiers absents, vides, liens symboliques et perte de logos critiques. Tests Node 22 sur fixture isolée : **5/5 PASS** ; exécution sur le dépôt complet à confirmer.
- [ ] Compléter l'audit de `nabla-compose/catalog/service-icons.json` à chaque nouvelle application ; un monogramme de repli ne remplace pas le vrai logo lorsqu'il existe.

## P0 — Terminer la migration d'affichage Backstage v2

- [x] Renforcer la validation des IDs SERVICE publics : refus explicite des types non textuels et des IDs non canoniques avant leur entrée dans React et `localStorage`. Validateur pur : **6/6 tests PASS** sous Node 22 dans l'environnement agent ; contrat d'intégration ajouté, à exécuter avec `just source-check` sur checkout complet.


- [x] **Migration de la source runtime** : `lib/homelabServices.ts` ne charge plus le JSON v1 ni les overrides d’URL. Ces contrats historiques sont isolés dans `unit-tests/helpers/homelabLegacyCatalogFixture.ts` pour les tests ; la lecture serveur et les cartes utilisent exclusivement Backstage v2, sans lien inventé lorsqu’une preuve OWNER manque.
- [ ] Vérifier les consommateurs de données restants, dont les fixtures statiques de topologie et les scripts, avant toute suppression de fichier v1. Conserver les contrats de compatibilité uniquement dans les tests.
- [x] Ne plus écraser les preuves OWNER lors de collisions par ID, nom ou URL. Les IDs ambigus restent sans preuve de sonde ; 4 tests unitaires du module d'identité passent sous Node 22 (L1 isolé).
- [ ] Assurer une correspondance non ambiguë `entityRef` pour les cartes et le graphe, y compris sous-composants, ressources et exporters. Un ID absent ou ambigu affiche `unknown`.
- [ ] Résoudre les icônes à partir du mapping généré Compose `lib/homelabCatalogIcons.generated.ts` ; vérifier les assets réels, l'attribution et les chemins d'icônes sur FR/EN. Aucun second référentiel `iconSrc`.
- [ ] Afficher le DTO OWNER FastAPI sans modifier la politique de santé côté navigateur : Docker app + conteneur principal, HTTP/HTTPS/TLS, tunnel Cloudflare, latence **si datée**, horodatage et état de chaque sonde. Respecter `disabled`, `not-configured`, `not-executed`, `stale`, `failed` et `observed`.
- [ ] Rendre les liens externes/LAN **uniquement si autorisés**, étiqueter `déclaré, non sondé`, éviter les paramètres sensibles et afficher les erreurs `owner-boundary` sans créer d'URL de secours fictive.
- [ ] Dans la vue SERVICE publique, conserver seulement le read-model expurgé et son cache `localStorage` versionné (TTL catalogue 15 min, santé 2 min), avec cache restauré `unknown` et aucun état OWNER.

**Done :** même `catalogRevision` sur les deux vues ; diagnostics complets seulement en OWNER ; aucune fuite LAN ou clé dans le bundle public.

## P0 — Tests de confidentialité et accès OWNER

- [x] Durcir `isSafePublicText` : rejeter les chemins privés cachés derrière `(`, `:`, `=` ou `[` ainsi que `/run/secrets`, `/var/lib` et `/workspace/users`. Nouveau test négatif reproductible sur les fichiers exacts : **échec avant correction ; 5/5 PASS après**, Node 22 L1.
- [ ] Vérifier en Preview au SHA exact que les projections SERVICE et le cache local ne diffusent aucune donnée OWNER ni chemin privé. Le test Node isolé ne vaut pas un audit navigateur.


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

- [x] Skills `frontend-design` et `web-design-guidelines` installés manuellement par l'utilisateur et committés sur `master`. Demander une nouvelle autorisation avant toute future installation ou mise à niveau.
- [ ] Lire la sortie complète fournie par l'utilisateur et résoudre les chemins relatifs depuis le répertoire `supporting-files` annoncé ; vérifier la provenance avant utilisation.
- [ ] Demander séparément l'accord avant d'installer tout autre skill externe ; ne rien installer sur TrueNAS/Talos.


## P0 — Alignement local-first Compose #274

- [x] Reporter les règles multi-agents de [Compose #274](https://github.com/AlbanAndrieu/nabla-compose/pull/274) : shell enfant, isolation des worktrees, `uv` par worktree pour les helpers Python, `npm ci` verrouillé et contrôle du HEAD avant publication.
- [x] Préserver l'interdiction Site de `[skip ci]` et les contrôles obligatoires.
- [ ] Exécuter le build Next.js sous **Node 24 LTS** au HEAD exact ; ne pas assimiler un test Node 22 à la preuve de publication.
- [ ] Vérifier une Preview Vercel du même SHA (FR/EN, icônes, ReactFlow, OWNER/SERVICE, confidentialité).
- [ ] Exécuter `just source-check` et la gate complète L3 sur checkout propre lorsque l'environnement Node/npm et le dépôt intégral sont disponibles.

## Dépendances inter-dépôts — référencées, non reprises comme tâches du site

| Propriétaire | Livrable requis par le site | Lien |
| --- | --- | --- |
| `fastapi-sample` | Sondes LAN par service, timestamps fiables, Gatus/Prometheus/exporters, statuts HTTP/TLS/Cloudflare et contrat OWNER versionné | [Roadmap FastAPI](https://github.com/AlbanAndrieu/fastapi-sample/blob/master/docs/engineering-roadmap.md) |
| `nabla-compose` | Collecteur TrueNAS autorisé, LAN probes, catalogue Backstage/icons, DNS/Traefik/Tunnel, secrets Vaultwarden et politiques réseau | [Roadmap Compose](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/roadmap.md) |
| `nabla-compose` | Talos/Kubernetes, migration TrueNAS 26, pfSense/Unbound/pflow, Akvorado, OpenRAG, GitHub App/DefectDojo | [PR Compose #274](https://github.com/AlbanAndrieu/nabla-compose/pull/274) |

**Règle de clôture :** source ≠ test réussi ≠ déploiement READY ≠ recette fonctionnelle. Conserver `NOT_RUN`, `stale` et `unknown` sans inventer de résultats. Aucun merge automatique.
