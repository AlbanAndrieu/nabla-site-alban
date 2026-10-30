# Roadmap active — qualité et produit Site Alban

**Réconciliée le 30 octobre 2026.** Une ligne ouverte correspond à une action vérifiable, pas à un historique de PR. Les opérations TrueNAS, FastAPI et Compose appartiennent à leurs propres dépôts. Les travaux spécifiques à l'interface homelab Site sont dans [la roadmap homelab](homelab-roadmap.md).

[Historique intégral avant consolidation](archive/quality-roadmap-through-2026-10-30.txt) · [Runbooks](README.md) · [Règles de l'agent](../AGENTS.md).

## État attesté

| Surface | Preuve vérifiée | Verdict |
| --- | --- | --- |
| Git | `master` = `26bbb7b4257d2d94321eeea42192a6d0be58fe12` | PR [#265](https://github.com/AlbanAndrieu/nabla-site-alban/pull/265), [#266](https://github.com/AlbanAndrieu/nabla-site-alban/pull/266) et [#267](https://github.com/AlbanAndrieu/nabla-site-alban/pull/267) fusionnées |
| Vercel production | `dpl_4QTK6birkaJftqE2XPgXTiDfQs1p` sur ce SHA | **READY** : build terminé ; pas une preuve Playwright/Axe ni de la quality gate locale |
| Environnement agent de cette séance | Node `22.16.0` / npm `10.9.2`, pas de checkout ; `git ls-remote` échoue (DNS GitHub) | Profil L1 possible seulement avec les sources disponibles ; L3 **BLOCKED_NO_CHECKOUT / NOT_RUN** |
| GitHub Actions | Aucune exécution ou relance payante demandée | Ne pas confondre `skipped`, `READY` et `PASS` |
| Sécurité | Aucun assouplissement autorisé des hooks, scans, ACL ou secrets | Les flux sensibles restent « échec fermé » tant que les preuves manquent |

Les résultats historiques de tests ciblés et les anciennes preuves de Preview sont conservés dans l'archive, sans être présentés comme des résultats du HEAD actuel.

## P0 — Gate de publication exacte (bloquant pour toute nouvelle PR)

- [ ] Depuis un **checkout intégral et propre** de `master` ou de la future PR, avec Node `>=24.22.1 <25` et npm `>=12.2.0 <13`, exécuter `npm ci` sur le lockfile puis `npm run quality:agent:fix`. Condition : aucune modification résiduelle non revue.
- [ ] Exécuter `npm run test:unit`, `npm run lint`, `npm run lint:css`, `npm run typecheck`, `npm run build` puis `npm run quality:agent:publish` et `npm run quality:agent:publish -- --status`. Condition : `QG_PUBLISH_PROOF_OK` lié à **HEAD + base + toolchain**. Ne pas déclarer L3 sur le seul build Vercel.
- [ ] Exécuter les contrôles de sécurité applicables (pre-commit, secrets/SAST, Trivy et règles CI) sans supprimer les vérifications échouées ; effectuer une revue humaine des diffs et du résultat. Aucun `--no-verify`, force-push, `[skip ci]` ou rerun payant pour contourner la gate.

**Règle :** L0 = source inspectée ; L1 = test ciblé exécuté ; L2 = contrôles locaux pertinents ; **L3 = publication complète sur HEAD exact**. Les statuts `NOT_RUN`, `BLOCKED` et `FAIL` ne valent jamais `PASS`.

## Stripe Checkout — sécurisation en cours (21 octobre 2026)

**P0 — ne pas activer le traitement des webhooks de paiement en production tant que ces conditions ne sont pas remplies.** Le handler signé existant répond `503` aux événements financiers non gérés : c'est une protection contre la perte silencieuse des événements, pas un fulfillment fonctionnel.

- [ ] Ajouter une persistance durable et une machine d'état transactionnelle pour `event.id`, session, paiement et fulfillment ; tester les doublons et la concurrence.
- [ ] Traiter explicitement `checkout.session.completed` sous `payment_status=paid`, `checkout.session.async_payment_succeeded` et `checkout.session.async_payment_failed` ; répondre `2xx` seulement après enregistrement fiable.
- [ ] Tester en **Stripe sandbox** distinct : signatures absentes/incorrectes, secret indisponible, doublons, ordre inversé, retries, refus et retards ; publier des preuves expurgées, puis autoriser l'activation par revue humaine.
- [ ] Contrôler prix et droits côté serveur, origines/redirects HTTPS, clé Stripe restreinte par environnement, limitation distribuée des sessions et logs sans données personnelles.
- [ ] Reporter le nettoyage des routes historiques, CSP Stripe.js, fiscalité et mise à jour SDK tant que le parcours de paiement et la persistance ne sont pas validés.

Référence opérationnelle : [Durcissement Stripe](stripe-hardening-roadmap.md) et [runbook Checkout](checkout-support-runbook.md). Aucun secret Stripe en Git, dans les captures ou les journaux.

## P0 — Protection du dépôt et AppSec

- [ ] Confirmer sur GitHub le ruleset de `master`, les permissions réelles et les checks requis : qualité, CodeQL, secrets et diagnostics de remédiation ; vérifier les exceptions avant toute activation/règle bloquante.
- [ ] Vérifier Renovate en conditions réelles, conserver **Dependabot Alerts en signalement seul**, `automerge=false`, limite de 2 PR concurrentes et âge minimal de 7 jours ; valider un premier lot sur la gate locale.
- [ ] Faire converger CodeQL/SAST, secret scanning et rapports Trivy ; vérifier les statuts critiques et l'intégrité des rapports. Ne pas démarrer un DAST actif ou un scan ZAP coûteux sans cible et approbation.
- [ ] Consolider la preuve DSOMM/STRIDE (menaces Cloudflare/HAProxy/OWNER), les exceptions et les contrôles réels ; conserver la version métier du modèle de menace sous [security-threat-model.md](security-threat-model.md).

## P1 — Expérience React, accessibilité et SEO

- [ ] Recette navigateur FR/EN sur le **SHA déployé** : pages Home, Security/YubiKey, Architecture, TrueNAS, 404 ; clavier, contraste WCAG 2.2 AA, Axe, mode clair/sombre, zoom 200 % et 320/390 px. Distinguer explicitement le challenge Vercel `429` des erreurs applicatives `401/403/5xx`.
- [ ] Vérifier le graphe YubiKey chargé à la demande par [#267](https://github.com/AlbanAndrieu/nabla-site-alban/pull/267) : navigation clavier, alternative textuelle, glyphes Home/Top, animations réduites et absence de débordement. Les tests Playwright existent mais la recette authentifiée reste **NOT_RUN** ici.
- [ ] Auditer canonical, `hreflang`, sitemap et indexabilité en production `www`; préserver `en` sans préfixe et `fr` sous `/fr`. Vérifier CLS et dimensions des images actives.
- [ ] Réduire Bootstrap/CDN et les styles hérités **route par route** après tests de parité. Ne créer `Section` ou `PageHeader` qu'avec un consommateur réel ; conserver le rendu de `public/404.html` validé par contrat.

## P1 — Homelab côté Site uniquement

- [ ] Exécuter la recette **OWNER depuis LAN** et **SERVICE depuis WAN** sur les API et la page TrueNAS, en respectant les vrais périmètres d'accès ; ne jamais simuler une IP de confiance. Vérifier les transitions, les 401/403, l'invalidation du cache sensible, les statuts `UNKNOWN` et les données périmées.
- [ ] Corréler `traceId`, sondes DNS/TCP/HTTP, métriques, Gatus et relations ReactFlow aux éléments du catalogue sans inventer un statut sain. Vérifier les liens internes/externes et le rendu mobile.
- [ ] Centraliser les travaux détaillés dans [homelab-roadmap.md](homelab-roadmap.md) ; les réparations de collecteurs FastAPI, sondes LAN, TrueNAS, pfSense ou APISIX restent dans `fastapi-sample` ou `nabla-compose`.

## P2 — Performance, dépendances et efficacité agent

- [ ] Mesurer Lighthouse et Core Web Vitals sur des pages stables, comparer avant/après le lazy-loading ReactFlow #267 et les optimisations ESLint ; fixer des budgets vérifiables, sans annoncer de gain non mesuré.
- [ ] Valider les correctifs de dépendances (dont `eslint-config-next`), licences et arbres npm via `npm ci` et Trivy ; ne considérer Node 26 qu'après support Vercel/Kubernetes et décision explicite.
- [ ] Mesurer sur trois interventions comparables le gain du routeur `just agent-context`, du profil Node22 local et du prompt compact (caractères, temps, nombre d'appels). L'économie de tokens facturés est **inconnue** en l'absence de mesures.
- [ ] Évaluer Dagger, Hyperfine, captures Playwright ciblées et ZAP Preview seulement après mesure de leur coût et preuve de valeur ; ne pas multiplier les runners ou les quality gates.

## Livraisons clôturées — références

- [#265](https://github.com/AlbanAndrieu/nabla-site-alban/pull/265) : navigation et accessibilité YubiKey, libellés FR/EN, contrôles Playwright/Axe préparés.
- [#266](https://github.com/AlbanAndrieu/nabla-site-alban/pull/266) : instructions agents compactées, routage par tâche, tests locaux ciblés, alignement Node 24/WCAG 2.2.
- [#267](https://github.com/AlbanAndrieu/nabla-site-alban/pull/267) : lazy-loading du graphe, cache ESLint, correction d'icônes et exécution indépendante de la suite `.mjs`.

**Terminé** signifie que le changement est fusionné. **Validé** exige la preuve indiquée par la tâche. Les preuves historiques complètes demeurent dans [l'archive datée](archive/quality-roadmap-through-2026-10-30.txt), pas dans le backlog actif.
