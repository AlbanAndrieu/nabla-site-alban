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
