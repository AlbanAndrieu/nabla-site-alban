# Rapprochement des cinq dernières PR fusionnées — 18 octobre 2026

Périmètre : `AlbanAndrieu/nabla-site-alban`, classé par **date réelle de fusion**.
État vérifié via GitHub le 18 octobre 2026. Ne pas confondre `merged`
et `CI green / fonctionnalité déployée`.

| PR | Date fusion UTC | Améliorations à préserver | État vis-à-vis du P0 | Suite / critère |
| --- | --- | --- | --- | --- |
| [#234](https://github.com/AlbanAndrieu/nabla-site-alban/pull/234) | 18/10 18:58 | Architecture privée Access/Tunnel, contrat public DTO, coordination FastAPI/Compose | Documentation intégrée, **runtime non corrigé par #234** | La présente PR ferme provisoirement les APIs riches; poursuivre FastAPI #353 et Compose #263 avant restaurer le dashboard |
| [#232](https://github.com/AlbanAndrieu/nabla-site-alban/pull/232) | 18/10 18:57 | Diagnostics agent bornés AWK, métriques log lignes/octets, factorisation de la quality gate et `next typegen` | Préservé; P0 ne doit pas retirer les contrôles SAST | Conserver baseline réelle des logs, tests de contraction et scope de build lorsqu'un composant UI change |
| [#230](https://github.com/AlbanAndrieu/nabla-site-alban/pull/230) | 18/10 18:56 | Extraction des composants architecture/homelab, garde-fous de qualité, contraste WCAG AA | Les composants privés sont temporairement **débranchés des pages publiques**, pas supprimés; réutilisation dans `ops` à planifier | Reprendre leurs types/test a11y/contraste dans l'application propriétaire, sans reconnection anonyme |
| [#231](https://github.com/AlbanAndrieu/nabla-site-alban/pull/231) | 18/10 18:54 | `meta text-scale` Chromium 156, contrôle texte 200 %, CSS root adapté | Invariant global conservé | Ajouter recette 200 % sur page publique minimaliste et écran `ops` authentifié |
| [#227](https://github.com/AlbanAndrieu/nabla-site-alban/pull/227) | 17/10 19:11 | Identification hooks/fichiers dans `QG_FIX_OSCILLATION` et evidence de fix | Gardes de qualité préservées | Rejouer auto-fix local-first; aucune désactivation pré-commit pour passer P0 |

## Manques et reliquats consolidés

- **P0 contenu déjà exposé** : les anciens JSON publics, pages HTML,
  traductions, topologies et headers REST ont existé en production. Déploiement
  après review, purge des caches/CDN et snapshots Vercel/Preview, analyse des
  URLs directes, et recherche de secrets *réellement présents* pour rotation
  ciblée. Les anciennes versions Git publiques ne sont pas effaçables par
  la seule mise à jour de `master`.
- **P0 surface hors `/truenas`** : revue continue des pages `/nabla`,
  `/architecture`, `/ai`, `/security`, outils de génération OG, HTML
  historiques, messages Next Intl et ressources téléchargées. Aucune
  restauration automatique de détails via fallback FastAPI.
- **P0 tests** : rejets 404 sur toutes les APIs Vercel sensibles, absence
  de champs privés et de liens vers endpoints internes dans les fichiers
  `public/` et le HTML rendu; CI Node, Biome, lint, TypeScript, SAST/ZAP
  à valider sur le dernier HEAD. Scripts CI existants restent activés.
- **P1 UX** : recréer sur `ops.albandrieu.com` les vues de service-first,
  architecture hiérarchique, métriques, sondes, evidence Freshness et
  déploiements avant de rétablir ces fonctionnalités en authentifié;
  ne pas présenter la vitrine simplifiée comme équivalente à ces vues.
- **P1 Access / IdP** : PRs FastAPI #353 et Compose #263 sont des contrats
  documentaires, vérifier leur état/merge actuel, implémenter contrôle identité
  vérifiable à l'origine, MFA et réseau sans bypass. Keycloak n'est pas
  un prérequis de la correction de publication.
- **P1 performance / a11y** : conserver budget de logs #232, traitement
  anti-oscillation #227, contraste AA #230, text-scale 200 % #231.
  Les captures Playwright précédentes ne prouvent pas le nouveau P0.
- **P2 qualité** : rapprocher les comparaisons réellement mesurées de
  logs AWK et des scénarios Dagger/local-first; ne pas déduire d'économies
  de tokens sans mesure.
