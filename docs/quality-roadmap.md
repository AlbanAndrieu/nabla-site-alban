# Feuille de route produit et qualité

Dernière réconciliation : 30 septembre 2026.

Cette roadmap contient les **travaux transverses encore ouverts** et les invariants
nécessaires pour comprendre l'état cible. Git/GitHub conserve la chronologie
complète des PR, commits et runs ; les procédures de diagnostic restent dans les
runbooks et les retours d'incident sous `docs/incidents/`.

## Règles de maintenance

- Garder ici les décisions structurantes, invariants et tâches ouvertes.
- Compacter une tâche terminée lors de la réconciliation suivante ; ne pas recopier
  la chronologie des corrections intermédiaires.
- Garder les preuves utiles au diagnostic dans un runbook ou un incident :
  symptômes, commandes, cause/incertitude, mitigation, rollback et follow-up.
- Les travaux homelab détaillés vivent uniquement dans `docs/homelab-roadmap.md`.
- Une tâche n'est fermée que lorsque sa preuve correspond au HEAD réellement livré.

## Invariants livrés

| Domaine | État à préserver |
| --- | --- |
| Runtime | Next.js App Router + `next-intl` pour EN/FR ; CV HTML et 404 statique restent des exceptions explicitement conservées |
| Toolchain | Node 26.8.2 / npm 11.17.x en local/CI ; `next` et `eslint-config-next` restent alignés |
| Qualité | Gate local-first, auto-fix déterministe, SAST, lint/types/tests, build conditionnel et preuve exact-SHA |
| Preview | Les changements runtime gardent Vercel Preview + Playwright/ZAP ; les changements non déployables suivent `ci-scope.sh` |
| Sécurité | Headers de base, ZAP Preview/production et install scripts explicitement contrôlés |
| CSS/UI | Tailwind/PostCSS retiré ; Bootstrap/CDN reste la dette résiduelle à réduire progressivement |
| Homelab | Déclaration, observation runtime, santé, provenance/fraîcheur et exposition restent distinctes ; un tunnel sain ne prouve pas une origine saine |
| Dépendances | Renovate est l'unique propriétaire prévu des PR/rebases de dépendances ; Dependabot ne doit pas créer une seconde famille de PR |
| Documentation | Index central, deux roadmaps actives, incidents séparés des runbooks et backlog ouvert limité aux roadmaps par `documentationPolicyContract.test.ts` |

## P0 — Protection de merge, publication et dépendances

- [ ] **Activer le ruleset `master` depuis une workstation autorisée** :
  l'audit live du 30 septembre confirme qu'aucun ruleset n'est installé. Exécuter
  `scripts/manage-master-ruleset.sh --apply`, puis fermer uniquement lorsque
  `--check` retourne `RULESET_OK`. Contrat et rollback :
  `docs/github-master-ruleset.md`.
- [ ] **Valider les permissions live du recovery post-merge** : les contrats locaux
  couvrent trigger master, séparation read/write, patch déterministe, déduplication
  et fallbacks PR/issue/dispatch. Il reste à prouver sur le dépôt réel :
  auto-fixable → PR + dispatch CI ; non auto-fixable → issue dédupliquée.
- [ ] **Prouver un cycle workstation complet** :
  `quality:agent:fix` → revue du diff → commit → `quality:agent:publish`,
  arbre propre et preuve exacte encore valide avec `--status`.
- [ ] **Activer Renovate côté dépôt** : au 30 septembre, aucun Dependency
  Dashboard ni PR Renovate n'est visible. Désactiver *Dependabot Security Updates*,
  confirmer Mend Renovate App, puis observer Dashboard, PR `security` et un
  rebase conflictuel géré uniquement par `rebaseWhen=conflicted`.
- [ ] **Finaliser Semantic Release** : aucune GitHub Release n'est publiée au
  30 septembre. Fournir l'identité GitHub App, publier réellement `v0.0.1`,
  puis vérifier changelog et rollback.

## P1 — UI/UX et design system

