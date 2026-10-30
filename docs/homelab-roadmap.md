# Roadmap active — interfaces homelab Site Alban

**Réconciliée le 30 octobre 2026.** Cette feuille ne couvre que les interfaces **Next.js/React** (`/fr/truenas`, `/fr/architecture` et les routes `/api/homelab-*`). Les composants TrueNAS, Talos, pfSense, FastAPI Sample, Gatus et Compose conservent leurs plans dans leurs propres dépôts.

[Historique complet avant consolidation](archive/homelab-roadmap-through-2026-10-30.txt) · [Roadmap qualité canonique](quality-roadmap.md) · [Contrat catalogue](homelab-services-catalog.md) · [Contrat des dépendances](homelab-dependency-health-ui.md).

## État vérifiable à date

| Sujet | Preuve | Conclusion |
| --- | --- | --- |
| Branche de référence | `master` au SHA `26bbb7b4257d2d94321eeea42192a6d0be58fe12` ; PR [#263](https://github.com/AlbanAndrieu/nabla-site-alban/pull/263), [#265](https://github.com/AlbanAndrieu/nabla-site-alban/pull/265), [#266](https://github.com/AlbanAndrieu/nabla-site-alban/pull/266) et [#267](https://github.com/AlbanAndrieu/nabla-site-alban/pull/267) intégrées | Ne plus afficher #263 comme Draft active |
| Vercel production | Déploiement `dpl_4QTK6birkaJftqE2XPgXTiDfQs1p`, `READY` sur le SHA ci-dessus | Build publié, pas de preuve des parcours LAN/WAN |
| Diagnostics OWNER/SERVICE | Tests et contrats d'accès existants ; aucune recette depuis le vrai LAN/WAN au SHA ci-dessus | **NOT_RUN** pour l'acceptation réseau |
| Réponse edge `429` | Les contrôles automatiques de Preview peuvent rencontrer un challenge Vercel | Distinguer la protection WAF d'une erreur FastAPI ou Next.js ; ne pas désactiver les protections |
| Gate Node 24 | Même bloqueur que [quality-roadmap.md](quality-roadmap.md) : checkout/toolchain non disponibles dans cette séance | **L3 NOT_RUN** ; ne pas maintenir de seconde checklist de publication ici |

La présence d'un service dans le catalogue n'établit **ni** sa disponibilité **ni** son autorisation de lecture. Ne jamais transformer `403`, `401`, `429`, une réponse absente ou un diagnostic non exécuté en `UP`.

## P0 — Recette d'accès et de publication réelle

- [ ] **S-01/S-02 — HTTP et navigateur :** vérifier le SHA via l'endpoint de déploiement, puis les pages Home/TrueNAS/Architecture FR/EN ; photographier les états de chargement, erreur et dégradation, sans données privées.
- [ ] **S-03 — OWNER depuis le LAN autorisé :** confirmer `/api/homelab-access?diagnose=1`, l'UI privée, les sondes et les transitions réseau. L'accès `OWNER` ne doit pas être déduit d'une adresse IP simulée.
- [ ] **S-04 — SERVICE depuis un réseau réellement non autorisé :** confirmer les refus attendus et que les cartes, caches navigateur, traces et liens ne révèlent aucune information OWNER. `401/403` est une politique d'accès, pas une panne.
- [ ] **S-05 — Qualité :** produire l'attestation L3 complète définie **une seule fois** dans [la roadmap qualité](quality-roadmap.md#p0--gate-de-publication-exacte-bloquant-pour-toute-nouvelle-pr) sur un checkout Node 24 propre.

Critère de clôture P0 : traces datées du SHA exact, résultats OWNER/LAN et SERVICE/WAN réels, absence de fuite et L3 prouvée ; sinon noter `BLOCKED` ou `NOT_RUN` et laisser la recette ouverte.

## P1 — Catalogue, preuves et UX

- [ ] **S-06/S-07 — Traçabilité :** propager et afficher un `traceId` commun Next.js ↔ FastAPI selon le contrat producteur ; rendre les étapes DNS, TCP, TLS, HTTP, métriques et authentification lisibles dans la carte, sans inventer une preuve manquante.
- [ ] **S-08 — Intégrité du catalogue :** joindre Gatus, métriques, upstream/downstream, `entityRef`, révision et statut par identifiants stables. Rejeter les jointures ambiguës et garder les liens inter-services navigables.
- [ ] **S-09 — Cache et dégradation :** permettre l'affichage de la dernière preuve autorisée sans bloquer l'UI quand FastAPI est lent ou indisponible ; purger les détails OWNER sur le passage SERVICE ; différencier `UNKNOWN`, `STALE`, `DENIED` et `DOWN`.
- [ ] **S-10/S-11 — Accessibilité et performance :** tester clavier, lecteur d'écran, 320/390 px, contraste WCAG 2.2 AA, absence de layout shift et métriques LCP/INP/CLS sur vrais navigateurs. Utiliser les tokens du Site et respecter les animations réduites.
- [ ] **S-12/S-13 — Icônes et C4 :** valider `just icons-local-check` et la correspondance catalogue ; contrôler nœuds/relations/labels ReactFlow. Une relation C4 L3 absente du producteur reste `UNKNOWN`, jamais synthétisée comme observée.

## P2 — Dépendances et refactoring

- [ ] **S-14/S-15 — Refactoring :** dédupliquer les adaptateurs de snapshots/sondes, inventorier les consommateurs API v1, migrer vers le contrat v2 avec tests de non-régression et sans détruire le rendu public.
- [ ] **S-16 — Contrats et instrumentation :** conserver les tests local-first des erreurs 401/403/429, les transitions OWNER/SERVICE, les compteurs de services et les boucles de rendu React ; analyser chaque incident avant d'ajouter un nouveau polling.
- [ ] **Ressources opérateur :** prévoir la présentation CPU/RAM/GPU/ZFS par service **uniquement après disponibilité d'une preuve producteur expurgée**. L'absence de métrique n'est pas une panne.

## Transfert entre dépôts

**Site Alban :** filtres, cartes, ReactFlow/C4, affichage des preuves, i18n, a11y, privacy et cache d'interface. **FastAPI Sample :** collecteurs, enrichissement des sondes, schéma de preuves et diagnostic réseau. **nabla-compose :** déploiement des sondes LAN, TrueNAS/Talos/pfSense, catalogues infra, Traefik/APISIX et secrets. Les problèmes producteur doivent être suivis dans le dépôt producteur, pas dupliqués comme correctifs React.

Les anciennes livraisons, décisions de CI, captures de symptômes et points détaillés S-01 à S-19 sont conservés dans [l'archive datée](archive/homelab-roadmap-through-2026-10-30.txt). Ne pas considérer leur historique comme un contrôle exécuté sur la révision actuelle.
