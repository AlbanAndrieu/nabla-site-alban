# Vercel Speed Insights

## Implémentation du dépôt

Speed Insights est chargé par `public/site-analytics.js`, inclus depuis
`app/[locale]/layout.tsx`. Le script Vercel utilisé est
`/_vercel/speed-insights/script.js`.

Ne pas ajouter simultanément le composant `SpeedInsights` de
`@vercel/speed-insights/next` sans supprimer ce chargeur : cela produirait une
double instrumentation.

## Modes analytics

`data-analytics-mode="vercel"` charge Vercel Analytics et Speed Insights. Les
modes `full`, `marketing` et `home` ajoutent d’autres fournisseurs mais
conservent aussi les outils Vercel.

Voir [frontend-runtime-scripts-runbook.md](frontend-runtime-scripts-runbook.md)
pour le détail des modes.

## Activation

1. Activer Speed Insights dans le projet Vercel.
2. Déployer l’application Next.js.
3. Vérifier une requête réussie vers `/_vercel/speed-insights/script.js`.
4. Vérifier l’arrivée des mesures dans le dashboard Vercel après trafic réel.

En local, l’endpoint Vercel peut être absent ; cela ne doit pas bloquer le rendu
de la page.

## Tests

`tests/site-analytics.spec.ts` vérifie le câblage du script. Après une évolution
du chargeur :

```bash
npx playwright test tests/site-analytics.spec.ts --project=chromium
```
