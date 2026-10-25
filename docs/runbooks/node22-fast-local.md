# Runbook — tests rapides locaux : Node 22/npm 10 et Node 24/npm 12

**Propriétaire :** nabla-site-alban. **But :** suite L1 hors CI, sans installation de dépendances.
Voir [roadmap qualité](../quality-roadmap.md) et [publication](site-production-verification.md).

## Prérequis

- **Profil agent :** Node ≥22.16.x (branche 22) et npm 10.x.
- **Profil projet :** Node ≥24.22.1 (branche 24) et npm ≥12.2.0 (branche 12).
- Un checkout contenant les fichiers des tests ciblés.
- Aucun secret, aucun appel réseau et aucun `npm ci` requis pour cette suite.

Le second profil correspond à `package.json`, `.nvmrc` et `mise.toml`.
Le premier est une exception locale pour les agents, **pas** un runtime de publication.
La suite refuse les versions mélangées (Node 24/npm 10, Node 22/npm 12).

## Procédure

1. Lire `node --version`.
2. Lire `npm --version`.
3. Exécuter `node scripts/agent-node22-fast.mjs --preflight`.
4. Exécuter `npm run test:fast:local`.
5. Corriger le premier test qui échoue.
6. Relancer `npm run test:fast:local`.
7. Consigner le SHA exact testé.
8. Utiliser le quality gate complet du projet sous Node 24 pour publier.

Les commandes historiques `npm run test:fast:node22` et `just node22-fast`
demeurent compatibles et utilisent le **même** lanceur.
Le nom du fichier `agent-node22-fast.mjs` est conservé pour compatibilité.

## Preuves et limites

Le lanceur utilise `--experimental-strip-types --test` pour des
contrats sans dépendances npm. Il valide les fichiers présents avant
d'exécuter les tests. Le nombre de fichiers est défini dans
`FAST_TESTS`; ne pas présenter une liste historique de quatre tests
comme la totalité de la suite.

- `LOCAL_FAST_TOOLCHAIN_OK` : une paire de versions autorisée.
- `LOCAL_FAST_L1_PASS` : tous les tests ciblés sont passés.
- `BLOCKED_NODE_RUNTIME` / `BLOCKED_NPM_RUNTIME` : paire incompatible.
- `BLOCKED_INCOMPLETE_CHECKOUT` : il manque au moins un fichier de test.
- `LOCAL_FAST_TEST_FAIL` : au moins un test a échoué.
- `LOCAL_FAST_RUNNER_FAILED` : échec du lancement du processus enfant.

La suite n'effectue ni installation, ni build Next.js, ni tests
Playwright sur le LAN, ni validation de la production. Un PASS L1 ne
constitue **jamais** un PASS L3.

**Historique :** un profil Node 22.16.0/npm 10.9.2 a exécuté 18/18 tests
sur une reconstitution partielle le 25 octobre 2026 ; il ne validait
pas un checkout complet. Le 25 octobre à 23:25 (Paris), un opérateur
sur Node 24.22.1/npm 12.2.0 a signalé le refus de l'ancien précontrôle
Node22-only. Le code est corrigé dans PR #260. L'exécution de la suite
complète sous Node 24 reste **NOT_RUN** tant que le résultat n'est pas
transmis par l'opérateur.

## Diagnostic test de parsing TypeScript — 25 octobre 2026

L'exécution opérateur sous Node 24.22.1/npm 12.2.0 a exécuté **58 tests** :
**57 PASS, 1 FAIL**. Seul `unit-tests/homelabHookParse.test.mjs` échouait
avec `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`, car `stripTypeScriptTypes`
avait été appelé en mode `strip` sur le constructeur
`constructor(readonly reason: ...)`. Ce motif est valide en TypeScript.

Le test emploie désormais `mode: "transform"`, qui convertit les
propriétés de paramètres du constructeur avant `node --check`.
Un test négatif vérifie que l'ancienne erreur de virgule manquante est
toujours détectée. Aucun `npm ci` ni `next build` n'est nécessaire.

**Preuve agent :** 2 tests ciblés sur une fixture reproduisant cette
syntaxe, **2 PASS sous Node 22.16.0/npm 10.9.2**. L'exécution sur le
**fichier TypeScript complet et sous Node 24 reste NOT_RUN côté agent**
jusqu'au nouveau résultat de l'opérateur.

Ne pas confondre `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` émis par le mode
`strip` avec une erreur de syntaxe du fichier TypeScript original.
