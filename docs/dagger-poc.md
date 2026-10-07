# PoC Dagger et optimisation de la boucle de développement

## Statut

Dagger est introduit comme **PoC non bloquant**. La quality gate historique,
GitHub Actions, Vercel Preview, Playwright et OWASP ZAP restent les contrôles
autoritaires. Une divergence Dagger doit être diagnostiquée, pas utilisée pour
affaiblir une gate existante.

Le PoC épingle Dagger 0.21.10. La branche 1.0 est encore en beta et la
documentation du SDK TypeScript signale une transition d'interface ; la
migration vers 1.0 sera évaluée séparément après stabilisation.

## Périmètre du PoC

`dagger call check --source=.` exécute en parallèle :

- Node 26.8.2 : ESLint, Stylelint, TypeScript, tests unitaires et build Next.js ;
- Node 24.11.0 : build de compatibilité Vercel.

Le cache npm et le cache Next.js sont des volumes Dagger persistants. Le build
Next.js appelle directement `npx next build` dans le conteneur éphémère : le
wrapper local qui restaure `next-env.d.ts` n'est pas nécessaire et cela permet
de garder `.git` hors du contexte Dagger. Git reste installé dans le conteneur
pour les tests qui manipulent leurs propres dépôts temporaires. Le
contexte source exclut `.git`, `node_modules`, les sorties de tests/build et
tous les fichiers `.env*` afin de ne pas copier les secrets locaux dans le
pipeline.

Commandes :

```bash
just dagger-check
just dagger-check-node26
just bench-dev-loop
```

`bench-dev-loop` utilise Hyperfine et compare, à cache chaud, le contrôle
Dagger Node 26 avec `npm run check`. Il ne remplace pas les mesures CI
existantes.

## Estimation de réduction de code

Baseline mesurée au démarrage du PoC :

- 3 484 lignes dans la sélection CI/tooling principale ;
- 1 246 lignes dans le noyau candidat
  (`ci.yml`, `node24-compat.yml`, `agent-quality-gate.sh`,
  `quality-gate.sh`) ;
- `ci.yml` seul : 693 lignes ;
- `node24-compat.yml` : 100 lignes.

Le PoC **augmente temporairement** le code exécutable : c'est volontaire pour
mesurer la parité avant suppression.

Si Dagger atteint la parité et remplace uniquement les blocs répétés
setup-node/npm/cache/lint/type/test/build tout en laissant GitHub Actions gérer
permissions, événements, OIDC, statuts et Preview, l'estimation raisonnable est :

- **25–35 % de réduction** du code d'orchestration build/test concerné ;
- environ **8–12 % de réduction** sur la sélection CI/tooling de 3 484 lignes ;
- potentiel **35–45 %** sur le noyau build/test si les scripts shell de
  duplication deviennent de simples adaptateurs Dagger.

Ces pourcentages sont des objectifs à confirmer sur trois PR comparables. Ils
n'incluent pas Vercel, ZAP, Playwright distant, release, GitHub policy ni les
workflows post-merge, qui gardent une vraie responsabilité d'orchestration.

## Benchmark local des hook runners

Le PoC ajoute désormais, **sans changer le hook Git canonique** :

- `prek 0.5.4`, exécuté sur la même `.pre-commit-config.yaml` que
  pre-commit pour permettre un A/B à configuration identique ;
- `hk 2.5.0` avec un hook custom `fast-check` qui lance ESLint, Stylelint
  et TypeScript en parallèle. Aucun `pre-commit` hk n'est déclaré et
  `hk install` n'est pas appelé par le projet ;
- `just bench-hook-runners` refuse de démarrer si l'arbre Git n'est pas
  propre, puis compare pre-commit et prek avec Hyperfine ;
- `just bench-fast-check` compare le fast-check hk aux mêmes trois contrôles
  npm exécutés séquentiellement.

Ces benchmarks sont des **mesures locales**, pas des gates CI. Leur but est de
mesurer le temps d'échec précoce et le coût d'orchestration avant de décider
d'une migration.

## Hooks : ce qui peut réellement accélérer

Un gestionnaire de hooks ne réduit pas directement le temps de compilation
Next.js. Il réduit surtout le **temps perdu avant un échec** :

