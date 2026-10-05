# Contrat d’évaluation DSOMM de repository

Ce dépôt publie une auto-évaluation DSOMM **fondée sur des preuves** sous une
forme conçue pour être importée et agrégée par `nabla-compose`.

## Artefacts canoniques

- `/nabla-dsomm-assessment.json` : évaluation canonique du repository.
- `/nabla-dsomm-assessment.schema.json` : schéma JSON du contrat v1.
- `/.well-known/nabla/dsomm-assessment.json` : miroir HTTP exact.
- `/.well-known/nabla/dsomm-assessment.schema.json` : miroir HTTP exact du schéma.

Le miroir public ne devient pas une seconde source : les tests exigent une
égalité octet pour octet avec les fichiers canoniques du repository.

## Identité et provenance

Le contrat `nabla.dsomm.repository-assessment/v1` utilise l’UUID upstream d’une
activité DSOMM comme identité globale. Chaque producteur publie également :

- le repository et la branche par défaut ;
- la date et le commit Git servant de base à l’évaluation ;
- la version et le commit source exacts du modèle DSOMM ;
- les preuves utilisées et leur visibilité ;
- l’applicabilité, le progrès, la confiance et la justification de chaque claim.

Le validateur `lib/dsommAssessment.ts` échoue fermé si un UUID, nom, niveau ou
dimension ne correspond pas au snapshot DSOMM piné localement.

## Progression

Les quatre états reprennent la définition DSOMM :

| État | Score |
| --- | ---: |
| `not-implemented` | 0 |
| `started` | 0,2 |
| `partly-implemented` | 0,5 |
| `fully-implemented` | 1 |

`not-applicable` n’est **pas** un score nul. Il est exclu du calcul. Une
activité sans claim est `not-assessed` et ne doit jamais être transformée
implicitement en zéro.

## Agrégation dans `nabla-compose`

Un agrégateur peut découvrir le fichier à la racine d’un clone Git ou par
`/.well-known/nabla/dsomm-assessment.json`. Il doit :

1. valider le schéma et la provenance du producteur ;
2. conserver le repository et chaque preuve avec le claim ;
3. joindre les claims par `activityUuid` ;
4. exclure les claims `not-applicable` du dénominateur ;
5. conserver les activités absentes comme `not-assessed` ;
6. séparer **couverture d’assessment** et **progression moyenne** ;
7. refuser une agrégation directe de modèles dont `sourceCommit` diffère.

Le contrat recommande la moyenne des scores des repositories applicables pour une
vue portfolio, mais la donnée détaillée par repository reste la source de
diagnostic. Un score global ne doit donc jamais supprimer la provenance.

## Migration de modèle

Le producteur courant est encore basé sur DSOMM 5.0.2. Lors d’un passage à un
nouveau modèle, chaque repository doit être revalidé/rebasé vers le commit source
cible. `nabla-compose` peut ingérer plusieurs versions pour diagnostic, mais ne
doit agréger leurs scores qu’après normalisation explicite des UUID vers un même
modèle cible.

## Preuves restreintes

Les références Notion sont des preuves de gouvernance utiles, mais leur
`visibility` vaut `restricted`. Un consommateur peut afficher leur titre et
leur provenance sans supposer que le document est publiquement accessible.
