# Documentation du projet

Ce répertoire contient les runbooks maintenus avec l’application Next.js.

## Index

- [Architecture et exploitation](architecture.md)
- [Feuille de route qualité](quality-roadmap.md)
- [Feuille de route homelab / TrueNAS / FastAPI](homelab-roadmap.md)
- [Catalogue des services homelab](homelab-services-catalog.md)
- [Baseline de performance frontend](performance-baseline.md)
- [Upgrade Next.js 16.3](nextjs-16-3-upgrade.md)
- [Checkout et support Stripe](checkout-support-runbook.md)
- [Scripts frontend historiques](frontend-runtime-scripts-runbook.md)
- [Vercel Speed Insights](getting-started-speed-insights.md)
- [GitHub Actions](GITHUB_ACTIONS_SETUP.md)
- [Internationalisation](i18n-weblate-libretranslate.md)

## Règles de maintenance

- Les chemins et commandes documentés doivent exister dans le dépôt.
- `app/` et les Route Handlers Next.js décrivent le runtime principal.
- Les fichiers `public/*.html`, `api/*.js` et `server.cjs` sont des chemins
  historiques tant qu’ils n’ont pas été supprimés.
- Toute modification d’architecture, de variable d’environnement ou de
  déploiement doit mettre à jour le runbook associé.
- Tout travail homelab différé doit être ajouté à `homelab-roadmap.md`; les
  éléments transverses restent également suivis dans `quality-roadmap.md`.
- Avant publication, exécuter `npm run check`.
