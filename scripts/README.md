# Scripts Site Alban — points d'entrée et ownership

**Réconcilié le 14 novembre 2026.** Ce répertoire exécute les contrôles **Next.js, qualité, Vercel et présentation**. Les opérations sur TrueNAS, les sondes et la source du catalogue Backstage appartiennent à `nabla-compose` / `fastapi-sample`. Un script « check » ne doit pas modifier la production.

## Routage par ressources disponibles

- **Workstation Claude Code :** `just context && just preflight`, `just agent-context homelab`, tests ciblés, navigateur et sondes LAN seulement lorsque le réseau/identité sont vérifiés. La gate L3 nécessite Node 24/npm 12, dépendances et checkout complet.
- **Agent Codex distant :** `AGENT_EXECUTION_MODE=remote node scripts/agent-task-context.mjs --task homelab` (si le script est disponible), sinon fichiers GitHub exact-SHA, review, tests statiques et documentation. Ne pas lancer en boucle les sondes LAN, npm ou DNS inaccessibles. Les vérifications indisponibles restent `NOT_RUN`.
- Le routeur est **sans réseau**, n'ouvre aucun secret, ne modifie rien et ne certifie jamais un droit OWNER ; `LOCAL_READY` décrit les dépendances locales, pas la qualité du code.

## Commandes canoniques (préférer celles-ci aux scripts ad hoc)

| Domaine | Commande | Effet |
| --- | --- | --- |
| **Catalogue Backstage V2 / cartes** | `npm run test:catalog:v2` ou `just catalog-v2-check` | Tests ciblés : v2, clé canonique, projection, cache SERVICE et confidentialité |
| **Icônes locales** | `just icons-local-check` / `just icons-check` | Vérification locale / comparaison facultative du mapping Compose |
| **Audit OWNER/SERVICE** | `just audit-owner` / `just audit-service` / `just audit-denied` | Requêtes diagnostics soumises aux politiques serveur ; pas de création de droits |
| **Audit HTTP et 429** | `npm run audit:homelab` / `npm run diagnose:homelab-429` | Compare les réponses HTTP réellement reçues ; refus d'accès ≠ panne |
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
- **Archivés :** les anciennes instructions d'avant cutover sont sous `docs/archive/` ; un wrapper ou exécutable n'est pas supprimé sur la seule base d'un nom « legacy » ou d'une PR fusionnée.
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
