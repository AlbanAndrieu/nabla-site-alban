# Feuille de route produit et qualité

Dernière réconciliation : 28 septembre 2026.

Cette roadmap est la source canonique des **travaux transverses encore ouverts**.
Elle ne sert plus de journal détaillé des PR déjà mergées : Git conserve cet
historique. Les procédures de diagnostic restent dans les runbooks et les retours
d'incident sous `docs/incidents/`.

## Règles de maintenance

- Conserver ici les décisions structurantes, les invariants et les tâches ouvertes.
- Une tâche terminée est compactée lors de la réconciliation suivante ; ne pas
  recopier la chronologie complète des commits, runs CI et corrections intermédiaires.
- Une information nécessaire au diagnostic doit rester dans un runbook ou un
  incident : symptômes, preuves, commandes de vérification, cause, mitigation,
  rollback et follow-up.
- Les travaux homelab détaillés vivent dans `docs/homelab-roadmap.md`. Cette
  roadmap ne garde qu'un pointeur lorsqu'un chantier homelab a un impact transverse.
- Une tâche n'est fermée que lorsque sa preuve correspond au HEAD réellement livré.

## Socle validé

- Next.js App Router et `next-intl` portent les routes principales EN/FR ; les
  CV HTML historiques restent une exception statique explicitement allowlistée.
- Node 26.8.2 et npm 11.17.x sont les cibles locales/CI ; Next et
  `eslint-config-next` sont verrouillés ensemble sur 16.3.4.
- Tailwind/PostCSS a été retiré du runtime et du build. Bootstrap/CDN reste une
  dette indépendante à réduire progressivement.
- La quality gate est local-first : preflight sans dépendances, auto-fix
  déterministe, SAST, lint/types/tests, build si nécessaire, puis preuve de
  publication exacte-SHA.
- Les changements non déployables peuvent éviter Next build/Preview sans éviter
  les contrôles de sécurité requis. Les changements runtime conservent
  build + Preview + Playwright/ZAP.
- Le homelab distingue déclaration canonique, observation runtime, santé,
  provenance/fraîcheur et exposition réseau ; un tunnel sain n'est jamais une
  preuve que l'origine est saine.
- Renovate est l'unique propriétaire prévu des PR de dépendances et de leur rebase
  conflictuel. Les GitHub vulnerability alerts restent la source sécurité ;
  Dependabot ne doit pas créer une seconde famille de PR.

## P0 — Protection de merge, publication et dépendances

- [ ] **Activer et auditer le ruleset `master`** décrit dans
  `docs/github-master-ruleset.md`. Les checks globaux sont `quality` et
  `CI policy guard`; les checks Preview restent conditionnels à
  `preview_required`. Fermer uniquement lorsque `--check` retourne
  `RULESET_OK` contre le dépôt live.
- [ ] **Valider le recovery post-merge** avec les permissions GitHub réelles :
  échec auto-corrigeable → PR de remédiation + dispatch de la CI ; échec non
  auto-corrigeable → issue diagnostique dédupliquée. Ce filet ne remplace jamais
  la gate pré-publication.
- [ ] **Prouver un cycle workstation complet** :
  `quality:agent:fix` → revue du diff → commit → `quality:agent:publish`,
  arbre final propre et preuve exacte encore valide avec `--status`.
- [ ] **Finaliser l'ownership Renovate** : garder GitHub vulnerability alerts
  activées mais désactiver *Dependabot Security Updates* dans les réglages du
  dépôt avant d'activer les PR de vulnérabilité Renovate ; vérifier/installer
  Mend Renovate App, observer le premier Dependency Dashboard et une PR
  `security`, puis vérifier qu'un conflit est résolu par le seul
  `rebaseWhen=conflicted` de Renovate.
- [ ] **Finaliser Semantic Release** : fournir l'identité GitHub App requise,
  créer réellement le tag/release `v0.0.1` puis vérifier changelog et rollback.
  Un run de skip contrôlé n'est pas une preuve de publication.

## P1 — UI/UX et design system

- [ ] Auditer les pages principales en thème clair/sombre et supprimer les
  contrastes/surfaces incohérents encore hérités de Bootstrap/CSS historique.
- [ ] Finaliser les tokens sémantiques globaux (couleurs, surfaces, espacement,
  rayons, typographie, ombres et états) avant d'ajouter de nouvelles variantes.
- [ ] Introduire `Section` et `PageHeader` uniquement lorsqu'un consommateur
  réel les justifie ; poursuivre la migration des layouts vers les primitives
  partagées et supprimer les styles inline devenus redondants.
- [ ] Réduire le chargement Bootstrap/CDN et Bootstrap Icons progressivement,
  route par route, sans casser les surfaces legacy encore servies.