- [ ] Auditer les pages principales en thème clair/sombre et supprimer les
  contrastes/surfaces incohérents encore hérités de Bootstrap/CSS historique.
- [ ] Finaliser les tokens sémantiques globaux avant d'ajouter de nouvelles variantes.
- [ ] Introduire `Section` et `PageHeader` seulement avec un consommateur réel ;
  poursuivre la migration vers les primitives partagées et supprimer les styles
  inline redondants.
- [ ] Réduire Bootstrap/CDN et Bootstrap Icons progressivement, route par route.
- [ ] Toute migration visible doit conserver responsive 320/375/768/1024/1440,
  focus clavier, touch targets et reduced-motion.

## P1 — Accessibilité, SEO et i18n

- [ ] Étendre le contrat 404 GET/HEAD aux chemins HTML legacy localisés/nichés
  seulement après preuve qu'il ne capture ni redirects SEO, ni
  `HTML_ROUTE_SLUGS`, ni CV historiques.
- [ ] Appliquer aux images Alban actives les règles CLS : dimensions intrinsèques,
  lazy loading et `next/image` lorsque cela réduit réellement le coût.
- [ ] Ajouter un audit axe EN/FR reproductible lorsque `axe-core` peut être
  verrouillé localement dans le lockfile.
- [ ] Finaliser l'audit SEO production sur `www` : canonical, `hreflang`,
  robots, sitemap et Open Graph. Les redirects `/contact.html` et `/ai.html`
  vers leurs URLs sans extension sont confirmés ; conserver les redirects legacy
  tant que les moteurs exposent encore ces anciennes URLs et au minimum jusqu'au
  23 août 2027, sans toucher aux CV historiques.
- [ ] Décider l'indexabilité de CTID, FreeNAS et Workstation, ainsi que le périmètre
  de langues éditoriales au-delà de EN/FR.

## P1 — Sécurité applicative

Le premier jalon DSOMM est livré comme snapshot OWASP statique sous
`/security/dsomm` : aucun iframe, aucune base et aucun fetch runtime. Le futur
service DSOMM de `nabla-compose` remplacera uniquement la provenance des données
en conservant le contrat consommateur typé du site.

- [ ] Définir un rate limiting adapté à `create-checkout-session` et vérifier
  la validation `Origin` des POST navigateur.
- [ ] Ajouter des webhooks Stripe signés uniquement lorsqu'un paiement déclenche
  un état métier serveur.
- [ ] Durcir progressivement la CSP à mesure que Bootstrap/CDN et les scripts/styles
  historiques sont retirés.

## P1 — Homelab transverse

Les tâches détaillées sont dans `docs/homelab-roadmap.md`. Priorités :
TrueNAS 26 WebSocket, cutover catalogue v2, Talos/Kubernetes, résilience DNS,
métriques bornées et séparation disponibilité/posture sécurité.

## P2 — Performance et dette de dépendances

- [ ] Compléter Lighthouse desktop sur un déploiement stable et définir des budgets
  de non-régression LCP, CLS, INP, JS, CSS et JavaScript tiers.
- [ ] Compléter l'audit licences/dépendances puis poursuivre Knip sur les exports et
  types réellement morts, sans supprimer un contrat homelab consommé hors du
  graphe d'import applicatif.
- [ ] Après le premier cycle Renovate réel, valider le lot groupé avec la gate
  complète avant d'envisager un automerge ciblé de patch/minor à faible risque.
- [ ] Mesurer le gain local-first sur au moins trois runs comparables en séparant
  cache hit/miss, `npm ci`, gate et build.
- [ ] Étendre Playwright à Firefox/WebKit et aux profils mobiles seulement lorsque
  la couverture supplémentaire justifie le coût.
- [ ] Rétablir une lecture automatisable des logs runtime Vercel lorsqu'un
  connecteur/endpoint adapté est disponible.

Les preuves détaillées des livraisons terminées restent dans Git/GitHub et, si
elles ont encore une valeur opérationnelle, dans les documents indexés par
`docs/README.md`.
