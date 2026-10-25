# Documentation du projet

La documentation est organisée par **usage**, pas par chronologie de PR. Git reste
la source de l'historique d'implémentation ; les documents maintenus doivent aider
à exploiter, diagnostiquer ou planifier le système actuel.

## Architecture et exploitation

- [Architecture et exploitation](architecture.md)
- [Contrat catalogue homelab v2](homelab-services-catalog.md)
- [Contrat de santé des dépendances homelab](homelab-dependency-health-ui.md)
- [Runbook réseau TrueNAS / FastAPI Cloud](truenas-fastapi-cloud-network.md)
- [Contrat Site diagnostic/identité OWNER/SERVICE](homelab-diagnostics-and-access.md)
- [Gouvernance ADR/RACI/C4 Compose](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/architecture-governance.md)
- [Sécurité Kubernetes / Zero Trust](zero-trust-kubernetes-security.md)
- [Contrat d’évaluation DSOMM portable](dsomm-assessment-contract.md)
- [Modèle de menaces du site](security-threat-model.md)

## Roadmaps actives

- [Roadmap produit et qualité](quality-roadmap.md) — backlog transverse canonique.
- [Roadmap homelab Site](homelab-roadmap.md) — rendu TrueNAS/C4, accès client, diagnostics Site et recette production ; les actions API/infra restent dans leurs dépôts.

Les roadmaps conservent les travaux ouverts, les invariants et un historique
compact. Une migration terminée ne garde pas une seconde roadmap permanente.

## Runbooks

- [Vérification du site après merge](runbooks/site-production-verification.md)
- [Test local rapide Node 22/npm 10](runbooks/node22-fast-local.md)
- [GitHub Actions](../.github/github-actions-best-practices.md)
- [Ruleset GitHub de master](github-master-ruleset.md)
- [Checkout et support Stripe](checkout-support-runbook.md)
- [Scripts frontend / analytics / Speed Insights](frontend-runtime-scripts-runbook.md)
- [Internationalisation](i18n-weblate-libretranslate.md)

## Diagnostics, incidents et références

- [Historique intégral roadmap homelab avant consolidation](archive/homelab-roadmap-through-2026-10-25.txt)
- [Index des incidents](incidents/README.md)
- [Baseline de performance historique](performance-baseline.md)
- [PoC Dagger et boucle de développement](dagger-poc.md)
- [Contrat de routage et redirects SEO](seo-url-migration.md)

## Politique de réduction documentaire

Conserver ce qui permet une décision ou un diagnostic :

- architecture/ownership et chemins réseau ;
- symptômes et preuves observables ;
- commandes/endpoints de vérification ;
- cause racine ou hypothèses explicitement qualifiées ;
- mitigation, rollback et follow-up encore ouvert ;
- invariants sécurité/qualité qui empêchent une régression.

Compacter ou supprimer :

- listes de commits et de runs déjà disponibles dans GitHub ;
- checklists entièrement terminées sans valeur opératoire résiduelle ;
- guides de migration devenus faux après stabilisation de la version ;
- copies du même backlog dans plusieurs roadmaps ;
- documentation générique d'un outil déjà couverte par sa source officielle.

## Règles de maintenance

- Les chemins et commandes documentés doivent exister dans le dépôt.
- Une évolution d'architecture, de variable d'environnement ou de déploiement
  met à jour le runbook concerné.
- Les incidents vont sous `docs/incidents/` et conservent assez de preuves pour
  reproduire le diagnostic sans relire le chat d'origine.
- Les travaux homelab détaillés vont uniquement dans `homelab-roadmap.md`; la
  roadmap qualité référence le chantier au lieu de recopier sa checklist.
- Un runbook décrit l'état courant et le diagnostic ; toute action encore ouverte
  appartient à une roadmap, pas à une seconde checklist dans le runbook.
- Un document de contrat décrit les invariants déjà implémentés ou la frontière
  d'intégration ; son plan de livraison restant appartient à la roadmap.
- Le contrat local `unit-tests/documentationPolicyContract.test.ts` interdit les
  checklists ouvertes hors des roadmaps et protège les frontières runbook/incident/contrat.
- Avant publication, utiliser la quality gate du dépôt plutôt qu'une liste de
  commandes documentaire susceptible de dériver.
