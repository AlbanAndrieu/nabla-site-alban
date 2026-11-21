# Durcissement Stripe Checkout — 21 octobre 2026

## Implémenté dans cette branche
- Endpoint `POST /api/stripe/webhook` : corps brut, validation cryptographique de `Stripe-Signature`, borne de 64 KiB, contrôle strict de `Content-Length` et `Content-Type`, aucune donnée personnelle dans les logs.
- Tests synthétiques `unit-tests/stripe-webhook.test.ts` : signature absente/altérée, événements non financiers, refus de trois événements de paiement et validations HTTP. **TESTED (L1) le 21/11/2026** sur `master@6d76870` : `stripe-webhook.test.ts` et `stripe-checkout-hardening.test.ts`, 4 tests PASS sous Node 24. CI non vérifiée.
- **Registre A5 des événements (passe 2 du 21/11/2026, CODED, TESTED L1)** : décision du propriétaire, une table Postgres `stripe_webhook_events` dont la clé primaire est l'identifiant d'événement Stripe (`evt_…`), cible Neon via le Vercel Marketplace. Schéma : [`db/stripe-webhook-events.sql`](../db/stripe-webhook-events.sql) ; code : `lib/stripeEventLedger.ts` (pilote `@neondatabase/serverless` 1.2.1, sans dépendance transitive). Pour les trois événements de paiement, la route fait un `INSERT … ON CONFLICT (id) DO NOTHING` : premier passage enregistré puis `200`, nouvelle livraison du même événement reconnue comme doublon puis `200` sans second effet. Colonnes : `id`, `type`, `created`, `livemode`, `object_id` (identifiant `cs_…` de la Checkout Session, suffisant pour la relire chez Stripe) et `received_at`. Aucune donnée de carte, de client ni charge brute n'est stockée ou journalisée.
- **Fail closed conservé** : sans `DATABASE_URL` (variable injectée par l'intégration Neon) ou si l'insertion échoue, la route répond 503 et Stripe réessaie. Tests `unit-tests/stripeEventLedger.test.ts` (5) et `stripe-webhook.test.ts` (refus 503 sans registre) PASS le 21/11 sous Node 24.
- Le Checkout existant n'est pas modifié pour éviter une régression du parcours de paiement en production.

## Backlog
Les gates P0–P2 restant ouverts sont suivis dans la roadmap canonique [quality-roadmap.md](quality-roadmap.md#décision-de-priorité--choisir-la-prochaine-vague) (ligne **A5**).

## Runbook
La route **enregistre** les événements de paiement ; elle n'exécute encore aucune action métier (fulfillment). Le traitement se fera à partir de la table, en relisant la Checkout Session par son `object_id`. Tant que la base n'est pas provisionnée, la route renvoie 503 aux événements de paiement : ne pas enregistrer le webhook dans le Dashboard live avant l'étape 5.

Provisionnement **à faire par le propriétaire** (`NOT_RUN` : l'agent ne crée ni ressource Marketplace, ni compte, n'accepte pas de conditions et ne touche pas aux variables Vercel) :

1. Depuis le checkout lié au projet Vercel (`vercel link` sinon) : `vercel integration add neon` (alias `vercel install neon`), offre gratuite, environnements production et preview. L'intégration crée la base et injecte `DATABASE_URL` dans le projet ; les conditions Neon s'acceptent à cette étape.
2. Créer la table une fois : coller `db/stripe-webhook-events.sql` dans l'éditeur SQL Neon (Vercel → Storage → la base → Open in Neon), ou `vercel env pull .env.local --yes` puis `psql "$DATABASE_URL" -f db/stripe-webhook-events.sql`.
3. Redéployer : une variable ajoutée ne vaut que pour les nouveaux déploiements.
4. Recette en mode test sur une preview : `stripe trigger checkout.session.completed` vers `/api/stripe/webhook`, constater une ligne `livemode = false`, renvoyer le même événement depuis Workbench, constater `200` et toujours une seule ligne.
5. Seulement ensuite, enregistrer l'endpoint live (les trois événements `checkout.session.*`) avec son `STRIPE_WEBHOOK_SECRET`, puis surveiller les livraisons et la file de retries dans Stripe Workbench.

Références : https://docs.stripe.com/webhooks ; https://docs.stripe.com/checkout/fulfillment ; https://docs.stripe.com/keys
