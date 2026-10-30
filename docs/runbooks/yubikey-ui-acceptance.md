# Recette UI publique — Security / YubiKey

Ce runbook concerne **uniquement le site Next.js**. Il ne programme pas de YubiKey, ne teste pas de PIN/PUK et n'accède pas aux fichiers d'escrow. Le matériel, les sauvegardes et les preuves de reprise appartiennent à `nabla-compose`.

## État et périmètre

- Fonctionnalité livrée dans la PR #264, fusionnée le 29 octobre 2026.
- Deux routes : `/fr/security/yubikey` et `/security/yubikey`.
- 14 exemples d'usage et 25 entrées de lexique **par langue**.
- Navigation partagée : icône Home, bouton Back to Home et bouton Back to Top.
- Graphe ReactFlow : 11 boutons de sélection accessibles au clavier et liste textuelle des relations séparée, sans tabulations redondantes sur les nœuds/liens graphiques. La sélection à la souris reste disponible.
- Ne pas confondre un Vercel `READY` avec une recette navigateur `PASS`.

## Validation locale sans GitHub Actions

Exécuter dans un checkout propre du dernier commit de la PR de suivi, avec Node 24/npm 12 et les dépendances du lockfile.

```bash
npm ci
node --test unit-tests/securityYubiKeyGuide.test.mjs

# Si l'environnement de production publique est accessible :
BASE_URL=https://www.albanandrieu.com \
  npx playwright test tests/yubikey.spec.ts --project=chromium

# Compléter, sur ce même checkout, la gate officielle :
npm run quality:agent:publish
```

Pour une recette mobile plus large, exécuter ensuite le même fichier avec les projets `"Mobile Chrome"` et `"Mobile Safari"` (déjà déclarés dans `playwright.config.ts`). Ce contrôle supplémentaire ne remplace pas la vérification visuelle sur écran de 320/390 px.

Pour une Preview Vercel, définir `BASE_URL` vers **l'URL du déploiement correspondant au SHA exact**. Si elle est protégée, utiliser les paramètres `VERCEL_PREVIEW_PROTECTED=true` et `VERCEL_AUTOMATION_BYPASS_SECRET` déjà prévus par `playwright.config.ts`, avec une variable injectée par un gestionnaire de secrets. Ne jamais imprimer le bypass token, le placer dans le dépôt ou le transmettre en paramètre de ligne de commande.

La suite `tests/yubikey.spec.ts` contient **5 scénarios par langue (10 sur Chromium)** : HTTP, langue et URL canonique, 14 fiches/25 sigles, sélection du graphe au clavier, glyphes Font Awesome réellement calculés dans l'en-tête et le footer, clic sur Home/Back to Top, contrôle du défilement sous `prefers-reduced-motion`, mises en page 320/390 px et audit automatique Axe WCAG A/AA sur le graphe, les exemples et le footer. Ces scénarios sont **écrits, pas encore exécutés sur un navigateur par l'agent**. Les rapports Playwright et captures d'écran peuvent inclure des informations de navigation ; ils restent locaux, non publics.

## Diagnostic d'accès à la Preview (30 octobre 2026)

Le projet Vercel conserve `ssoProtection.enabled=true` pour les déploiements hors domaines personnalisés (`all_except_custom_domains`) ; ces protections ne sont pas modifiées. Une lecture directe via l'accès Vercel autorisé a obtenu **HTTP 429** avec `x-vercel-mitigated: challenge` et le titre `Vercel Security Checkpoint` sur la Preview de `91d9ebab` (FR et EN). La même réponse a été observée sur l'URL de déploiement Vercel du commit de production `89fa8b46`. **Ce contrôle HTTP n'a pas atteint le HTML de l'application** : il ne prouve ni que la page est en panne, ni que sa navigation est correcte. Le déploiement `READY` atteste séparément le build.

`tests/yubikey.spec.ts` échoue désormais **immédiatement avec un diagnostic distinct** en cas de challenge Vercel au lieu d'attendre des éléments HTML de l'application puis de générer une erreur trompeuse « élément introuvable ».

Pour une validation automatisée autorisée :
- conserver les protections Vercel, ne jamais désactiver le WAF ni ouvrir une exception globale ;
- utiliser le mécanisme Vercel officiel **Protection Bypass for Automation** avec un secret injecté hors dépôt via `VERCEL_AUTOMATION_BYPASS_SECRET` et la configuration Playwright existante, si applicable ;
- éviter de consigner le token de challenge, les cookies, les en-têtes d'authentification ou la clé d'automatisation dans les journaux et les rapports ;
- si la protection empêche toujours l'accès, noter `BLOCKED_BY_WAF` et conserver Playwright/Axe en `NOT_RUN` plutôt que de conclure à un défaut d'UI.

Référence : [Vercel — Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).

## Recette manuelle minimale

1. Sur FR puis EN : vérifier que l'icône Home est visible dans l'en-tête **et** le footer, que Back to Home mène au bon accueil, et que Back to Top fonctionne après défilement.
2. Activer « réduire les animations » dans le système : Back to Top doit revenir en haut sans mouvement fluide ; sans cette préférence, le défilement fluide reste possible.
3. Au clavier : tabuler vers les 11 boutons « Sélectionner un composant du graphe », sélectionner avec Entrée/Espace, vérifier `aria-pressed` et le panneau de relations ; confirmer que les nœuds et liens ReactFlow ne constituent pas une seconde série de tabulations. Ouvrir également la liste textuelle des relations (libellé distinct).
4. Tester 320 et 390 px, zoom navigateur 200 %, modes clair/sombre : pas de débordement horizontal ni de contrôle coupé ; lire et faire défiler les blocs de commande.
5. Vérifier les liens officiels de chaque scénario, leur avertissement et l'absence de numéro de série, clé privée, secret OTP, PIN/PUK ou adresse LAN dans la page et les rapports.

## Décision de clôture

- **PASS** : build/TypeScript sur le SHA exact + tests unitaires + Playwright FR/EN + vérification manuelle/a11y sans anomalie bloquante.
- **BLOCKED** : authentification Preview non disponible, navigateur absent, gate L3 non exécutée ou défaut visible ; conserver des états `NOT_RUN` explicites.
- **Ne jamais fusionner automatiquement** : revue humaine, PR Draft tant que la preuve de recette n'existe pas.
