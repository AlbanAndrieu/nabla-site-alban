# Description

<!-- Explique brièvement la fonctionnalité/correction. -->

## Checklist

- [ ] Ce PR passe `npm run check` localement (lint, typecheck, unit tests, build)
- [ ] Les hooks pre-commit formatent/valident les fichiers modifiés
- [ ] Les tests e2e Playwright passent (si pertinent)
- [ ] Aucun secret dans les fichiers modifiés (Betterleaks, detect-private-key)
- [ ] Aucune information sous NDA d'un employeur : `node scripts/security/nda-guard.mjs` est propre
- [ ] Données non publiques d'un employeur : validation explicite de l'employeur sur cette PR (rôle, employeur, lien), référencée en `employer-data` dans `scripts/security/nda-guard.json`
- [ ] Documentation/README mise à jour si changement de structure/CI/utilisation

---

# Notes pour revue
<!-- Points d’attention spécifiques ou questions pour les reviewers. -->
