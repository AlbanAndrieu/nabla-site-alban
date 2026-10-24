# Icônes locales des services homelab

Audit du 24 octobre 2026, source du catalogue : `AlbanAndrieu/nabla-compose`
(`catalog/homelab-services.json` + `apps/*/catalog-info.yaml`).

Les icônes sont servies depuis `/assets/selfh-icons/` : **aucune requête navigateur
vers les CDNs des fournisseurs d'icônes**. Le site reste consommateur du catalogue
Backstage v2 et ne conserve pas un second inventaire opérationnel.

## Provenance

- `dozzle.svg`, `draw-io.svg`, `home-assistant.svg`, `joplin.svg`,
  `netbox.svg`, `openhands.svg`, `pi-hole.svg`, `scanopy.svg`,
  `traefik.svg`, `wordpress.svg`, `crowdsec.svg`, `haproxy.svg`,
  `influxdb.svg`, `langflow.svg`, `neo4j.svg`, `obsidian.svg`,
  `opensearch.svg`, `sonarqube.svg`, `watchtower.svg`,
  `wazuh.svg`, `elasticsearch.svg`, `hermes-agent.svg`,
  `grafana-pyroscope.svg` : **selfh.st Icons**, licence CC BY 4.0,
  https://github.com/selfhst/icons et https://creativecommons.org/licenses/by/4.0/.
- `dependency-track.svg`, `dockhand.svg`, `docling.svg`,
  `visual-studio-code.svg` : **Homarr Dashboard Icons**, dépôt sous licence
  Apache 2.0, https://github.com/homarr-labs/dashboard-icons.
  Le logo Dockhand source est nommé `dockhand-svg.svg`.
- `defectdojo.svg` : favicon de **DefectDojo**, source officielle
  https://github.com/DefectDojo/django-DefectDojo/blob/master/docs/assets/favicon.svg.
- `cyberbro.svg`, `akvorado.svg`, `autoxpose.svg`, `cartography.svg`,
  `dsomm.svg`, `opconnect.svg`, `opencre.svg`, `openrag.svg`,
  `scorecard.svg`, `squid.svg`, `suricata.svg`,
  `sybase-exporter.svg` : pictogrammes originaux **spécifiques** composés
  pour le site (monogrammes et couleurs différenciés). Ils ne prétendent
  pas représenter un logo officiel des projets.

Les autres images étaient déjà présentes dans le dépôt. Les marques restent
la propriété de leurs titulaires respectifs.

## Contrat de rendu et de cache

- Le mapping des noms de fichiers est défini **uniquement** dans
  `nabla-compose/catalog/service-icons.json` (`webAssets`).
  `lib/homelabCatalogIcons.generated.ts` est un artefact généré ;
  `lib/homelabCatalogIcons.ts` est seulement son lecteur.
  Les déclinaisons partagent le logo du produit parent.
  Les clés absentes restent identifiables : on ne prétend pas connaître
  leur marque officielle.
- Le composant de cartes et les nœuds ReactFlow utilisent ce mapping, même
  lorsqu'une réponse FastAPI fournit une ancienne référence d'icône.
- `localStorage` ne conserve que la projection SERVICE v2 publiable :
  catalogue 15 min, états 2 min. Les états restaurés sont **stale/unknown**,
  jamais `OK` ; aucune preuve de sonde, IP LAN, secret ou état OWNER n'y entre.
- La clé du cache de catalogue passe de `:1` à `:2` pour invalider les
  anciennes icônes génériques en cache. Une révocation purge les deux versions.
- `unit-tests/homelabIconCoverage.test.mjs` vérifie la présence réelle
  des fichiers locaux et la couverture des IDs connus au 24 octobre 2026.

## À confirmer avant Ready

Build exact SHA sous Node 24 LTS, Playwright sur FR/EN TrueNAS et Architecture,
comparaison du catalogue v2 **réel** FastAPI et vérification visuelle des
icônes (y compris sous-ressources et exporters). Le site public et FastAPI
n'étaient pas accessibles depuis le navigateur de cet agent au moment de
l'audit ; la couverture ci-dessus porte sur le snapshot canonique GitHub,
pas sur un comptage observé en production.

## Synchronisation hors ligne

Depuis le dépôt du site, avec un checkout local de `nabla-compose` :

```sh
node scripts/sync-homelab-icons.mjs --source ../nabla-compose/catalog/service-icons.json
node scripts/sync-homelab-icons.mjs --source ../nabla-compose/catalog/service-icons.json --check
node --test unit-tests/homelabIconSync.test.mjs
```

Les images sous `public/assets/selfh-icons` sont la copie sous licence,
versionnée avec le site. Aucun accès GitHub ou CDN n'est nécessaire pendant
le build ou le rendu. Un nouveau service exige une entrée canonique dans
`nabla-compose` et un asset local vérifié ; la CI Compose contrôle la
couverture de toutes les entités `Component` et des entrées historiques.
Les anciens `iconSrc` présents dans le catalogue v1 sont une dette de
migration, pas une seconde autorité à enrichir.
