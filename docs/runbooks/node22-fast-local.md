# Runbook — mode rapide Node 22/npm 10 (agents)

**Propriétaire :** nabla-site-alban. **But :** tests locaux L1 sans CI.
[Roadmap qualité](../quality-roadmap.md).
[Runbook post-déploiement](site-production-verification.md).

## Prérequis

- Node 22.x et npm 10.x.
- Un checkout isolé, avec les fichiers sources requis.
- Aucun npm install, aucun accès réseau, aucun secret.

Conserver les versions Node 24/npm 12 de `.nvmrc`, `mise.toml`,
`package.json` et du lockfile. Le mode rapide ne les remplace pas.

## Procédure

1. Exécuter `node scripts/agent-node22-fast.mjs --preflight`.
2. Exécuter `node scripts/agent-node22-fast.mjs`.
3. Lire le nombre de tests réussis.
4. Corriger chaque échec dans le module concerné.
5. Réexécuter le même profil.
6. Enregistrer le SHA testé et les échecs éventuels.
7. Exécuter la publication complète sous Node 24 lorsque possible.

Les recettes `just node22-fast` et `npm run test:fast:node22`
exécutent le même profil. Aucun workflow GitHub n'est déclenché.

## Contrat de test et résultats

Quatre fichiers de tests, sans dépendance npm :
`homelabIconFallback.test.mjs` (icônes),
`agentNode22Core.test.mjs` (C4, provenance, redaction, OWNER,
sondes), `agentNode22Fast.test.mjs` (modes, prérequis et refus),
`homelabCanonicalEvidence.test.mjs` (IDs de sonde et labels C4 expurgés).

- `NODE22_FAST_TOOLCHAIN_OK` : bonnes versions.
- `NODE22_FAST_L1_PASS` : tous les tests ciblés réussissent.
- `BLOCKED_NODE_RUNTIME` / `BLOCKED_NPM_RUNTIME` : mauvaise version.
- `BLOCKED_INCOMPLETE_CHECKOUT` : test manquant ; aucun PASS.
- `NODE22_FAST_TEST_FAIL` : test effectivement en échec.
- `NODE22_FAST_RUNNER_FAILED` : exécution interrompue.

**Preuve du 25/10/2026 :** Node 22.16.0, npm 10.9.2,
**18/18 PASS**, six fichiers récupérés à leurs blobs Git exacts
depuis le merge `99cf7e4016533532bee53a72964ffea1b4a54bc6`.
Le clone complet était inaccessible dans le shell (DNS).
Cette preuve est **L1 sur une reconstitution partielle**, pas L3.
Les vérifications Node 24, lint, TypeScript, Next, Playwright, Trivy
et quality gate restent NOT_RUN dans l'agent.

Ce runbook est une procédure réutilisable. Les travaux ouverts restent
dans la roadmap ; ne pas transformer un TEST_SKIP en PASS.
