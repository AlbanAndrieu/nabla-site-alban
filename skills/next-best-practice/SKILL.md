# Best Practice: Uniformiser l'accessibilité et les ancres sur les pages Next.js localisées

## Objectif

Garantir :

- Accessibilité cohérente sur toutes les pages Next.js multilingues.
- Utilisation unique du composant `<TopAnchor />` pour l'ancre `#top`.
- Internationalisation du skip-link via Next-Intl.
- Permaliens de section cohérents, stables et partageables sur les pages React natives.

---

## Pattern recommandé pour le haut de page

Dans chaque page Next.js/Next-Intl :

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

## Pattern recommandé pour les titres partageables

Utiliser le composant partagé `@/components/AnchoredHeading` pour les sections sémantiques auxquelles un utilisateur peut vouloir créer un lien :

```tsx
import AnchoredHeading from "@/components/AnchoredHeading";

<section aria-labelledby="hardware">
  <AnchoredHeading id="hardware" className="display-4">
    {title}
  </AnchoredHeading>
</section>
```

Le composant :
- garde un identifiant stable et lisible (`#hardware`, `#security`, `#architecture`, etc.) ;
- rend le titre lui-même cliquable ;
- affiche le symbole `#` de façon cohérente sans l'ajouter au nom accessible ;
- applique un `scroll-margin` pour éviter que le titre soit masqué lors de la navigation vers l'ancre ;
- évite les implémentations locales différentes d'une page à l'autre.

**Ne pas injecter les ancres via JavaScript/DOM après le rendu.** Elles font partie de la structure sémantique React et doivent être disponibles au rendu initial.

### Déploiement site-wide

Migrer progressivement les pages React natives, par composant/section partagée, plutôt que modifier en une fois les pages HTML legacy :

1. TrueNAS et autres pages déjà composantisées.
2. Composants partagés de `expertise`, `ai`, `nabla`, `workstation`, `security`.
3. Pages React plus simples.
4. Pages legacy uniquement lorsqu'elles sont migrées vers React.

Conserver les IDs existants lorsqu'ils sont déjà publics afin de ne pas casser les liens entrants.

---

## Procédure de migration / création

1. Dans tous les fichiers de page (ex : `app/[locale]/.../page.tsx`) :
   - remplacer tout en-tête de type `<div id="top" /> ... Skip to main content ...` par le pattern partagé ;
   - utiliser `AnchoredHeading` pour les titres de sections partageables ;
   - ajouter les imports absents si besoin, et rendre la fonction `async` lorsque Next-Intl serveur l'exige.
2. Vérifier :
   - le texte du skip-link est traduit ;
   - `TopAnchor` et la navigation sont fonctionnels partout ;
   - chaque permalink de section pointe vers un ID unique et stable ;
   - le focus clavier sur le titre-permalink est visible.

## Avantages

- Expérience accessibilité & i18n homogène.
- URLs de section partageables et prévisibles.
- Pattern DRY, prêt pour toute future page ou refonte.
- Facile à vérifier lors des reviews/migrations.

---

_À garder à jour avec `skills/next-migrate-locale-pages/SKILL.md`, et à référencer lors de tout ajout/migration de page Next.js dans le repo._
