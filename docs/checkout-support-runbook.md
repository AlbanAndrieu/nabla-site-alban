# Checkout et support Stripe

## Implémentation principale

Le formulaire de `app/[locale]/checkout/page.tsx` envoie un `POST` à
`/api/create-checkout-session`. Le Route Handler
`app/api/create-checkout-session/route.ts` crée une Checkout Session Stripe et
répond par une redirection `303`, ou par du JSON si le client demande
`application/json`.

Routes de retour :

- `/{locale}/success?session_id={CHECKOUT_SESSION_ID}` ;
- `/{locale}/cancel`.

La locale acceptée est `en` ou `fr`; toute autre valeur retombe sur `en`.

## Embedded Checkout

`app/components/checkout.tsx` et `app/actions/stripe.ts` constituent une seconde
surface native : le Server Action crée une session avec `ui_mode: "embedded"`
et renvoie son `client_secret`. Cette surface utilise un petit catalogue local
et n’est pas le formulaire principal de `/checkout`.

## Stripe Buy Button

`app/[locale]/checkout-tjm/page.tsx` intègre un Stripe Buy Button et un QR code.
La clé `pk_` est publiable et peut être exposée au navigateur. Une clé secrète
`sk_` ou restreinte `rk_` ne doit jamais apparaître dans le code client.

## Variables d’environnement

| Variable | Usage |
| --- | --- |
| `STRIPE_SECRET_KEY` ou `STRIPE_KEY` | API Stripe côté serveur |
| `STRIPE_PRICE_ID` ou `PRICE_ID` | prix du Checkout hébergé |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Embedded Checkout navigateur |
| `DOMAIN` | origine de confiance des URLs de retour |
| `VERCEL_URL` | fallback fourni par Vercel |

Préférer une clé Stripe restreinte avec les permissions minimales lorsque le
cas d’usage le permet. Les environnements test et production doivent utiliser
des clés différentes.

## Test local

```bash
npm run dev
```

Tester `/checkout`, `/fr/checkout`, `/checkout-tjm` et `/fr/checkout-tjm` avec
les cartes de test Stripe. En production, vérifier aussi que `DOMAIN` correspond
exactement à l’origine publique.

## Chemins historiques

`public/checkout.html`, `api/create-checkout-session.js` et `server.cjs` sont
encore présents pour compatibilité. Ils ne doivent pas être étendus : toute
nouvelle fonctionnalité doit cibler le Route Handler App Router.

## Diagnostic

- `Missing STRIPE_SECRET_KEY` : clé serveur absente.
- `Missing STRIPE_PRICE_ID` : Price ID absent ou incorrect.
- `No such price` : mélange test/live entre clé et Price ID.
- `Invalid DOMAIN` : fournir une origine HTTP(S), sans chemin ni credentials.
- retour dans la mauvaise langue : vérifier le champ `locale` envoyé au POST.
