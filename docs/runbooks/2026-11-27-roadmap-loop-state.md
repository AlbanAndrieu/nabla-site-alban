# Boucle roadmap — état au 27 novembre 2026

Skill [`nabla-roadmap-loop`](../../.agents/skills/nabla-roadmap-loop/SKILL.md), mode sprint renouvelé par le propriétaire le 27/11 (« implémenter le plus possible sans me demander »). PR Draft unique : [#340](https://github.com/AlbanAndrieu/nabla-site-alban/pull/340), branche `feat/roadmap-20261127`, base `master@5c05f61`. Supprimer ce fichier une fois les questions tranchées.

## Compteur

- Passe : **1** (réconciliation à la passe 3).
- Périmètre : `docs/quality-roadmap.md`, `docs/homelab-roadmap.md`, `docs/stripe-hardening-roadmap.md`, `docs/support-chatbot-study.md`.
- Ignoré sur décision du propriétaire (27/11) : FinOps A4.

## Passe 1

| Item | État | Preuve |
| --- | --- | --- |
| Chatbot : test Playwright du repli (FR/EN) | CODED, TESTED (L2 local) | `tests/support-fallback.spec.ts`, 30/30 sur 5 projets |
| G7 : lecteurs HTTP extraits de `useHomelabHealth.ts` (579 → 469) | CODED, TESTED (L1) | `homelabHealthFetchers.ts`, `npm run test:unit` PASS |
| G7 : horloge des ressources et montage ReactFlow extraits de `HomelabServicesBlock.tsx` (552 → 503) | CODED, TESTED (L1) | `homelabServicesBlockEffects.ts`, contrats source mis à jour |
| Skill `nabla-roadmap-loop` importé de nabla-compose et adapté au site | CODED, TESTED (L1) | `agentSkillParity` PASS |
| Chatbot : couverture ZAP de `/support` | Rien à coder | baseline ZAP depuis `/`, lien de pied de page |
| A6/S5 : suite navigateur FR/EN (Axe, clavier, 320/390, SEO, YubiKey, ReactFlow) | TESTED (L2 local, Chromium) | 84/84 PASS |
| A8 : exports morts (knip) 24 → 9 | CODED, TESTED (L1) | `audit:dead-code`, `test:unit`, `tsc` PASS |
| G8 : `post-deploy-smoke.mjs` (465 lignes) | Rien à faire | sous le seuil de 600, parseur déjà extrait (#324), aucun doublon prouvé |

Rien n'est `DEPLOYED` ni `ACCEPTED` : la fusion et le déploiement Vercel appartiennent au propriétaire.

## Bloqués (hors de ce dépôt ou du ressort de l'agent)

- Chatbot : secrets Vercel, modèle et base OpenWebUI, Cloudflare Access, Turnstile, Slack, règle de débit Vercel (module WAF de nabla-compose #433).
- A5 Stripe : provisionnement Neon ; utilité à confirmer (question posée le 27/11).
- S2/S3 : recette OWNER/LAN et SERVICE/WAN réelle.

## Questions parquées

- A5 : le site encaisse-t-il réellement en ligne (pages `/pricing`, `/checkout`, `/checkout-tjm`) ? Sinon, retirer ou masquer le parcours plutôt que provisionner Neon.
