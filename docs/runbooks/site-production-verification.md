# Runbook — vérifier un merge Site Alban en production

**Propriétaire :** `nabla-site-alban`. **Mode :** lecture seule.
**Roadmap des actions ouvertes :** [homelab-roadmap.md](../homelab-roadmap.md).
**Contrats et droits :** [diagnostics et accès](../homelab-diagnostics-and-access.md).
Ce runbook décrit une procédure, pas une preuve d'exécution.

## Cinq niveaux de preuve

| Niveau | Source de la preuve | Ce qui est établi |
| --- | --- | --- |
| L0 Git | PR fusionnée et HEAD `master` | Le code est versionné |
| L1 Build | Vercel deployment ciblé, logs `Build Completed`, SHA | Le bundle a été construit et publié |
| L2 HTTP | `scripts/post-deploy-smoke.mjs`, requêtes réelles | Les pages et endpoints répondent sur ce domaine |
| L3 Navigateur | Parcours FR/EN, clics C4, TrueNAS, mobile, clavier | Le comportement côté client est vérifié |
| L4 OWNER | Client LAN/Access réellement autorisé, FastAPI et sondes | L'accès privé et les preuves de santé sont vérifiés |

Ne pas assimiler une absence de logs à un test réussi. Une 302 Cloudflare
Access indique un contrôle edge ; elle ne prouve ni la santé de l'origine
ni un refus fonctionnel de FastAPI.

## Vérification post-merge (une action par étape)

1. Ouvrir la PR fusionnée et relever son `merge_commit_sha`.
2. Comparer ce SHA avec `origin/master` au moment de la vérification.
3. Inspecter dans Vercel le déploiement `target=production` aliasé au
   domaine `www.albanandrieu.com`.
4. Vérifier le champ Git SHA et le statut `READY` du même déploiement.
5. Lire les événements de build ; distinguer `Compiled`, `TypeScript`,
   `Build Completed` et warnings non bloquants.
6. Depuis **une machine disposant du DNS et de HTTPS publics**, exécuter
   `DEPLOYED_SHA=<SHA_GIT_COMPLET> node scripts/post-deploy-smoke.mjs`.
   Ne pas utiliser `curl -k`, de cookie OWNER ou de jeton exposé.
7. Conserver uniquement le verdict, la date, les routes et le SHA ;
   ne jamais stocker des en-têtes Authorization ou des URL signées.
8. Ouvrir `/truenas`, `/fr/truenas`, `/architecture` et
   `/fr/architecture` dans le navigateur public.
9. Vérifier les icônes, C4 L1/L2, le drill-down, les onglets, les erreurs
   console, les labels FR/EN et la navigation clavier.
10. Vérifier hors LAN que les routes OWNER restent interdites et que le
    mode SERVICE (si actif) ne révèle ni adresses privées ni preuves OWNER.
11. Sur un client réellement autorisé au domicile, comparer les droits
    `/api/homelab-access?diagnose=1` aux données FastAPI et aux sondes ;
    enregistrer l'observateur et l'horodatage.
12. Consulter les logs runtime récents uniquement sur une fenêtre supportée
    par le plan Vercel ; distinguer une requête sans événement d'une erreur
    explicite renvoyée par l'API des logs.

## Interpréter les blocages

- **DNS indisponible dans l'environnement agent :** noter `BLOCKED_DNS`.
  Rejouer depuis la workstation ; ne pas marquer HTTP 000 comme panne du site.
- **Consultation Web de page dynamique indisponible :** noter `NOT_VERIFIED`.
  Les métadonnées de déploiement ne remplacent pas le navigateur.
- **401/403 Cloudflare :** relever l'acteur, le type de politique et l'origine
  d'observation, sans exposer le JWT. Ce refus peut être le comportement attendu.
- **503 catalogue :** inspecter `stage` et la référence d'incident seulement
  si autorisé OWNER ; `catalog_validation` n'implique pas un TrueNAS DOWN.
