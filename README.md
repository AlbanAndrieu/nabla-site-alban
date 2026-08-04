<!-- markdown-link-check-disable-next-line -->

# [![Nabla](https://albandrieu.com/assets/nabla/nabla-4.png)](https://github.com/AlbanAndrieu/nabla-site-alban) Nabla — Alban Andrieu

[![CI](https://github.com/AlbanAndrieu/nabla-site-alban/actions/workflows/ci.yml/badge.svg)](https://github.com/AlbanAndrieu/nabla-site-alban/actions/workflows/ci.yml)
[![Coverage Status](https://codecov.io/gh/AlbanAndrieu/nabla-site-alban/branch/main/graph/badge.svg)](https://codecov.io/gh/AlbanAndrieu/nabla-site-alban)
[![Vercel](https://vercel.com/api/v1/badges/)](https://vercel.com/albandrieu-nabla-site-alban)
[![Known Vulnerabilities](https://snyk.io/test/github/AlbanAndrieu/nabla-site-alban/badge.svg)](https://snyk.io/test/github/AlbanAndrieu/nabla-site-alban)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S61UUL97)

[CHANGELOG](./CHANGELOG.html).

Portfolio bilingue d’Alban Andrieu, ingénieur cybersécurité et DevSecOps. Le
site présente son expérience, ses services, ses projets cloud/IA, son CV et des
ressources techniques.

Le site principal est une application **Next.js 16 App Router**, avec React 19,
TypeScript et `next-intl`. Le dossier `public/` contient encore des pages et
assets historiques progressivement migrés vers les composants de `app/`.

## Prérequis

- Node.js 24.11 ou supérieur
- npm 11.6 ou supérieur

## Démarrage local

```bash
npm install
npm run dev
```

L’application est ensuite disponible sur <http://localhost:3000>.

## Commandes principales

```bash
npm run dev         # serveur de développement Next.js
npm run check       # lint JS/CSS, TypeScript, tests unitaires et build
npm run test:unit   # tests Node.js
npm test            # tests Playwright multi-navigateurs
npm run build       # build de production Next.js
npm start           # serveur Next.js de production
```

Les rapports Playwright sont écrits dans `playwright-report/` et les résultats
CI dans `test-results/`.

## Architecture

```text
app/                 routes, layouts, composants et Route Handlers Next.js
components/          composants partagés en cours de consolidation
i18n/                configuration de next-intl
messages/            catalogues anglais et français
lib/                 chargement des contenus et logique métier partagée
public/              assets et pages HTML historiques
tests/               tests end-to-end Playwright
unit-tests/          tests unitaires Node.js
docs/                runbooks d’exploitation et d’intégration
```

La route par défaut est anglaise (`/`) et la version française utilise le
préfixe `/fr`. Les anciennes URLs en `.html` restent temporairement prises en
charge par les redirections et réécritures de `next.config.mjs`.

## Variables d’environnement

Les secrets ne doivent jamais être commités. Utiliser `.env.local` en local et
le gestionnaire de secrets de la plateforme en production.

Variables utilisées selon les fonctionnalités :

- `STRIPE_SECRET_KEY` ou, de préférence, une clé Stripe restreinte adaptée ;
- `STRIPE_PRICE_ID` ;
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ;
- `DOMAIN`, origine publique utilisée pour les retours Stripe ;
- `AHREFS_ANALYTICS_KEY`, facultative.

Voir [docs/checkout-support-runbook.md](docs/checkout-support-runbook.md) pour
le parcours Stripe et
[docs/frontend-runtime-scripts-runbook.md](docs/frontend-runtime-scripts-runbook.md)
pour les scripts côté navigateur.

## Déploiement

`vercel.json` configure le déploiement Next.js sur Vercel. `wrangler.jsonc`
conserve une cible Cloudflare dédiée aux assets statiques historiques ; elle ne
remplace pas le runtime Next.js complet.

Avant un déploiement :

```bash
npm run check
```

## Internationalisation

Les textes natifs sont stockés dans `messages/en.json` et `messages/fr.json`.
Les deux catalogues doivent conserver les mêmes clés. Les pages qui injectent
encore du HTML depuis `public/` sont transitoires et doivent être migrées vers
des Server Components typés.

Le processus LibreTranslate est décrit dans
[docs/i18n-weblate-libretranslate.md](docs/i18n-weblate-libretranslate.md).

## CI

Les workflows GitHub Actions couvrent notamment :

- les tests Playwright ;
- le build Docker ;
- MegaLinter ;
- la génération des PDF du CV ;
- les contrôles de configuration pour les assistants de développement.

Les secrets CI actuellement documentés sont `DOCKER_USERNAME`,
`DOCKER_PASSWORD`, `OCO_API_KEY` et, facultativement, `PAT`.

## Documentation du CV

Voir [public/cv/README.md](public/cv/README.md) pour l’architecture et la
génération des documents du CV.

## Contribution

Les bugs et propositions peuvent être soumis dans le
[gestionnaire d’issues GitHub](https://github.com/AlbanAndrieu/nabla-site-alban/issues).

## Licence

[Apache License 2.0](LICENSE).

---

Alban Andrieu [linkedin](https://fr.linkedin.com/in/nabla/)
