# Best Practice: Uniformiser l'accessibilité "Skip to main" sur toutes les pages Next.js localisées

## Objectif

Garantir :

- Accessibilité cohérente sur toutes les pages Next.js multilingues
- Utilisation unique du composant `<TopAnchor />` pour l'ancre #top
- Internationalisation du skip-link ("Skip to main content") via Next-Intl

---

## Pattern recommandé

Dans chaque page Next.js/Next-Intl :

```tsx
import TopAnchor from "@/components/TopAnchor";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const site = await getTranslations("site");
  return (
    <>
      <TopAnchor />
      <a href="#main-content" className="skip-to-main">
        {site("skipToMainContent")}
      </a>
      {/* ... suite de la page ... */}
    </>
  );
}
```

**Plus de `<div id="top" />` ni de "Skip to main content" codé en dur.**

---

## Procédure de migration / création

1. Dans tous les fichiers de page (ex : `app/[locale]/.../page.tsx`) :
    - Remplacer tout en-tête de type `<div id="top" /> ... Skip to main content ...` par le pattern ci-dessus.
    - Ajouter les imports absents si besoin, et rendre la fonction `async`.
2. Vérifier :
    - Le texte du skip-link est bien traduit (Intl : en, fr…)
    - L'ancre TopAnchor et la navigation sont fonctionnelles partout

## Avantages

- Expérience accessibilité & i18n homogène.
- Pattern DRY, prêt pour toute future page ou refonte.
- Facile à vérifier lors des reviews/migrations.

---

_À garder à jour dans skills/next-migrate-locale-pages/SKILL.md, et à référencer lors de tout ajout/migration de page Next.js dans le repo._