- **JSON SERVICE public :** vérifier la liste d'autorisation et les caches
  plutôt que d'ouvrir temporairement les routes privées pour un smoke.
- **Vercel READY mais page vide :** inspecter la console navigateur et les
  requêtes client ; ne pas redéployer avant d'avoir localisé la couche.

## Dernière vérification partielle connue — 25/10/2026

- `master=99cf7e4016533532bee53a72964ffea1b4a54bc6` : PR Site #256 fusionnée.
- Vercel `dpl_ETdhg9XfxZijJ3ExA29a2q291SmV` : `READY`,
  `production`, Git SHA identique, build terminé.
- Vercel erreurs groupées 24 h : aucune détectée.
- Logs runtime `error/fatal` sur 30 min : aucun événement détecté ;
  logs 24 h détaillés indisponibles sur la rétention du plan.
- Accès externe HTTP aux routes TrueNAS/Architecture : non vérifié par
  les outils de l'agent ; terminal `curl` bloqué en DNS.
- Parcours OWNER/LAN, Playwright et qualité locale complète : `NOT_RUN`.

Ces résultats sont un **instantané**, non un état permanent du site.

## Déploiement ignoré après merge

Si Vercel indique `Ignored Build Step command returned exit code 0`, consulter
`scripts/vercel-ignore-build.sh`. Dans le cas d'un commit de merge avec
`VERCEL_GIT_PREVIOUS_SHA` absent, il doit désormais construire par défaut :
le premier parent peut ne contenir que des modifications de documentation
alors que les changements applicatifs sont présents dans les ancêtres.
Exécuter le test local `node --test unit-tests/vercelIgnoreBuild.test.mjs`
avant toute modification de cette logique. Ne pas forcer un déploiement
de production pour tester ce cas : utiliser la Preview de la PR.

## Préparer le typecheck avant le build (octobre 2026)

Next.js génère `PageProps`, `AppRoutes` et les types des routes
dans `.next/types`. Une nouvelle page peut être absente des fichiers
produits par un build précédent. Ne pas modifier son type
`PageProps<"/[locale]/security/lexique">` pour contourner ce cache.

1. Exécuter `npm ci --no-audit --no-fund` sur le checkout choisi.
2. Exécuter `npm run typecheck`.
3. Exécuter `npm run build`.
4. Vérifier le SHA Git réellement construit.
5. Consulter l'état de la Preview Vercel pour le même SHA.

`npm run typecheck` lance désormais
`bash scripts/run-next-clean.sh typegen && tsc --noEmit`. Le wrapper
protège `next-env.d.ts` suivi par Git pendant la génération.
La quality gate appelle `npm run typecheck`, sans régénération en
double.

**Diagnostic opérateur du 26/10/2026 :** quatre TS2344/TS2339 sur la
route lexique avec `tsc --noEmit` lancé avant le build. Un
`next build` exécuté ensuite a **réussi** avec Next **16.3.4** :
83/83 pages, lexique EN/FR, TypeScript fini sans erreurs.
Mais `package.json` et le lockfile verrouillent **Next 16.4.2**.
Ce succès constitue une preuve de compilation avec une dépendance
locale divergente, **pas** un PASS de publication 16.4.2.
En cas de divergence locale, réinstaller les dépendances depuis
`package-lock.json` avec `npm ci`; ne pas changer la version du dépôt
pour rejoindre un `node_modules` ancien.

## Preuve locale après correction typegen — 26/10/2026

**Source :** sortie de la workstation opérateur après mise à jour du
checkout `fix/homelab-owner-audit-trace-receipt-20261025`,
HEAD `89649e5af573642f9d11155e36094e25191f1697`.

