# Durcissement Stripe Checkout — 21 octobre 2026

## Implémenté dans cette branche
- Endpoint `POST /api/stripe/webhook` : corps brut, validation cryptographique de `Stripe-Signature`, borne de 64 KiB, contrôle strict de `Content-Length` et `Content-Type`, aucune donnée personnelle dans les logs.
- Tests synthétiques `unit-tests/stripe-webhook.test.ts` : signature absente/altérée, événements non financiers, refus de trois événements de paiement et validations HTTP. **Tests ajoutés, exécution locale et CI non vérifiées.**
- **Fail closed** : aucun événement de paiement n'est acquitté tant que la persistance et le traitement idempotent ne sont pas opérationnels. Stripe réessaiera les événements répondant 503.
- Le Checkout existant n'est pas modifié pour éviter une régression du parcours de paiement en production.

## P0 — Obligatoire avant activation du webhook en production
- [ ] Implémenter une base durable transactionnelle pour les `event.id` Stripe, l'identifiant de session, l'état métier et l'état de traitement. Dédupliquer sur `event.id` et protéger les traitements métier de doubles exécutions sur `session.id`.
- [ ] Traiter `checkout.session.completed` uniquement si `payment_status=paid`, `checkout.session.async_payment_succeeded` et `checkout.session.async_payment_failed`. Accuser réception uniquement après enregistrement durable ou traitement idempotent ; répondre 5xx si stockage indisponible.
- [ ] Configurer l'endpoint Stripe dans un **sandbox distinct** avec `STRIPE_WEBHOOK_SECRET` sensible dans Vercel, puis valider signature incorrecte, absence de secret, doublon, désordre des événements, paiement différé, et retry Stripe.
- [ ] Vérifier les prix et autorisations côté serveur, l'état des paiements, les remboursements, et confirmer le modèle d'exécution métier avec Stripe.
- [ ] Tester l'ensemble via `just quality` / `justfile` puis Preview exact-SHA, sans CI payante automatique. Ne pas déclarer PASS tant que non exécuté.

## P1 — Sécurité et exploitation
- [ ] Remplacer `STRIPE_SECRET_KEY` / `STRIPE_KEY` par une clé Stripe restreinte `rk_` spécifique par environnement avec accès minimal ; rotation et contrôle des secrets Vercel.
- [ ] Limiter les créations de Checkout Sessions via un stockage distribué partagé (échec fermé, 429 + Retry-After).
- [ ] Éviter la journalisation brute des erreurs Stripe ; télémétrie OpenTelemetry/PostHog sans clé, PII ni payload.
- [ ] Revoir `DOMAIN` et `VERCEL_URL` : autoriser strictement HTTPS en production, origine approuvée et pas de redirect arbitraire.
- [ ] Mettre à jour Stripe SDK/lockfile de façon atomique et valider les changements de compatibilité API.

## P2 — Simplification
- [ ] Vérifier les consommateurs avant de retirer `server.cjs`, `public/create-checkout-session.js` et les routes historiques.
- [ ] Consolider la documentation Stripe, vérifier CSP Stripe.js et tests E2E FR/EN.
- [ ] Examiner la conformité TVA / Stripe Tax **après** confirmation des immatriculations fiscales applicables. Ne pas activer `automatic_tax` aveuglément.

## Runbook
La nouvelle route **n'est pas une intégration de fulfillment achevée** : elle renvoie 503 aux événements de paiement pour éviter toute perte silencieuse. Ne pas enregistrer le webhook dans le Dashboard live avant le raccordement à une persistance. Une fois connecté, surveiller les tentatives de livraison et la file de retries dans Stripe Workbench.

Références : https://docs.stripe.com/webhooks ; https://docs.stripe.com/checkout/fulfillment ; https://docs.stripe.com/keys
