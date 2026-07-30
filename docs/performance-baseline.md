# Baseline de performance frontend

Mesure locale du 30 juillet 2026 avec Next.js 16.3 preview en mode
développement, Chromium et un cache local chaud. Ces valeurs servent à détecter
les régressions entre deux changements ; elles ne remplacent pas un audit
Lighthouse de production avec réseau et CPU simulés.

| Route | TTFB | FCP | LCP | CLS | Hydratation |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 136 ms | 272 ms | 272 ms | 0 | 32 ms |
| `/expertise.html` | 127 ms | 284 ms | 284 ms | 0 | 87 ms |
| `/contact.html` | 140 ms | 328 ms | 328 ms | 0 | 29 ms |
| `/jm` | 125 ms | 376 ms | 376 ms | 0 | 40 ms |
| `/truenas.html` | 230 ms | 412 ms | 412 ms | 0 | 85 ms |

TrueNAS reste la page la plus volumineuse, mais le rendu natif différé de ses
70 petites icônes de services a supprimé les requêtes vers l'optimiseur Next.js,
réduit le HTML d'environ 13 Ko et amélioré le LCP local de 680 à 412 ms. Son
hydratation mesurée est passée de 113 à 85 ms. Les cinq pages restent stables
visuellement (`CLS = 0`). L'INP n'est pas rapporté sans interaction utilisateur
représentative.

## Reproduire la mesure

Lancer le serveur Next.js, puis ouvrir un navigateur avec l'instrumentation
React :

```bash
npm run dev:test -- --port 3000
agent-browser --session perf-baseline --headed --enable react-devtools \
  open http://127.0.0.1:3000/
agent-browser --session perf-baseline vitals \
  http://127.0.0.1:3000/truenas.html --json
```

Toujours comparer des mesures prises avec le même mode Next.js, le même cache,
le même navigateur et la même machine. Pour valider une livraison, compléter
avec Lighthouse sur le build de production et les métriques Vercel réelles.

## Audit Lighthouse du build de production

Un second relevé a été exécuté sur le build de production local, avec le profil
mobile par défaut de Lighthouse. Les scores fonctionnels sont stables ; les
durées restent sensibles à la charge de la machine locale.

| Route | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 83 | 100 | 100 | 92* | 2,14 s | 4,39 s | 66 ms | 0 |
| `/truenas.html` | 71–94 | 100 | 100 | 100 | 2,08–3,62 s | 2,74–4,82 s | 35–135 ms | 0 |

L'écart de performance TrueNAS entre deux exécutions consécutives illustre la
variabilité d'un audit local. Les deux passages restent sans erreur console et
avec un `CLS` nul. Le score SEO de 92 sur l'accueil vient du contrôle de
l'origine canonique effectué sur `localhost` ; le HTML de production contient
bien la canonical `https://albanandrieu.com/`.

Le mode analytique léger par défaut a eu l'effet le plus important sur
l'accueil : performance de 57 à 83, JavaScript tiers transféré d'environ
591 Ko à 30 Ko et JavaScript inutilisé d'environ 372 Ko à 53 Ko. Les intégrations
marketing lourdes restent disponibles en opt-in via
`NEXT_PUBLIC_ANALYTICS_MODE`.
