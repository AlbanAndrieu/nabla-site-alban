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

**Ordre recommandé après cette PR : S2 → S3 → S5**, tout en laissant la qualité L3 et le budget Vercel dans la roadmap générale. L'intégration V2 **S0** est clôturée côté code et ne figure plus parmi les migrations à réaliser.

## Critères de clôture

- [ ] **S1 :** exécuter `npm run test:catalog:v2` et L3 au SHA de la PR, puis contrôler les badges V2 sur TrueNAS et Architecture FR/EN.
- [ ] **S2 :** consigner une recette LAN OWNER et WAN SERVICE réels, y compris révocation et absence de fuite dans le cache ou les liens.
- [ ] **S3 :** comparer une preuve FastAPI horodatée, sa révision de catalogue et l'état rendu, sans faux vert ni faux rouge.

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