- [ ] Toute migration visible doit conserver la matrice responsive
  320/375/768/1024/1440, focus clavier, touch targets et reduced-motion.

## P1 — Accessibilité, SEO et i18n

- [ ] Étendre le contrat 404 GET/HEAD aux chemins HTML legacy localisés/nichés
  uniquement après preuve qu'il ne capture ni redirects SEO, ni
  `HTML_ROUTE_SLUGS`, ni CV historiques.
- [ ] Appliquer aux images Alban encore actives les règles CLS déjà validées :
  dimensions intrinsèques, lazy loading et `next/image` pour les surfaces natives
  lorsque cela réduit réellement le coût.
- [ ] Ajouter un audit axe EN/FR reproductible lorsque `axe-core` peut être ajouté
  et verrouillé localement dans le lockfile ; ne pas introduire une dépendance
  uniquement depuis un runner hébergé.
- [ ] Revalider en production canonical, `hreflang`, robots, sitemap et Open Graph
  sur le host final `www`, puis traiter les anciennes URL `.html` encore
  indexées sans toucher aux CV historiques.
- [ ] Décider explicitement l'indexabilité de CTID, FreeNAS et Workstation, ainsi
  que le périmètre de langues éditoriales au-delà de EN/FR.

## P1 — Sécurité applicative

- [ ] Définir un rate limiting adapté à `create-checkout-session` et vérifier la
  validation `Origin` des POST initiés depuis un navigateur.
- [ ] Ajouter des webhooks Stripe signés uniquement lorsqu'un paiement déclenche
  un état métier serveur.
- [ ] Durcir progressivement la CSP à mesure que Bootstrap/CDN et les scripts/styles
  historiques sont retirés.

## P1 — Homelab transverse

Les tâches détaillées sont centralisées dans `docs/homelab-roadmap.md`. Les
priorités transverses restent : migration TrueNAS 26 WebSocket, cutover direct du
catalogue v2, progression Talos/Kubernetes, résilience DNS, métriques bornées et
séparation disponibilité/posture sécurité.

## P2 — Performance et dette de dépendances

- [ ] Compléter Lighthouse desktop sur un déploiement stable et définir des budgets
  de non-régression pour LCP, CLS, INP, JS, CSS et JavaScript tiers. Les budgets
  Preview actuels restent des garde-fous, pas des SLO utilisateurs.
- [ ] Compléter l'audit licences/dépendances puis poursuivre Knip sur les exports et
  types réellement morts, sans supprimer un contrat homelab consommé hors du
  graphe d'import applicatif.
- [ ] Après le premier cycle Renovate réel, valider le lot groupé avec la gate
  complète avant d'envisager un automerge ciblé de patch/minor à faible risque.
- [ ] Mesurer le gain local-first sur au moins trois runs comparables en séparant
  cache hit/miss, `npm ci`, gate et build ; ne pas déduire un gain d'une seule
  exécution.
- [ ] Étendre Playwright à Firefox/WebKit et aux profils mobiles uniquement lorsque
  la couverture supplémentaire justifie le coût.
- [ ] Rétablir une lecture automatisable des logs runtime Vercel lorsqu'un
  connecteur/endpoint adapté est disponible.

## P2 — Documentation et maintenance

- [ ] Archiver ou fusionner tout runbook qui ne décrit plus un runtime ou une
  procédure active. Une migration terminée ne doit pas conserver une seconde
  roadmap permanente.
- [ ] Garder les PR de refactoring petites et thématiques ; l'historique détaillé
  reste dans Git plutôt que dans la roadmap.
- [ ] À chaque chantier transverse, comparer le dépôt frère
  `nabla-site-bababou` et ne reprendre que les écarts de plateforme réellement
  utiles.

## Historique compact des fondations livrées

| Domaine | État conservé |
| --- | --- |
| Migration Next | Routes principales natives, i18n/canonical/hreflang et compatibilité legacy ciblée |
| UI | Tokens/primitives de base, thème global, reduced-motion et responsive contracts |
| Qualité | Gate agent-first/local-first, code-size guard, SAST, unit/type/lint/build et exact-SHA Preview |
| Sécurité | ZAP Preview/production, headers de base, supply-chain install scripts explicites |
| CSS | Tailwind/PostCSS supprimé ; Bootstrap reste le chantier résiduel |
| Homelab | Catalogue + santé + topologie séparés, polling partagé, diagnostics pfSense/TrueNAS/Cloudflare |
| Dépendances | Knip on-demand, lockfile contrôlé, Renovate groupé/rate-limité en cours d'activation |

Les preuves détaillées d'une livraison terminée sont les commits/PR/runs Git et,
lorsqu'elles restent utiles à l'exploitation, les documents indexés dans
`docs/README.md`.
