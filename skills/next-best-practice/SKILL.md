# Best Practice: Uniformiser l'accessibilité et les ancres sur les pages Next.js localisées

## Objectif

Garantir :

- Accessibilité cohérente sur toutes les pages Next.js multilingues.
- Utilisation unique du composant `<TopAnchor />` pour l'ancre `#top`.
- Internationalisation du skip-link via Next-Intl.
- Permaliens de section cohérents, stables et partageables sur les pages React natives.

---

## Pattern recommandé pour le haut de page

Le skip-link global appartient désormais à `app/[locale]/layout.tsx`. Il doit être
rendu **avant** `RouteHeader` afin d'être le premier contrôle utile du parcours
clavier. Une page localisée ne doit ni importer ni rendre `SkipToMainContent`.

Chaque page reste responsable de son ancre `#top` lorsqu'elle en a besoin et,
surtout, de la cible sémantique :

```tsx
import TopAnchor from "@/components/TopAnchor";

export default function Page() {
  return (
    <>
      <TopAnchor />
      <main id="main-content">{/* ... */}</main>
    </>
  );
}
```

**Ne pas réintroduire de skip-link page-level, de `<div id="top" />` ou de
"Skip to main content" codé en dur.** Le layout locale est l'unique autorité du
skip-link pour les routes App Router localisées.

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
   - supprimer tout skip-link local ou import `SkipToMainContent` : le layout locale le rend déjà ;
   - conserver une cible unique `<main id="main-content">...`;
   - remplacer les anciens `<div id="top" />` par `TopAnchor` lorsque l'ancre est requise ;
   - utiliser `AnchoredHeading` pour les titres de sections partageables.
2. Vérifier :
   - le layout rend exactement un skip-link avant `RouteHeader` ;
   - le texte du skip-link est traduit par le composant partagé ;
   - `TopAnchor` et la navigation sont fonctionnels partout ;
   - chaque permalink de section pointe vers un ID unique et stable ;
   - le focus clavier sur le skip-link et les contrôles importants est visible.

## Avantages

- Expérience accessibilité & i18n homogène.
- URLs de section partageables et prévisibles.
- Pattern DRY, prêt pour toute future page ou refonte.
- Facile à vérifier lors des reviews/migrations.

---

_À garder à jour avec `skills/next-migrate-locale-pages/SKILL.md`, et à référencer lors de tout ajout/migration de page Next.js dans le repo._
