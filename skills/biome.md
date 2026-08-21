# Skill: Biome Best Practices

Ce skill résume les bonnes pratiques pour intégrer Biome (linter + formatter) avec succès dans un projet Next.js/TypeScript moderne.

## Best Practices Biome

1. **Suppression des imports inutilisés**
   - Ex : Retirer `import React from "react";` et autres imports inutilisés.

2. **Correction des rôles ARIA redondants**
   - Ne jamais ajouter `role="main"` sur `<main>` ou `role="contentinfo"` sur `<footer>`.

3. **Utilisation correcte des éléments de navigation/action**
   - Utiliser `<button type="button" onClick={...}>...</button>` pour les actions JS, jamais `<a href="javascript:...")>`.

4. **Remplacement `<img>` par `<Image />`**
   - Pour toute image, utiliser le composant Next.js `<Image />` avec les attributs adaptés.

5. **Déstructuration asynchrone des paramètres de route**
   - Pour les fonctions exportées de page, utiliser `const { locale } = await params;` si `params` est une Promise.

6. **Tri systématique des imports**
   - Regrouper et ordonner imports selon Biome : librairies en premier, puis composants puis assets.

7. **Types JSX personnalisés : utiliser `unknown` au lieu de `any`**
   - Ex : dans une définition d'élément JSX, préférer:
     ```ts
     'stripe-buy-button': unknown;
     ```

8. **Utiliser `biome check --write .` pour correction automatique**
   - Permet de fixer tous les problèmes auto-corrigeables et appliquer le format.

9. **Vérifier à chaque étape avec `biome check`**
   - Toujours revalider après toute modification.

10. **Respecter les messages du linter pour accessibilité et typage**
    - Corriger tous les warnings ARIA, typage, import, anchor, etc.

## Commandes utiles

```bash
npx @biomejs/biome check --write .      # Format et lint tous les fichiers
npx @biomejs/biome check <file>         # Vérifie un fichier
```