| Contrôle | Résultat |
| --- | --- |
| Runtime | Node 24.22.1 / npm 12.2.0 |
| `npm ci --no-audit --no-fund` | PASS, 653 paquets installés |
| `npm run test:fast:local` | **62/62 PASS**, 0 échec, 0 skipped |
| `npm run typecheck` | **PASS** : `next typegen` puis `tsc --noEmit` |
| `npm run build` | **PASS** : Next.js **16.4.2**, Turbopack, TypeScript |
| Pages statiques | **83/83 générées** |
| `npm run quality:agent:publish` | **NOT_RUN** |
| Preview Vercel / routes HTTP / OWNER-LAN | **NOT_RUN** |

**Conclusion :** la divergence locale Next.js 16.3.4/16.4.2 est
résolue par `npm ci`, la signature `PageProps` du lexique fonctionne,
et le correctif de virgule du hook compilé ne bloque plus le build
local. Ce résultat **ne garantit pas** que Vercel est déjà READY.

Les avertissements `ExperimentalWarning` et
`.pre-commit-config.yaml config file not found` sont apparus dans
la suite rapide. Le second provient des repos Git de test créés
pour la politique d'ignore Vercel ; il ne constitue pas un contrôle
des hooks sur le dépôt principal.

Quatre avertissements npm `deprecated` ont été observés pour
`crypto@1.0.1`, `node-domexception@1.0.0`,
`@azure/openai@1.0.0-beta.13` et `eslint@9.39.5`.
Ils demandent un inventaire des dépendances directes/transitives
avant décision de mise à jour. Ils n'ont pas échoué le build.

**Reste à valider :** gate complète exact-HEAD, Preview déployée,
recette FR/EN, diagnostic 429 de l'edge, authentification OWNER et
probes LAN. Aucun de ces états n'est déduit des 62 tests unitaires
ou de la compilation locale.

## Validation locale de la PR #260 — 26 octobre 2026

**Source :** journal fourni par l'opérateur après
`git pull --ff-only` (fast-forward `c94d230..575adfa` sur
`fix/homelab-owner-audit-trace-receipt-20261025`).
SHA de référence : `575adfa06ec865606d9eeeedc786c82bcd079c10`.
L'absence de commande `git status` empêche de certifier un arbre
entièrement propre pour la gate de publication.

| Exécution | Verdict |
| --- | --- |
| Runtime | Node 24.22.1 / npm 12.2.0 |
| `npm run test:fast:local` | **71/71 PASS**, 0 fail, 0 skipped, 7,40 s |
| Contrats métriques OWNER et statuts publics | **PASS** (tests L1) |
| Contrats présentation concise FR/EN | **PASS** (tests L1) |
| Contrats hauteur pendant réautorisation | **PASS** (tests L1, pas Playwright) |
| `npm run typecheck` | **PASS**, route types générés, `tsc --noEmit` sans erreur |
| `npm run build` | **PASS**, Next.js 16.4.2, Turbopack, TypeScript |
| Génération de pages | **83/83 PASS**, dont TrueNAS et Architecture FR/EN |
| `npm run quality:agent:publish` | **NOT_RUN** sur ce SHA |
| Tests navigateur réels OWNER/SERVICE / CLS | **NOT_RUN / BLOCKED** (checkpoint Vercel HTTP 429 sur Preview) |

Le build de la Preview
`b53994eeb6b85f4c9f158770048f55d69821d2af`
était `READY` avec le même code applicatif ; les changements
suivants avant `575adfa` concernent tests et documentation.
Ne pas confondre `READY` et `PASS` HTTP/navigateur.

Les messages `ExperimentalWarning` de Node et
`.pre-commit-config.yaml config file not found` dans les
dépôts Git temporaires sont non bloquants. Ils ne prouvent pas
l'exécution des hooks du dépôt principal.

**Étape suivante :** obtenir une gate de publication locale
sur checkout propre et une session navigateur OWNER réellement
autorisée. Mesurer le scroll et les hauteurs durant deux
réautorisations sans désactiver le contrôle d'accès.
