# Documentation du projet

La documentation est organisée par **usage**, pas par chronologie de PR. Git reste
la source de l'historique d'implémentation ; les documents maintenus doivent aider
à exploiter, diagnostiquer ou planifier le système actuel.

## Sources de vérité

### Architecture et exploitation

- [Architecture et exploitation](architecture.md)
- [Catalogue des services homelab](homelab-services-catalog.md)
- [Santé des dépendances homelab](homelab-dependency-health-ui.md)
- [Réseau TrueNAS / FastAPI Cloud](truenas-fastapi-cloud-network.md)
- [Sécurité Kubernetes / Zero Trust](zero-trust-kubernetes-security.md)

### Roadmaps actives

- [Roadmap produit et qualité](quality-roadmap.md) — backlog transverse canonique.
- [Roadmap homelab](homelab-roadmap.md) — backlog TrueNAS/FastAPI/Talos/DNS.

Une migration terminée ne conserve pas une roadmap séparée. Les anciennes
roadmaps Tailwind/PostCSS et Next 16.3 preview ont été retirées après consolidation
de leurs invariants utiles.

### Runbooks

- [GitHub Actions](GITHUB_ACTIONS_SETUP.md)
- [Ruleset GitHub de master](github-master-ruleset.md)
- [Checkout et support Stripe](checkout-support-runbook.md)
- [Scripts frontend / analytics / Speed Insights](frontend-runtime-scripts-runbook.md)
- [Internationalisation](i18n-weblate-libretranslate.md)

### Diagnostics, incidents et références

- [Index des incidents](incidents/README.md)
- [Baseline de performance historique](performance-baseline.md)
- [Migration des URL SEO](seo-url-migration.md)

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
- documentation d'un outil/runtime supprimé sans chemin de diagnostic actuel.

## Règles de maintenance

- Les chemins et commandes documentés doivent exister dans le dépôt.
- Une évolution d'architecture, de variable d'environnement ou de déploiement
  met à jour le runbook concerné.
- Les incidents vont sous `docs/incidents/` et conservent assez de preuves pour
  reproduire le diagnostic sans relire le chat d'origine.
- Les travaux homelab détaillés vont uniquement dans `homelab-roadmap.md`; la
  roadmap qualité référence le chantier au lieu de recopier sa checklist.
- Avant publication, utiliser la quality gate du dépôt plutôt qu'une liste de
  commandes documentaire susceptible de dériver.