1. formatter et secret scan sur les fichiers modifiés avant installation npm ;
2. lint ciblé avant typecheck/tests/build ;
3. exécution concurrente des contrôles indépendants ;
4. échec local avant consommation d'un runner GitHub.

Le dépôt fait déjà correctement une partie essentielle : la gate pre-commit
passe avant Semgrep, `npm ci` et le build. Remplacer pre-commit n'a donc de
sens que si le benchmark local montre une amélioration nette sans perdre
l'isolation et la compatibilité des hooks.

### Candidats

| Outil | Intérêt | Risque / coût de migration | Décision PoC |
| --- | --- | --- | --- |
| pre-commit 4.6.2 | isolation des environnements, configuration déjà éprouvée | hooks séquentiels | référence actuelle |
| prek | compatible avec la configuration pre-commit existante | quelques écarts de CLI | meilleur candidat A/B à faible risque |
| hk | parallélisme, file locks, builtins, check/fix/pre-commit partagés | nouvelle configuration Pkl | benchmark après parité de règles |
| Lefthook | groupes parallèles, filtres fichiers, configuration simple | dépend davantage des outils système/mise | candidat si hk/prek n'apportent pas assez |

Le benchmark publié par hk le 28 septembre 2026 mesurait, sur sa machine de
référence, le scénario « commit » à 1,15 s pour hk, 1,83 s pour Lefthook,
2,21 s pour prek et 3,00 s pour pre-commit. Pour « check every file », les
médianes étaient 3,24 s, 5,12 s, 5,81 s et 7,34 s. Ces chiffres ne doivent pas
être transposés directement au dépôt : la prochaine étape est un benchmark
Hyperfine sur la configuration Nabla réelle.

## Outils pour accélérer le code et les agents IA

### Priorité haute

- **ast-grep** : recherche et réécriture structurelles AST. Pour un agent,
  cela réduit les recherches textuelles larges et permet des codemods
  déterministes vérifiables.
- **ripgrep** : rester le premier outil pour la recherche textuelle ciblée ;
  l'agent doit chercher un symbole/contrat avant de lire des répertoires
  entiers.
- **Hyperfine** : mesurer les commandes du cycle de développement au lieu de
  choisir un outil sur un benchmark externe.
- **Dagger** : rendre install/build/test identiques localement et en CI, avec
  cache de contenu et parallélisme.
- **Skills courts et spécialisés** : charger uniquement le workflow utile à la
  tâche. Le dépôt possède déjà plusieurs skills Nabla ; la priorité est leur
  consolidation, pas l'ajout systématique de nouvelles instructions.

### À évaluer

- **Oxlint** : linter JS/TS haute performance avec migration ESLint et lint
  type-aware. Tester en complément d'ESLint avant toute substitution, car les
  plugins Next/React et les règles spécifiques doivent conserver leur parité.
- **Biome / Oxfmt** : intéressants si un audit montre qu'ils peuvent remplacer
  plusieurs formatters/linters sans perte de règles. Pas de migration sur la
  seule base d'un benchmark.
- **MCP ast-grep** : expérimental mais intéressant pour fournir à un agent une
  recherche structurelle plutôt qu'une lecture massive du repository.

## Stratégie IA : moins de contexte, plus de preuves

Pour accélérer la génération pertinente :

1. garder `AGENTS.md` pour les invariants courts et globaux ;
2. garder les skills pour des workflows réellement réutilisables ;
3. fusionner les instructions qui se recouvrent au lieu d'ajouter un skill par
   outil ;
4. utiliser une recherche progressive : `rg` → ast-grep → fichiers ciblés ;
5. générer un petit patch puis lancer le contrôle ciblé le moins cher ;
6. ne lancer Dagger/full build qu'après succès des contrôles déterministes ;
7. réserver les Preview/DAST aux changements qui ont besoin d'un runtime
   déployé.

L'objectif n'est pas seulement de réduire la durée CPU : moins de fichiers lus,
moins de logs et moins de reruns réduisent aussi les tokens et le temps de
raisonnement des agents.

## Interprétation du check GitHub non bloquant

