# Scripts Site Alban — points d'entrée et ownership

**Réconcilié le 14 novembre 2026.** Ce répertoire exécute les contrôles **Next.js, qualité, Vercel et présentation**. Les opérations sur TrueNAS, les sondes et la source du catalogue Backstage appartiennent à `nabla-compose` / `fastapi-sample`. Un script « check » ne doit pas modifier la production.

## Routage par ressources disponibles

- **Workstation Claude Code :** `just context && just preflight`, `just agent-context homelab`, tests ciblés, navigateur et sondes LAN seulement lorsque le réseau/identité sont vérifiés. La gate L3 nécessite Node 24/npm 12, dépendances et checkout complet.
- **Agent Codex distant :** `AGENT_EXECUTION_MODE=remote node scripts/agent-task-context.mjs --task homelab` (si le script est disponible), sinon fichiers GitHub exact-SHA, review, tests statiques et documentation. Ne pas lancer en boucle les sondes LAN, npm ou DNS inaccessibles. Les vérifications indisponibles restent `NOT_RUN`.
- Le routeur est **sans réseau**, n'ouvre aucun secret, ne modifie rien et ne certifie jamais un droit OWNER ; `LOCAL_READY` décrit les dépendances locales, pas la qualité du code.

## Prévention des conflits de PR

- Avant de modifier les fichiers, identifier une PR ouverte réutilisable : `node scripts/agent-pr-guard.mjs --paths AGENTS.md docs/agent-policy-details.md`. Nécessite un `gh` authentifié ; zéro installation et zéro mutation.
- Depuis une branche de PR avec checkout Git complet, relancer `just pr-guard` juste avant publication. Le script examine `origin/master...HEAD`, le contenu indexé, les changements locaux et les fichiers non suivis ; les renommages couvrent aussi l'ancien chemin.
- Pour l'API GitHub / agent distant : passer `--pr N --expected-head SHA` **si** `gh` est disponible ; sinon consulter les PR ouvertes et leurs fichiers via le connecteur. Aucune exécution locale ou preuve L3 n'est présumée.
- `REUSE` ou `CONFLICT` : sortie 4, changement de branche ou arbitrage requis. Erreur GitHub, SHA différent, base obsolète et dépassement de budget : sortie 3, **BLOCKED**. Ne jamais convertir une erreur réseau en « aucune PR ouverte ».

## Mesurer le volume de code sans déclencher de CI

- `just code-footprint` : **source Git locale** (lignes physiques/non vides, octets, fichiers au-dessus de 300/600 lignes), exclusions par défaut des médias, archives, générés, documentation, traductions et skills. Ne lit pas les fichiers privés non suivis.
- `just code-footprint-compare` : compare les deux checkouts voisins sur la workstation uniquement ; `node scripts/code-footprint.mjs --json --top 10` exporte un rapport borné. Sans `.git`/fichiers requis, le diagnostic échoue explicitement, jamais « zéro ligne ».
- Les résultats sont des tailles de **working tree** : ils ne prouvent ni la complexité, ni une amélioration de performance, ni la qualité L3. `scripts/check_code_size.py` reste l'unique gate 300/600 lignes : ne pas en créer une seconde.
- Codex distant : inspecter le benchmark Git daté dans `docs/quality-roadmap.md` ; tests et probes de la workstation `NOT_RUN` sans checkout/identité. Ne pas cloner ni relancer npm en boucle.

## Commandes canoniques (préférer celles-ci aux scripts ad hoc)

