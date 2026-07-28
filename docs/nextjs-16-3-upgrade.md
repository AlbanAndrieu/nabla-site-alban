# Upgrade Next.js 16.3

## Version retenue

Le projet utilise `next@16.3.0-preview.10`, verrouillé exactement dans
`package.json` et `package-lock.json`.

Au moment de la migration, la dernière version stable est 16.2.12. Next.js
16.3 n’est disponible que sur les canaux `preview` et `canary`. Le canal
`preview` a été choisi pour satisfaire le besoin 16.3+ avec moins de volatilité
que le canary quotidien.

React et React DOM restent sur la branche compatible 19.2, conformément aux
peer dependencies de Next.js 16.3 preview.

## Raisons de l’upgrade

- accès au runtime Next DevTools MCP `/_next/mcp` ;
- diagnostic de compilation et de routes depuis le serveur de développement ;
- améliorations Turbopack 16.3 ;
- préparation des futures versions stables 16.3.x.

## Installation

```bash
npm install --save-exact next@16.3.0-preview.10
```

Ne pas remplacer par `next@latest` tant que `latest` pointe vers 16.2.x. Pour
mettre à jour le preview, vérifier d’abord :

```bash
npm view next@preview version peerDependencies --json
```

## Validation obligatoire

```bash
npm run check
npm run dev
```

En développement, vérifier ensuite :

- `/_next/mcp` répond et expose `get_compilation_issues` ;
- `/` et `/fr` rendent sans erreur ;
- le HTML français conserve `lang="fr"` ;
- `/api/github-stars` et `/api/create-checkout-session` restent présents ;
- les routes historiques `.html` continuent leurs redirections.

## Résultat de la migration

Validé le 28 juillet 2026 :

- build Turbopack réussi, 63 pages générées ;
- aucune erreur retournée par `get_compilation_issues` ;
- table MCP App Router complète, incluant les trois Route Handlers ;
- `/fr` rendu avec `lang="fr"` et métadonnées françaises ;
- TTFB local 115 ms, LCP 292 ms et CLS 0 sur l’échantillon contrôlé ;
- audit WCAG : une règle de contraste en échec sur huit éléments, dette visuelle
  préexistante à traiter séparément.

npm a signalé 43 vulnérabilités lors de l’installation. Aucun `npm audit fix
--force` n’a été appliqué. L’audit détaillé envoie le graphe de dépendances au
registre public et doit être lancé explicitement par un mainteneur autorisé :

```bash
npm audit
```

## Risques du canal preview

- comportement ou types susceptibles de changer avant la stable ;
- régressions Turbopack possibles ;
- mises à jour de sécurité à surveiller plus fréquemment ;
- aucun caret (`^`) ne doit être utilisé sur cette dépendance.

## Retour arrière

Si une régression bloquante apparaît :

```bash
npm install --save-exact next@16.2.12
npm run check
```

Conserver le lockfile du même commit que `package.json`.
