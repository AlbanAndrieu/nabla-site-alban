# Roadmap d'ingénierie — interfaces homelab Site Alban

**Réconciliée le 14 novembre 2026** au HEAD GitHub. Ce backlog ne porte que sur le consommateur **Next.js/React** de Backstage V2 : pages `/fr/truenas` et `/fr/architecture`, affichage des services, cache et confidentialité OWNER/SERVICE. Les priorités transverses et la gate L3 appartiennent à la [roadmap générale](quality-roadmap.md).

[Archive avant réconciliation](archive/homelab-roadmap-before-v2-reconciliation-2026-11-14.txt) · [Contrat V2 vivant](homelab-services-catalog.md) · [Runbook frontend](frontend-runtime-scripts-runbook.md) · [Contrat de santé](homelab-dependency-health-ui.md).

## État réel au 14 novembre

| Objet | Réalisé dans le code | Preuve à conserver |
| --- | --- | --- |
| **S0 — Coupure V1 → V2** | **MERGED** [#301](https://github.com/AlbanAndrieu/nabla-site-alban/pull/301) le 13/11 : `/api/homelab-catalog-v2`, source FastAPI, aucune route/fallback V1 ; `entityRef`, `catalogRevision`, cache public dédié | Réception navigateur et runtime **NOT_VERIFIED** ; ne pas refaire le cutover |
| **S1 — Affichage Backstage V2** | **CODED sur la PR courante** : types, cycle de vie, criticité opérationnelle/métier, recherche enrichie et cache SERVICE expurgé ; icônes locales conservées | Tests ciblés et L3 exact-SHA à exécuter, puis FR/EN en conditions réelles |
| **S2 — Santé et diagnostic** | **CODED antérieurement** : distinction santé effective / runtime / sonde LAN, traces, signaux `unknown` / `stale` | Corrélation et fraîcheur observées sur le même `catalogRevision` à confirmer |
| **S3 — Visibilité OWNER/SERVICE** | Routes et composants d'accès séparés, cache public allowlisté, refus d'URL de service dans le DTO SERVICE | Tests LAN et WAN véritables, purge OWNER lors de la révocation |
| **S4 — Architecture et icônes** | ReactFlow, références d'entité, associations d'icônes locales | Vérifier cohérence du graphe, absence d'arêtes inventées et icônes de toutes les cartes |

Une entité du catalogue **déclare** un service, une relation et un cycle de vie ; elle ne démontre ni disponibilité, ni déploiement, ni succès du dernier contrôle. Les états `NOT_RUN`, `DENIED` et `STALE` ne deviennent jamais automatiquement `UP` ou `DOWN`.

## Priorités de modularisation — G7 / G6 / G8

- **G7 / S3–S4 :** `HomelabServicesBlock.tsx` (566 lignes) et `useHomelabHealth.ts` (562), fortes concentrations de rendu et d'orchestration des preuves. Découper en fonctions pures/composants spécialisés seulement avec tests : détection de révision, état `unknown` et frontières OWNER/SERVICE inchangés. Pas de changement de fréquence de sondes sans mesure.
- **G6 / S5–S6 :** CSS Architecture `HierarchicalArchitectureExplorer.module.css` (774 lignes) ; modulariser les styles sans perte de clavier, de lisibilité à 320/390 px ou d'accessibilité FR/EN. Captures et Playwright/Axe exigés avant conclusion.
- **G8 / S7 :** inventaire du script `post-deploy-smoke.mjs` (508 lignes), suppression des seuls doublons prouvés ; les scripts de `nabla-compose` et `fastapi-sample` ne doivent pas être recopiés ici. Relever le volume avec `just code-footprint` sur workstation ; la comparabilité entre deux dépôts est documentée dans [la roadmap générale](quality-roadmap.md#taille-du-code-et-recommandations--référence-du-14-novembre-2026).

### G7/S3 — Santé publique après suspension de l'onglet (CODED, NOT_RUN)

Lors d'un retour après une suspension d'au moins `PUBLIC_HEALTH_REFRESH_MS` (120 s), la vue **SERVICE** conserve les identités publiques et le catalogue déjà autorisé, mais invalide en mémoire les précédents statuts « ok/warn/fail » en `UNKNOWN` / `boardState=stale` avant la nouvelle réponse. Une sonde qui ne répond pas ne devient pas une panne confirmée. La logique OWNER, les URL internes et le cache persistant restent inchangés ; **aucun nouveau polling ni appel Vercel**. Tests de transformation pure et contrats source ajoutés, recette navigateur et preuve L3 `NOT_RUN`.

**Complément G7/S3 Architecture (16/11, CODED / NOT_RUN).** Le hook de santé de la vue Architecture invalide désormais les preuves SERVICE conservées en mémoire après au moins 120 s en arrière-plan, à l'aide du même sélecteur pur `markSiteHealthStale` que TrueNAS. Les cartes peuvent rester affichées mais les anciennes observations deviennent `stale/unknown` avant le chargement suivant. OWNER et `/api/homelab-health` restent isolés ; aucun nouveau timer, intervalle, stockage ou appel réseau. Le contrat source est étendu ; recette navigateur et L3 encore `NOT_RUN`. **Coordination :** [PR #320](https://github.com/AlbanAndrieu/nabla-site-alban/pull/320) traite l'état `scheduled` et touche la roadmap ; réconcilier ce document et `lib/siteHealthV2.ts` avant fusion, sans écraser les évolutions `scheduled`.

## Backlog restant — options de priorité

| ID | P | Objectif / critère d'acceptation |
| --- | --- | --- |
| **S1** | **P0** | **Figer et valider le rendu V2** (PR courante) : types/criticités/lifecycle sans URL ni secret en SERVICE, FR/EN, tests de parité cartes ↔ architecture, filtre et cache |
| **S2** | **P0** | **Recette OWNER/LAN et SERVICE/WAN** : vérification SHA, accès `/api/homelab-access?diagnose=1`, refus attendus, observation de l'UI, purge de l'état privé |
| **S3** | **P1** | **Santé des services** : joindre santé V2, Gatus/Prometheus et sondes OWNER par `entityRef` + révision ; absence de métrique = inconnu, pas panne |
| **S4** | **P1** | **Lisibilité UX** : distinguer « déclaré », « sans sonde », « preuve ancienne », « indisponible » ; mettre en évidence les dérives runtime et dépendances sans inventer de source |
| **S5** | **P1** | **Accessibilité et performance** : badges et icônes accessibles, clavier/lecteur d'écran, mobile 320/390 px ; mesurer ReactFlow et taille du catalogue |
| **S6** | **P1** | **C4 et navigation** : arêtes canoniques uniquement, liens OWNER basés sur les observations autorisées, revisiter les icônes après synchronisation Compose |
| **S7** | **P2** | **Dette technique** : dédoublonner les adaptateurs et scripts réellement redondants, inventorier les références V1 historiques avant tout retrait, garder les tests négatifs |
| **S8** | **P2** | **Ressources CPU/RAM/GPU/ZFS** : afficher uniquement des mesures producteur horodatées et autorisées ; jamais de CPU inventé depuis le catalogue |

**Ordre confirmé par le propriétaire (14/11) : G7 puis G6 puis G8**. Sur l'interface homelab, traiter S3/S4 (preuves et libellés) puis S5 (FR/EN, WCAG, mobile), avant S7 (suppression des doublons). Les filtres traduits et la région de résultats accessible ont été fusionnés via #306 ; L3, Playwright OWNER/SERVICE et mesures restent NOT_RUN. La qualité L3 et Vercel restent dans la roadmap générale. L'intégration V2 **S0** est clôturée côté code et ne figure plus parmi les migrations à réaliser.

## Critères de clôture

- [ ] **S1 :** exécuter `npm run test:catalog:v2` et L3 au SHA de la PR, puis contrôler les badges V2 sur TrueNAS et Architecture FR/EN.
- [ ] **S2 :** consigner une recette LAN OWNER et WAN SERVICE réels, y compris révocation et absence de fuite dans le cache ou les liens.
- [ ] **S3 :** comparer une preuve FastAPI horodatée, sa révision de catalogue et l'état rendu, sans faux vert ni faux rouge.

## Optimisations de rendu codées (non mesurées)

- **G7/S4 — Topologie de secours :** la construction `declared-only` est extraite dans `app/components/homelab/declaredServiceTopology.ts` (branche Draft du 15/11). Quand le graphe est absent, seules les entités du catalogue sont projetées, avec `entityRef`, `catalogRevision` et **zéro relation inventée** ; les URLs internes restent exclues. Deux tests ajoutés à la suite V2, exécution locale/L3 et réception navigateur `NOT_RUN`. Cette extraction n'invente pas de service disponible ni de gain CPU.

- **O(N) plutôt que des scans O(N²) pour les cartes OWNER :** index `indexOwnerNavigation` construit une fois par snapshot et partagé dans les deux pages. Les identifiants dupliqués sont rejetés. Un index est une optimisation de recherche, jamais une nouvelle source de vérité.
- **Calculs communs :** la carte reçoit les index de santé du parent et conserve la vérification stricte de `catalogRevision` et `boardState=fresh` avant un état SERVICE.
- **Une horloge par page :** la mesure de fraîcheur des ressources n'est plus répétée par groupe ; elle s'arrête lorsque l'onglet est caché et reprend à la visibilité. OWNER est masqué si accès révoqué.
- **Une alerte runtime par page :** les groupes ne répètent plus les mêmes avertissements ; les déclarations, preuves et incidents restent séparés.
- **Durcissement S2 / PR #305 :** `readOnly` traverse `ArchitectureTopologyView` → `ArchitectureServiceHierarchy` → `HomelabServiceGrid` et `HomelabRuntimeWarnings`. Les liens, snapshots et index OWNER sont masqués en SERVICE ; validation navigateur **NOT_RUN**.
- **Horloge Architecture :** aucun timer sans horodatage OWNER ; `Date.now()` hors rendu initial et suspension si l'onglet est caché. Gain CPU **NOT_MEASURED**.
- **Recherche et libellés uniques :** `lib/homelabCatalogSearch.ts` et `lib/servicePresentationLabels.ts` alimentent TrueNAS et Architecture ; le regroupement ne recopie plus les tableaux croissants.
- **Preuve manquante :** aucune mesure comparative réelle CPU/INP/CLS, aucun test L3 exact-SHA ; ne pas appeler ces changements un gain mesuré.

## Vérifications disponibles

```bash
npm ci
npm run test:unit
npm run lint
npm run lint:css
npm run typecheck
npm run build
npm run quality:agent:publish
# Rapports métier : just icons-local-check (si just installé).
```

Aucun test sur la workstation ou sur TrueNAS n'est présumé exécuté par cette PR. Les codes `401`/`403`/`429` ne sont pas automatiquement des échecs du service amont. Aucune donnée OWNER ou inventaire secret n'est persisté dans le cache SERVICE.

## Propriété

**Site :** cartes, filtres, métadonnées, accessibilité, C4 et sélecteurs. **FastAPI :** états et diagnostics (producteur). **Compose :** catalogue source, policy d'exposition, déploiements, probes et métriques. L'ancienne roadmap au 30/10 est archivée, sans rouvrir les points déjà livrés.