Le job GitHub du PoC utilise volontairement `continue-on-error` autour de
l'appel Dagger. Sa conclusion GitHub peut donc rester verte alors que la
commande Dagger a retourné une erreur. **Un job vert ne constitue pas une
preuve de parité Dagger.** La preuve expérimentale est le couple
`steps.dagger.outcome=success` et `exit_code=0` reporté dans le Job Summary.

Ce compromis conserve le PoC non bloquant sans confondre disponibilité de
l'expérience et conformité du pipeline. Si Dagger devient une gate canonique,
`continue-on-error` devra être supprimé.

## Critères de décision après trois PR

Conserver puis étendre Dagger seulement si les trois conditions suivantes sont
observées :

- parité fonctionnelle avec la gate actuelle sur le même HEAD ;
- réduction mesurable du temps chaud ou du coût de setup/cache ;
- diminution nette de la duplication de pipeline sans déplacer la complexité
  vers un module Dagger opaque.

Pour les hooks, benchmarker ensuite pre-commit, prek et hk sur les mêmes fichiers
et le même cache. Lefthook devient prioritaire seulement si sa simplicité
d'exploitation compense une performance inférieure à hk/prek.


## Recherche outils / agents — octobre 2026

### Hooks rapides

Le benchmark hk publié le 28 septembre 2026 compare hk 2.4.0, Lefthook
2.1.14, prek 0.5.3 et pre-commit 4.6.2 sur huit CPU. Sur leur scénario
« commit », les médianes annoncées sont 1,15 s / 1,83 s / 2,21 s / 3,00 s.
Sur « check every file », hk annonce 3,24 s contre 7,34 s pour pre-commit.
Ces chiffres ne sont **pas** une estimation Nabla : ils justifient uniquement
le benchmark local ajouté ici.
Source : https://hk.jdx.dev/benchmarks

hk est particulièrement intéressant lorsque plusieurs checks/fixers travaillent
sur des fichiers qui se recouvrent : il parallélise les étapes et coordonne les
lectures/écritures avec des verrous par fichier. Lefthook sait également
paralléliser des groupes, mais les fixers concurrents exigent davantage de
discipline de configuration.
Sources : https://hk.jdx.dev/why-hk.html et
https://lefthook.dev/configuration/jobs/

prek est le candidat de migration le moins risqué : il réutilise la
configuration pre-commit existante et fournit un binaire Rust autonome.
Source : https://github.com/j178/prek

### Réduction du temps de développement, pas seulement du build

Les hooks doivent rester devant les opérations coûteuses :

```text
changed files
  -> formatter / secrets / lint ciblé
  -> typecheck / unit
  -> Dagger build
  -> Preview
  -> Playwright / ZAP
```

Le gain principal est donc le **temps avant feedback**. Le build Next.js n'est
pas accéléré par un hook ; il est évité lorsque le patch est déjà invalide.

### Outillage IA à évaluer

1. **ast-grep** pour recherche et réécriture AST déterministes. Il est
   particulièrement adapté aux agents pour éviter les recherches textuelles
   larges et produire des codemods contrôlables.
   https://ast-grep.github.io/
2. **Context7** pour injecter la documentation de bibliothèque courante et
   versionnée dans l'agent, afin de réduire les API obsolètes/hallucinées.
   https://context7.com/docs/overview
3. **Oxlint** en mode incrémental avant ESLint. Son outil de migration peut
   convertir un flat config ESLint et conserver ESLint pour les règles non
   supportées ; aucun remplacement ne doit être fait avant comparaison de
   diagnostics sur ce repository.
   https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html
4. **Skills spécialisés et courts** : préférer un skill par workflow stable
   (quality, review, PR, Dagger) à des instructions générales volumineuses.
   Réévaluer régulièrement AGENTS.md et les skills pour retirer les règles
   devenues évidentes ou dupliquées.
5. **Dagger** comme environnement d'exécution reproductible de l'agent :
   l'agent peut produire un petit patch, lancer un check ciblé, puis seulement
   promouvoir vers `dagger call check`.

L'objectif d'optimisation IA est : **moins de contexte lu + patch plus petit +
preuve ciblée plus tôt**, avant d'utiliser les gates coûteuses.
