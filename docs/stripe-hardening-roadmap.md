# Durcissement Stripe Checkout — 21 octobre 2026

## Implémenté dans cette branche
- Endpoint `POST /api/stripe/webhook` : corps brut, validation cryptographique de `Stripe-Signature`, borne de 64 KiB, contrôle strict de `Content-Length` et `Content-Type`, aucune donnée personnelle dans les logs.
- Tests synthétiques `unit-tests/stripe-webhook.test.ts` : signature absente/altérée, événements non financiers, refus de trois événements de paiement et validations HTTP. **Tests ajoutés, exécution locale et CI non vérifiées.**
- **Fail closed** : aucun événement de paiement n'est acquitté tant que la persistance et le traitement idempotent ne sont pas opérationnels. Stripe réessaiera les événements répondant 503.
- Le Checkout existant n'est pas modifié pour éviter une régression du parcours de paiement en production.

## Backlog
Les gates P0–P2 restant ouverts sont suivis dans la roadmap canonique [quality-roadmap.md](quality-roadmap.md#stripe-checkout--sécurisation-en-cours-21-octobre-2026).

## Runbook
La nouvelle route **n'est pas une intégration de fulfillment achevée** : elle renvoie 503 aux événements de paiement pour éviter toute perte silencieuse. Ne pas enregistrer le webhook dans le Dashboard live avant le raccordement à une persistance. Une fois connecté, surveiller les tentatives de livraison et la file de retries dans Stripe Workbench.

Références : https://docs.stripe.com/webhooks ; https://docs.stripe.com/checkout/fulfillment ; https://docs.stripe.com/keys
