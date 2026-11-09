# Roadmap active — qualité et produit Site Alban

**Réconciliée le 9 novembre 2026 (optimisation Vercel et état des PR).** Une ligne ouverte correspond à une action vérifiable, pas à un historique de PR. Ordre de traitement : **P0 Gate de publication → P0 AppSec → P1 React, a11y, SEO → P2**. Les opérations TrueNAS, FastAPI et Compose appartiennent à leurs propres dépôts ; les recettes et interfaces homelab du Site (OWNER/SERVICE, `traceId`, catalogue, cache) sont suivies une seule fois dans [la roadmap homelab](homelab-roadmap.md).

[Historique intégral avant consolidation](archive/quality-roadmap-through-2026-10-30.txt) · [Runbooks](README.md) · [Règles de l'agent](../AGENTS.md).

## P0 — Rétablissement Vercel Hobby et preuve de publication (8 novembre 2026)

- [x] **Réactivation Vercel et publication du 9 novembre :** le nouveau déploiement de production [dpl_6xhab6sDbue5nUQ7VFmgaEAQ7KWh](https://vercel.com/albanandrieus-projects/nabla-site-alban/6xhab6sDbue5nUQ7VFmgaEAQ7KWh) est **READY**, SHA exact `90370ac1076490a1fde9ce2837f79ee0209ee255`, alias `www.albanandrieu.com` confirmé. Le compte Hobby était précédemment suspendu (environ **7 h 07 / 4 h Fluid Active CPU**). Les deux tentatives classiques furent annulées par l'Ignore Build Step (SHA précédent identique), avant publication via une branche de release sur le même commit. **La consommation CPU après reprise n'a pas encore été mesurée.**
- [x] **Réduire le risque de CPU côté site :** [#285](https://github.com/AlbanAndrieu/nabla-site-alban/pull/285) (polling/cache) et [#288](https://github.com/AlbanAndrieu/nabla-site-alban/pull/288) (coque publique prérendue) **fusionnées** ; les routes OWNER et API privées restent dynamiques, `private, no-store`.
- [x] **Distinguer indisponibilité plateforme et vulnérabilité :** [#291](https://github.com/AlbanAndrieu/nabla-site-alban/pull/291) **fusionnée le 9 novembre** ; HTTP 402 identifié comme blocage plateforme, gate DAST maintenue en échec. [DAST #42471957262](https://github.com/AlbanAndrieu/nabla-site-alban/actions/runs/42471957262) reste **ZAP NOT_RUN**, non assimilable à PASS.
- [ ] **Inventaire SSR/SSG/ISR hors ligne :** sur un build propre, exécuter `node scripts/audit-vercel-runtime.mjs --json`, puis `--strict` après revue des alias. Le contrôle lit `.next/prerender-manifest.json` et, si présents, les artefacts `.vercel/output/functions`. Il distingue `PASS`, `WARN`, `FAIL`, `NOT_RUN`, surveille 10 couples de pages FR/EN, signale ISR et fonctions publiques et échoue si une API privée est prérendue. Tests de contrat : `node --test unit-tests/vercelRuntimeAudit.test.mjs`. **Build du HEAD et mesure CPU NOT_RUN** ; l'absence d'artefacts Vercel n'établit pas l'absence de fonctions en production.
- [ ] **L3 exact-SHA local :** relancer sur la tête de PR les tests Next 24, FR/EN, accessibilité, SEO, confidentialité OWNER/SERVICE et la gate AppSec ; CI `skipped` sur Draft ne signifie pas `PASS`.
- [ ] **Post-réactivation :** SHA Git/déploiement et alias de production **confirmés** le 9 novembre. Le build du site annonce 85 pages générées statiquement ; la page Twitter et Open Graph de la branche Draft [#293](https://github.com/AlbanAndrieu/nabla-site-alban/pull/293) sont en cours d'optimisation (Preview : `/fr/twitter-image` et `/en/twitter-image` SSG). Les routes homelab, paiement et flux REST privés restent dynamiques. Vérifier DAST, Playwright et OWNER/SERVICE sur vrais LAN/WAN après validation de la quality gate.
- [ ] **Surveillance du budget Fluid Active CPU (équipe Hobby entière) :** dans Vercel > Usage, relever **Fluid Active CPU** (consommation et limite), **Fluid Provisioned Memory**, **Function Invocations**, **Edge Requests**, **Data Transfer** et les performances P75 LCP/INP/CLS. Ventiler par projet, région et fonction, et comparer des fenêtres identiques après au moins une période de trafic. Seuils opérateur proposés : 50 % avertissement, 75 % investigation/préparation de réduction du polling, 90 % arrêt des tâches facultatives et revue de quota. Ces seuils ne sont **pas** configurés comme alertes Vercel et ne préjugent pas d'une capacité à bloquer automatiquement. L'API Observability (`not_found`) et Billing Charges (`costs_not_found`) du compte Hobby n'ont pas permis de lire les compteurs : **CPU réel NOT_MEASURED**.
- [ ] **Aucun gain de CPU prouvé pour l'instant :** la réduction du SSR est confirmée par la table de routage du build, pas par une mesure de temps CPU. Conserver les protections de cache privé `no-store` et ne jamais mettre des routes OWNER dans un cache partagé.

**Dépendances distinctes (vérifiées le 9 novembre) :** [Checklist #2](https://github.com/AlbanAndrieu/personal-security-checklist/pull/2) reste **Draft**, avec validation du build Qwik statique et du déploiement à effectuer. Les [Bababou #260](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/260), [#261](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/261) et [#262](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/262) sont **fusionnées le 9 novembre** ; la validation fonctionnelle et la sécurité d'accès aux preuves restent du ressort de Bababou. Ne pas reproduire ces tâches ici.

## État attesté — historique au 1er novembre

| Surface | Preuve vérifiée | Verdict |
| --- | --- | --- |
| Git | `master` = `bc02de8fede61e1d695eb6c599fc7daf6a8e51cd` (#277) au 1er novembre 2026 ; #272, #275, #276 et #277 fusionnées depuis `8083247` | Chaque PR a sa propre preuve L3 sur son HEAD |
| Vercel production | `bc02de8` : statut Vercel `success`, « Production Post-deploy Smoke » et « Verify deployed production contract » `success` ; « OWASP ZAP baseline on production » `failure` : scanner non démarré, corrigé dans #278 (voir P0) | Pas une preuve Playwright/Axe : Playwright et ZAP Preview `skipped` |
| Poste local (30 octobre 2026) | Worktree propre de `b9f3cfb`, Node `24.22.1` / npm `12.2.0`, `npm ci` (653 paquets, arbre inchangé) | **L3 PASS** : séquence P0 complète, `QG_PUBLISH_PROOF_OK` avec HEAD = base = `b9f3cfb`, toolchain `1b5b2e1e…` |
| GitHub Actions | « CI (Quality and Security) » `41128003522` sur `b9f3cfb` : `success` (gate fichiers modifiés, actionlint/zizmor, Semgrep, SCA npm prod bloquante, build) ; aucune relance manuelle | Ne pas confondre `skipped`, `READY` et `PASS` |
| Scanners (31 octobre 2026) | Trivy `0.76.1`, Semgrep `1.183.0` (`p/ci` + `p/owasp-top-ten`, 376 fichiers), Bandit `1.9.4`, osv-scanner `2.7.0`, `npm audit` sur `b9f3cfb` puis sur la branche de correctifs | Production : 0 vulnérabilité ; développement : seul `minimatch` reste (risque accepté, voir P2) |
| Sécurité | Aucun assouplissement autorisé des hooks, scans, ACL ou secrets | Les flux sensibles restent « échec fermé » tant que les preuves manquent |

Les résultats historiques de tests ciblés et les anciennes preuves de Preview sont conservés dans l'archive, sans être présentés comme des résultats du HEAD actuel.

## P0 — Gate de publication exacte (bloquant pour toute nouvelle PR)

- [x] Depuis un **checkout intégral et propre** de `master` ou de la future PR, avec Node `>=24.22.1 <25` et npm `>=12.2.0 <13`, exécuter `npm ci` sur le lockfile puis `npm run quality:agent:fix`. Condition : aucune modification résiduelle non revue. **Validé le 30 octobre 2026 sur `b9f3cfb`** : `npm ci` puis correction automatique sans aucune modification.
- [x] Exécuter `npm run test:unit`, `npm run lint`, `npm run lint:css`, `npm run typecheck`, `npm run build` puis `npm run quality:agent:publish` et `npm run quality:agent:publish -- --status`. Condition : `QG_PUBLISH_PROOF_OK` lié à **HEAD + base + toolchain**. Ne pas déclarer L3 sur le seul build Vercel. **Validé le 30 octobre 2026 sur `b9f3cfb`** : chaque commande sort en `0`, preuve stricte écrite puis `QG_PUBLISH_PROOF_OK`. Chaque nouvelle PR doit reproduire cette preuve sur son propre HEAD.
- [ ] Exécuter les contrôles de sécurité applicables (pre-commit, secrets/SAST, Trivy et règles CI) sans supprimer les vérifications échouées ; effectuer une revue humaine des diffs et du résultat. Aucun `--no-verify`, force-push, `[skip ci]` ou rerun payant pour contourner la gate. **Fait** : `betterleaks`, `bandit`, `actionlint`, `zizmor` passent ; Trivy `0.76.1` passe la gate du dépôt (0 CRITICAL/HIGH, 14 licences à revoir, `DS-0026` LOW : pas de `HEALTHCHECK` Docker, couvert par les sondes Kubernetes) ; Semgrep `1.183.0` sur tout l'arbre : 2 avertissements `dangerouslySetInnerHTML` traités (JSON-LD de `/ai` via `JsonLd`, fragment CV allowlisté annoté `nosemgrep`) ; `detect-private-key` et `end-of-file-fixer` passent sur tout l'arbre (regex PEM de `scripts/homelab-audit-policy.mjs` réécrite sans en-tête littéral et étendue aux clés RSA/OPENSSH, test ajouté ; 26 fichiers suivis normalisés). **Reste** : revue humaine.
- [ ] Confirmer sur le prochain run planifié (dimanche) que « OWASP ZAP baseline on production » produit un rapport. Cause des échecs du 25 octobre et du 1er novembre 2026 : depuis #236, ZAP tourne en `docker run --user` avec l'UID du runner, absent de `/etc/passwd` de l'image ; Java ignore `HOME`, ne peut pas créer `/zap/?/.ZAP/` et `zap-baseline.py` sort en `rc=3` avant tout scan. Reproduit localement (UID 1001, ZAP 2.17.0) ; corrigé par `-z "-dir /tmp/.ZAP"` dans `master-dast.yml` et `zap-preview.yml` (#278), qui donne localement un rapport JSON. Aucune alerte applicative n'est en cause.
- [ ] Réinstaller la gate pre-push stricte sur les postes (`pre-commit install --config .pre-commit-pre-push.yaml --hook-type pre-push`). `default_install_hook_types` contient `pre-push` : un `pre-commit install` nu la remplace par `.pre-commit-config.yaml`, constaté le 30 octobre 2026.

**Règle :** L0 = source inspectée ; L1 = test ciblé exécuté ; L2 = contrôles locaux pertinents ; **L3 = publication complète sur HEAD exact**. Les statuts `NOT_RUN`, `BLOCKED` et `FAIL` ne valent jamais `PASS`.

## P0 — AppSec et protection du dépôt

- [ ] Confirmer sur GitHub le ruleset de `master`, les permissions réelles et les checks requis : qualité, CodeQL, secrets et diagnostics de remédiation ; vérifier les exceptions avant toute activation/règle bloquante.
- [ ] Vérifier Renovate en conditions réelles, conserver **Dependabot Alerts en signalement seul**, `automerge=false`, limite de 2 PR concurrentes et âge minimal de 7 jours ; valider un premier lot sur la gate locale. Triage du 31 octobre 2026 : 68 alertes ouvertes, toutes en développement — 62 pip dans `Pipfile.lock` (Pillow 59 dont 5 critiques, `sh` 1, `filelock` 2) et 6 npm (`fast-uri` 4, `follow-redirects` 1, `minimatch` 1). La branche de correctifs régénère `Pipfile.lock` (Pillow `13.0.0`, `sh` `2.4.0` via `gitlint-core`, `filelock` `4.2.5` ; osv-scanner : 0) ; après fusion, vérifier que GitHub ferme les 67 alertes corrigées et que la mise à jour pip Dependabot ne reste pas en échec.
- [ ] Faire converger CodeQL/SAST, secret scanning et rapports Trivy ; vérifier les statuts critiques et l'intégrité des rapports. Ne pas démarrer un DAST actif ou un scan ZAP coûteux sans cible et approbation.
- [ ] Consolider la preuve DSOMM/STRIDE (menaces Cloudflare/HAProxy/OWNER), les exceptions et les contrôles réels ; conserver la version métier du modèle de menace sous [security-threat-model.md](security-threat-model.md).

### Stripe Checkout — sécurisation en cours (21 octobre 2026)

**Ne pas activer le traitement des webhooks de paiement en production tant que ces conditions ne sont pas remplies.** Le handler signé existant répond `503` aux événements financiers non gérés : c'est une protection contre la perte silencieuse des événements, pas un fulfillment fonctionnel.

- [ ] Ajouter une persistance durable et une machine d'état transactionnelle pour `event.id`, session, paiement et fulfillment ; tester les doublons et la concurrence.
- [ ] Traiter explicitement `checkout.session.completed` sous `payment_status=paid`, `checkout.session.async_payment_succeeded` et `checkout.session.async_payment_failed` ; répondre `2xx` seulement après enregistrement fiable.
- [ ] Tester en **Stripe sandbox** distinct : signatures absentes/incorrectes, secret indisponible, doublons, ordre inversé, retries, refus et retards ; publier des preuves expurgées, puis autoriser l'activation par revue humaine.
- [ ] Contrôler prix et droits côté serveur, origines/redirects HTTPS, clé Stripe restreinte par environnement, limitation distribuée des sessions et logs sans données personnelles.
- [ ] Reporter le nettoyage des routes historiques, CSP Stripe.js, fiscalité et mise à jour SDK tant que le parcours de paiement et la persistance ne sont pas validés.

Référence opérationnelle : [Durcissement Stripe](stripe-hardening-roadmap.md) et [runbook Checkout](checkout-support-runbook.md). Aucun secret Stripe en Git, dans les captures ou les journaux.

## P1 — Expérience React, accessibilité et SEO

- [ ] Recette navigateur FR/EN sur le **SHA déployé** : pages Home, Security/YubiKey, Architecture, TrueNAS, 404 ; clavier, contraste WCAG 2.2 AA, Axe, mode clair/sombre, zoom 200 % et 320/390 px. Distinguer explicitement le challenge Vercel `429` des erreurs applicatives `401/403/5xx`.
- [ ] Vérifier le graphe YubiKey chargé à la demande par [#267](https://github.com/AlbanAndrieu/nabla-site-alban/pull/267) : navigation clavier, alternative textuelle, glyphes Home/Top, animations réduites et absence de débordement. Les tests Playwright existent mais la recette authentifiée reste **NOT_RUN** ici.
- [ ] Auditer canonical, `hreflang`, sitemap et indexabilité en production `www`; préserver `en` sans préfixe et `fr` sous `/fr`. Vérifier CLS et dimensions des images actives.
- [ ] Réduire Bootstrap/CDN et les styles hérités **route par route** après tests de parité. Ne créer `Section` ou `PageHeader` qu'avec un consommateur réel ; conserver le rendu de `public/404.html` validé par contrat.

## P2 — Performance, dépendances et efficacité agent

- [ ] Mesurer Lighthouse et Core Web Vitals sur des pages stables, comparer avant/après le lazy-loading ReactFlow #267 et les optimisations ESLint ; fixer des budgets vérifiables, sans annoncer de gain non mesuré.
- [ ] Valider les correctifs de dépendances (dont `eslint-config-next`), licences et arbres npm via `npm ci` et Trivy ; ne considérer Node 26 qu'après support Vercel/Kubernetes et décision explicite. Le 31 octobre 2026, `npm audit` passe de 18 à 14 vulnérabilités de développement (0 haute) : `fast-uri` `3.1.9`, `follow-redirects` `1.16.2`, `zod` `4.6.x` (override pour `opencommit`, qui embarque son propre zod). Les 14 restantes viennent d'un seul avis `minimatch` (GHSA-g3hv-75wg-m249, corrigé seulement en `11.0.1`, refusé par ESLint 9/10 et ses plugins) : risque accepté en développement, à rouvrir quand ESLint accepte `minimatch` 11.
- [ ] Mesurer sur trois interventions comparables le gain du routeur `just agent-context`, du profil Node22 local et du prompt compact (caractères, temps, nombre d'appels). L'économie de tokens facturés est **inconnue** en l'absence de mesures.
- [ ] Évaluer Dagger, Hyperfine, captures Playwright ciblées et ZAP Preview seulement après mesure de leur coût et preuve de valeur ; ne pas multiplier les runners ou les quality gates.
- [ ] Résorber les avertissements de `scripts/check_code_size.py` (> 300 lignes) par extractions cohérentes, sans changer les contrats publics. **Fait le 1er novembre 2026** : classification de cycle de vie extraite de `lib/serviceCriticality.ts` vers `lib/serviceLifecycle.ts` (436 → 323 lignes) ; copie du guide YubiKey découpée par langue (`content.ts` 562 → types et assemblage, `content.fr.ts`, `content.en.ts`). **Reste** : `lib/htmlFromPublic.ts`, `lib/homelabPublicBrowserCache.ts`, `yubikey/useCases.ts` et les tests > 300 lignes. `scripts/post-deploy-smoke.mjs` reste un fichier unique : la CI exécute sa version de production copiée seule dans `RUNNER_TEMP`.

## Livraisons clôturées — références

- [#265](https://github.com/AlbanAndrieu/nabla-site-alban/pull/265) : navigation et accessibilité YubiKey, libellés FR/EN, contrôles Playwright/Axe préparés.
- [#266](https://github.com/AlbanAndrieu/nabla-site-alban/pull/266) : instructions agents compactées, routage par tâche, tests locaux ciblés, alignement Node 24/WCAG 2.2.
- [#267](https://github.com/AlbanAndrieu/nabla-site-alban/pull/267) : lazy-loading du graphe, cache ESLint, correction d'icônes et exécution indépendante de la suite `.mjs`.
- [#269](https://github.com/AlbanAndrieu/nabla-site-alban/pull/269) : consolidation de cette roadmap et archivage daté des preuves.
- [#270](https://github.com/AlbanAndrieu/nabla-site-alban/pull/270) : contrats SEO/WCAG FR/EN, runner Lighthouse local, posture de dépendances, scripts exécutables et lien du skill `vercel-react-best-practices`.
- [#271](https://github.com/AlbanAndrieu/nabla-site-alban/pull/271) : mise à jour Dependabot de `filelock` dans `Pipfile.lock`.
- [#272](https://github.com/AlbanAndrieu/nabla-site-alban/pull/272) : runtime Node des hooks pre-commit figé sur `.nvmrc` (évite `v27.0.0-alpha` via nodeenv).
- [#275](https://github.com/AlbanAndrieu/nabla-site-alban/pull/275) : Trivy `0.76.1`, Semgrep épinglé par digest, correctifs npm/pip de développement, faux positif `detect-private-key` levé.
- [#276](https://github.com/AlbanAndrieu/nabla-site-alban/pull/276) : garde-fou NDA employeur (termes hachés, listes privées fusionnées, gate de validation employeur, hook et tests).
- [#277](https://github.com/AlbanAndrieu/nabla-site-alban/pull/277) : mémo YubiKey visuel, slots OTP, PIN/PUK et reprise FR/EN.

**Terminé** signifie que le changement est fusionné. **Validé** exige la preuve indiquée par la tâche. Les preuves historiques complètes demeurent dans [l'archive datée](archive/quality-roadmap-through-2026-10-30.txt), pas dans le backlog actif.
