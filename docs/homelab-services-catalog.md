# Contrat consommateur du catalogue homelab Backstage V2

**État au 14 novembre 2026 : implémenté dans Git** ([Site #301](https://github.com/AlbanAndrieu/nabla-site-alban/pull/301) fusionnée le 13/11) ; recette de production OWNER/SERVICE **non vérifiée**. L'ancienne note annonçant « migration V2 future » est [archivée](archive/homelab-catalog-v2-pre-cutover-guide-2026-11-14.txt). Les travaux restants appartiennent exclusivement à [`docs/homelab-roadmap.md`](homelab-roadmap.md).

## Responsabilités et flux

1. [nabla-compose](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/service-catalog-v2-normalization.md) produit les entités Backstage `catalog-info.yaml` : `entityRef`, `spec.type`, `spec.lifecycle`, `metadata.tags`, labels de criticité et relations.
2. [fastapi-sample](https://github.com/AlbanAndrieu/fastapi-sample/blob/master/docs/site-architecture-catalog-handoff.md) vérifie `catalogRevision` et sert la projection authentifiée `GET /api/site/catalog/v2` ; `GET /api/site/health/v2` porte les observations publiques expurgées. Le catalogue de sources et les sondes restent distincts.
3. Site Alban charge le catalogue via `lib/homelabSiteCatalog.ts` → `GET /api/homelab-catalog-v2`, le sanitise avant de le transmettre au client, et projette cartes et relations avec `lib/homelabCatalogV2Projection.ts`.
4. `app/components/homelab/HomelabServiceGrid.tsx` et l'Architecture partagent les **mêmes identités complètes** `component:default/name`, `resource:default/name` et `api:default/name`. L'icône reste une ressource locale non issue de FastAPI.

Le format accepté est `{ schemaVersion: 2, model: "backstage", catalogRevision: "sha256:<digest>", entities: [...] }`. Une révision absente, des entités dupliquées, une relation ambiguë ou un fallback V1 sont **refusés**, jamais remplacés par un inventaire manuel.

## Champs de présentation et limites

| Champ public autorisé | Usage dans les cartes | Limite |
| --- | --- | --- |
| `entityRef`, titre, `spec.type` | Identité, recherche et regroupement | Jamais un identifiant d'App TrueNAS inventé |
| `kind` : Component, Resource ou API | Type Backstage ; label traduit | Métadonnée déclarative |
| `spec.lifecycle` | Cycle de vie indiqué, ex. production/experimental | **Pas** un état RUNNING ni une disponibilité |
| `albandrieu.com/operational-criticality` | Criticité opérationnelle | Déclarée ; ne remplace pas l'état santé |
| `albandrieu.com/business-criticality` | Criticité métier | Déclarée ; ne remplace pas le score technique |
| `metadata.tags` | Catégorie affichable et analyse NIST | Tags filtrés côté serveur |
| `spec.dependsOn`, `consumesApis`, `providesApis`, `subcomponentOf` | Liens canoniques du graphe | Pas de relation synthétique ou implicite |
| Santé `/api/site/health/v2` | État `ok/warn/fail/unknown` joint par `entityRef` + révision | Fraîcheur, échec et accès refusé distincts |

## Frontières de confidentialité

- **SERVICE :** `lib/homelabPublicBrowserCache.ts` conserve uniquement les champs allowlistés (type, cycle de vie, niveaux de criticité, nom, catégorie), en excluant toute URL, IP, port, champ arbitraire et valeur de secret. Les icônes sont dérivées du mapping local et ne sont pas persistées. Une ancienne santé `ok` reste **unknown** lorsqu'elle est relue du cache.
- **OWNER :** runtime et endpoints peuvent apparaître uniquement après autorisation serveur, depuis un instantané FastAPI daté ; un lien déclaré sans preuve n'est pas une URL de navigation.
- **Révisions :** santé, graphe et cache ne se mélangent pas si leur `catalogRevision` diffère. Un HTTP 401/403, une sonde `NOT_RUN` ou une absence de métrique ne prouvent pas la panne du service.

## Présentation et maîtrise du coût client

Les deux pages réutilisent `lib/homelabCatalogSearch.ts` pour la recherche sur les **seules** facettes déclaratives autorisées. Les titres et les groupes sont centralisés dans `lib/servicePresentationLabels.ts`.

Pour les cartes OWNER, `lib/homelabOwnerServiceNavigation.ts` construit un index par snapshot et écarte tout identifiant ambigu ; les deux pages réutilisent cet index et leurs index de santé. La grille n'accède jamais à une observation OWNER après passage en lecture seule ou à une frontière d'accès refusée. Les alertes TrueNAS n'apparaissent qu'une fois dans le répertoire.

La fraîcheur des ressources horodatées est recalculée depuis une seule horloge côté TrueNAS, mise en pause lorsque l'onglet est caché. Un cache ou une réponse `boardState=stale` ne transforme jamais un statut ancien en `ok`.

Ces règles de coût client n'ont **pas** été chronométrées sur un navigateur réel dans cette PR ; elles ne constituent ni une réduction démontrée du CPU Vercel ni une preuve de santé de service.

## Contrôles et exploitation

```bash
npm ci
npm run test:catalog:v2
just icons-local-check
npm run typecheck
npm run build
```

Contrats techniques : `unit-tests/homelabCatalogV2Projection.test.ts`, `unit-tests/homelabPrivateCatalog.test.ts`, `unit-tests/homelabPublicBrowserCache.test.mjs`. L3 et l'observation browser FR/EN/LAN/WAN restent obligatoires sur le SHA effectivement déployé. Ne pas installer un deuxième transport v1/v2 ou un catalogue de secours local.
