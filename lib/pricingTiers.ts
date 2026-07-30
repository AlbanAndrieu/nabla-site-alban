import type { PaymentLocale } from "./paymentPages";

type PricingTier = Readonly<{
  id: string;
  icon: string;
  title: string;
  range: string;
  summary: string;
  bullets: readonly string[];
  cta: string;
  href: string;
}>;

export const PRICING_TIERS = {
  en: [
    {
      id: "fractional",
      icon: "fa-calendar-week",
      title: "Fractional DevSecOps / cloud architect",
      range: "€750–€790 per day, excluding VAT",
      summary:
        "Monthly retainer, typically equivalent to 1–3 days per week, remote-first in EU time zones.",
      bullets: [
        "Architecture reviews, roadmaps, IaC, and delivery pipelines.",
        "Security and compliance alignment: ISO 27001, SOC 2, and GDPR-aware design.",
        "Async support plus agreed working sessions.",
      ],
      cta: "Discuss a retainer",
      href: "https://calendly.com/alban-andrieu",
    },
    {
      id: "audit",
      icon: "fa-magnifying-glass-chart",
      title: "Audit & assessment sprint",
      range: "Fixed fee after discovery",
      summary:
        "A focused review with written outcomes, commonly delivered over 2–4 elapsed weeks.",
      bullets: [
        "Cloud, platform, CI/CD, or security posture review.",
        "Findings report, prioritized backlog, and read-out workshop.",
        "Optional fractional or project follow-up.",
      ],
      cta: "Request a scope",
      href: "mailto:job@albandrieu.com?subject=Audit%20sprint%20request",
    },
    {
      id: "project",
      icon: "fa-diagram-project",
      title: "Project-based delivery",
      range: "Milestone SOW or capped time and materials",
      summary:
        "Defined outcomes for migrations, platform builds, or compliance initiatives.",
      bullets: [
        "Milestones and acceptance criteria documented up front.",
        "Weekly demos or written progress reports.",
        "Handover documentation and knowledge transfer.",
      ],
      cta: "Outline your project",
      href: "mailto:job@albandrieu.com?subject=Project%20SOW%20discussion",
    },
  ],
  fr: [
    {
      id: "fractional",
      icon: "fa-calendar-week",
      title: "DevSecOps / architecte cloud fractionné",
      range: "750–790 € par jour, hors TVA",
      summary:
        "Mandat mensuel, généralement équivalent à 1–3 jours par semaine, à distance et sur les fuseaux européens.",
      bullets: [
        "Revues d’architecture, feuille de route, IaC et pipelines.",
        "Alignement sécurité et conformité : ISO 27001, SOC 2 et RGPD.",
        "Support asynchrone et sessions de travail convenues.",
      ],
      cta: "Discuter d’un mandat",
      href: "https://calendly.com/alban-andrieu",
    },
    {
      id: "audit",
      icon: "fa-magnifying-glass-chart",
      title: "Sprint d’audit et d’évaluation",
      range: "Forfait après la phase de découverte",
      summary:
        "Une revue ciblée avec livrables écrits, généralement menée sur 2 à 4 semaines calendaires.",
      bullets: [
        "Revue cloud, plateforme, CI/CD ou posture de sécurité.",
        "Rapport, backlog priorisé et atelier de restitution.",
        "Suivi fractionné ou projet en option.",
      ],
      cta: "Demander un cadrage",
      href: "mailto:job@albandrieu.com?subject=Demande%20de%20sprint%20audit",
    },
    {
      id: "project",
      icon: "fa-diagram-project",
      title: "Livraison au projet",
      range: "Énoncé des travaux par jalons ou régie plafonnée",
      summary:
        "Résultats définis pour une migration, une plateforme ou une initiative de conformité.",
      bullets: [
        "Jalons et critères d’acceptation définis en amont.",
        "Démonstrations hebdomadaires ou suivi écrit.",
        "Documentation de transfert et partage de connaissances.",
      ],
      cta: "Présenter votre projet",
      href: "mailto:job@albandrieu.com?subject=Discussion%20projet",
    },
  ],
} satisfies Record<PaymentLocale, readonly PricingTier[]>;