| Domaine | Commande | Effet |
| --- | --- | --- |
| **Catalogue Backstage V2 / cartes** | `npm run test:catalog:v2` ou `just catalog-v2-check` | Tests ciblés : v2, clé canonique, projection, cache SERVICE et confidentialité |
| **Icônes locales** | `just icons-local-check` / `just icons-check` | Vérification locale / comparaison facultative du mapping Compose |
| **Audit OWNER/SERVICE** | `just audit-owner` / `just audit-service` / `just audit-denied` | Requêtes diagnostics soumises aux politiques serveur ; pas de création de droits |
| **Audit HTTP et 429** | `npm run audit:homelab` / `npm run diagnose:homelab-429` | Compare les réponses réellement reçues ; refus ≠ panne. Pour ne sonder qu’un producteur : `just diagnose-site-access` ou `just diagnose-fastapi-livez` |
| **État SSR/SSG / ISR Vercel** | `node scripts/audit-vercel-runtime.mjs --json` | Lecture des artefacts Next déjà construits ; pas de CPU mesuré |
| **FinOps et smoke public** | `node scripts/finops/vercel-usage-budget.mjs --help` / `node scripts/finops/vercel-public-smoke.mjs --help` | Consomme des exports CLI explicites / sondes publiques bornées ; ne modifie pas de quota |
| **Gate ciblée** | `npm run test:unit` · `npm run lint` · `npm run typecheck` | Qualité au checkout courant, résultats datés |
| **Gate L3 publication** | `npm run quality:agent:publish` | Attestation exacte HEAD + base + toolchain, après `npm ci` et build |
| **Routeur agent** | `just agent-context` | Conseils de tests, pas une preuve d'exécution |
| **Déploiement et CI** | workflows du dépôt, publication Vercel | Pas de déclenchement automatique à partir d'un audit documentaire |

## Refactorisation effectuée et politique de nettoyage

- **Livré :** le site consomme `/api/homelab-catalog-v2` (PR #301), plus de lecteur `/api/homelab-services`/`topology` ni fichier JSON public de secours. Ne pas réintroduire d'adaptateur ou script qui reconstruit la V1.
- **Livré dans cette PR :** `npm run test:catalog:v2` concentre les tests V2 existants (pas de nouvelle suite concurrente) ; `HomelabCatalogMetadata` est un composant partagé, pas un renderer DOM impératif.
- **Refactoring React codé :** `indexOwnerNavigation` produit un index OWNER borné au snapshot, `homelabHealthSelectors` mutualise les index par page, `matchesCatalogServiceSearch` et `servicePresentationLabels` suppriment des divergences entre TrueNAS et Architecture. Les ressources utilisent une horloge commune et les alertes runtime ne sont plus répétées par groupe. Sans mesure navigateur, l’amélioration de performance reste `NOT_MEASURED`.
- **Conservés :** `scripts/sync-homelab-icons.mjs` (source déclarative Compose), `scripts/audit-homelab-access.mjs`, `scripts/finops/*`, `agent-quality-gate.sh` et les vérifications d'accessibilité/SEO. Ils ont des consommateurs et des contrats.
- **Archivés :** les anciennes instructions d’avant cutover et deux notes de migration sont sous `docs/archive/`.
- **Retiré :** `scripts/old/generate_fr_locale_html.py` (ancien générateur HTML via `googletrans`, sans consommateur trouvé dans le code et les commandes canoniques). Son historique reste disponible dans Git ; `next-intl` gère les traductions du Site. Aucun script encore utilisé n’est supprimé sur son seul nom « legacy ».
- **À évaluer :** scripts en double (`agent-*`, `quality-*`), CLI de budget et anciens adaptateurs HTML ; ne retirer qu'après inventaire `rg` des références, tests locaux, preuve des consommateurs et rollback.

## Vérification minimale avant nouvelle PR

```bash
node --version        # Node >=24.22.1 <25 ; npm >=12.2.0 <13
npm ci
npm run test:catalog:v2
just icons-local-check
npm run test:unit
npm run lint
npm run lint:css
npm run typecheck
npm run build
npm run quality:agent:publish
```

Documenter `CODED`, `TESTED`, `DEPLOYED` et `ACCEPTED` séparément. Les historiques sont dans [les archives](../docs/README.md) et les arbitrages dans [la roadmap générale](../docs/quality-roadmap.md) et [la roadmap homelab](../docs/homelab-roadmap.md).
