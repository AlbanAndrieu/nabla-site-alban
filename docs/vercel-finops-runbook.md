# Suivi FinOps Vercel Hobby — CPU réellement facturé

**Mis à jour : 9 novembre 2026.** Les quatre projets `nabla-site-alban`, `nabla-site-bababou`, `checklist` et `nabla-site-apache` partagent **une seule équipe Hobby** `albanandrieus-projects`. Une estimation par site seule ne permet pas de prévenir la suspension de l'équipe.

## Source officielle prioritaire

Les API connectées dans ChatGPT ont répondu `404 costs_not_found` (`/v1/billing/charges`) et `404 not_found` (`/v2/observability/schema`) sur ce compte Hobby. Ce n'est pas la preuve d'une consommation nulle.

Vercel documente aussi la **CLI `vercel usage --format json`**, qui retourne `services`, `totals` et `period` lorsque le compte est autorisé. Les quantités et unités peuvent varier selon la version du CLI et le service : **ne jamais convertir des coûts en heures CPU**.

Documentation : https://vercel.com/docs/cli/usage et https://vercel.com/docs/pricing/manage-and-optimize-usage.

Depuis la workstation (session authentifiée via `vercel login`, **sans afficher de token**) :

```bash
vercel whoami
vercel usage --scope albanandrieus-projects --format json |
  node scripts/finops/vercel-usage-budget.mjs --stdin
```

La commande affiche **un seul JSON compact** sans recopier les charges détaillées. Avec un export volontairement sauvegardé **hors du dépôt** :

```bash
umask 077
vercel usage --scope albanandrieus-projects --format json > /tmp/vercel-usage.json
node scripts/finops/vercel-usage-budget.mjs --input /tmp/vercel-usage.json --strict
vercel usage --scope albanandrieus-projects --breakdown daily --format json
```

Le mode `--strict` retourne un code non nul à partir du seuil `WATCH`. Aucune collecte automatique, CI, requête HTTP vers Vercel ni tâche planifiée n'est ajoutée par cette PR. Ne pas publier d'exports contenant des références de facturation.

## Interprétation (période comparable)

| Statut | Quotité CPU équipe | Action opérationnelle proposée |
| --- | --- | --- |
| `OK` | inférieur à 50 % | Poursuivre les optimisations |
| `WATCH` | 50–74,99 % | Contrôler les routes les plus sollicitées |
| `INVESTIGATE` | 75–89,99 % | Réduire le polling non essentiel et les proxys inutiles |
| `CRITICAL` | 90 % ou plus | Suspendre les traitements facultatifs, revoir les quotas |
| `WINDOW_UNVERIFIED` | heures CPU lisibles, mais fenêtre de 30 jours non attestée | Ne pas conclure sur le quota ; vérifier `period` |
| `NOT_MEASURED` | quantité absente, unité ambiguë ou API inaccessible | **Ne rien conclure sur le CPU** ; utiliser le tableau de bord |

La limite Hobby annoncée est **4 heures de Fluid Active CPU**, **360 GB-h de mémoire provisionnée** et **1 million d'invocations** par fenêtre applicable. Le présent script compare **uniquement** la consommation CPU quand une quantité et une unité explicites **et une fenêtre de ~30 jours attestée par `period`** sont présentes dans l'export. Un export journalier ou une absence de période donne `WINDOW_UNVERIFIED`. Il ne mesure ni la mémoire, ni les invocations, ni la latence, ni les performances Web Vitals.

Attention : les exports de coûts peuvent ne contenir que des montants monétaires : dans ce cas le script signale `NOT_MEASURED`. La CLI peut elle-même retourner une erreur sur Hobby (le point d'accès Billing renvoyait `costs_not_found`) ; préférer alors la lecture du tableau de bord Usage plutôt que de contourner les restrictions. La forme réelle du JSON doit être validée sur un export authentifié, car la documentation de la CLI ne garantit pas les noms de chaque sous-champ de service.

## Relevés à conserver (privés)

Dans **Vercel > Team > Usage > Fluid Active CPU**, vérifier les indicateurs d'allocation et les vues par projet/région. Inclure aussi `Fluid Provisioned Memory`, `Function Invocations`, `Edge Requests`, `Fast Origin Transfer`, et, si disponible, la liste des **Top Paths**. Les métriques de fonction `Function CPU Time`, `Function Wall Time`, `Cache Result` et `route` sont distinctes ; `Wall Time` ne mesure **pas** le CPU facturé. Pour une baseline comparable, archiver hors Git une série quotidienne et le SHA de production.

Source officielle : https://vercel.com/docs/query/reference et https://vercel.com/docs/functions/usage-and-pricing.

## Optimisations de la roadmap

- **Alban** : routes FR/EN publiques en SSG, images sociales statiques intégrées par #293 ; cartographier les fonctions encore dynamiques (OWNER/SERVICE, API Stripe, RSS), vérifier `no-store` et l'absence de polling pour les visiteurs non autorisés.
- **Bababou** : NRE et pages légales SSG ; la PR #264 vise les quatre pages de confirmation Stripe en SSG ; vérifier que le Proxy ne traite pas les fichiers statiques et les ressources Next ; garder le contrôle d'accès aux documents hors CDN.
- **Checklist** : confirmer que le déploiement Qwik n'installe aucune fonction Next/Node inutile.
- **Qualité** : comparer CPU par route/temps pour les mêmes SHA et fenêtres ; ne revendiquer aucun gain sans deux mesures.

## Smoke HTTP public après déploiement

Un diagnostic **volontairement limité** contrôle seulement les statuts
et les en-têtes de cache des pages publiques, sans lire leur contenu :
`scripts/finops/vercel-public-smoke.mjs`. Les deux sites sont testables
depuis la workstation avec la même liste de routes autorisées.

```bash
node --test unit-tests/vercelUsageBudget.test.mjs unit-tests/vercelPublicSmoke.test.mjs

# Environ 5 ou 6 requêtes HEAD par site, jamais en tâche automatique :
node scripts/finops/vercel-public-smoke.mjs --live --site alban
node scripts/finops/vercel-public-smoke.mjs --live --site bababou
```

- Le diagnostic n'émet **aucune requête sans `--live`**.
- Les destinations sont figées à `www.albanandrieu.com` et
  `www.bababou.com` ; aucune route `/api/*`, de document privé ou
  de paiement n'est appelée.
- `HTTP 402` donne `BLOCKED_PLATFORM`, les redirections et
  erreurs ne valent pas `PASS`. Le champ `x-vercel-cache` n'est
  qu'une information de cache, **pas** une mesure du Fluid Active CPU.
- Aucun échantillonnage continu, drain, cookie, jeton ou déploiement
  n'est ajouté par ce script. L'évaluation du CPU reste basée sur
  les heures officielles vérifiées dans Vercel Usage.
- Ce smoke est aussi porté dans Bababou, et la CLI FinOps est
  disponible dans `nabla-openclaw`, sans exécution automatique.

## Validation locale

```bash
node --test unit-tests/vercelUsageBudget.test.mjs
node scripts/finops/vercel-usage-budget.mjs --stdin <<<'{}' # attend NOT_MEASURED / code 2
```

L'exécution en lecture seule n'expose pas les secrets de l'environnement ; les données réelles de facturation restent **NOT_MEASURED** tant que l'export réel n'est pas fourni.
