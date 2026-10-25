# Validation OWNER / SERVICE — LAN et hors LAN

Recette navigateur réelle, sans simulation d'IP ni de droits. Utiliser
un checkout avec Node 24/npm 12, `npm ci`, Chromium Playwright :
`npx playwright install chromium`.

## Depuis le LAN

```bash
BASE_URL=https://www.albanandrieu.com HOMELAB_AUDIT_EXPECT=owner npm run audit:homelab
```

## Depuis un réseau extérieur sans VPN/LAN

Si `HOMELAB_PUBLIC_READONLY_ENABLED=true` :
```bash
BASE_URL=https://www.albanandrieu.com HOMELAB_AUDIT_EXPECT=service npm run audit:homelab
```

Si le mode SERVICE public est désactivé :
```bash
BASE_URL=https://www.albanandrieu.com HOMELAB_AUDIT_EXPECT=denied npm run audit:homelab
```

Avec Cloudflare Access, fournir éventuellement
`HOMELAB_AUDIT_ACCESS_JWT` dans le shell. Ne jamais placer la valeur
dans Git ou dans les rapports. La recette démarre un profil navigateur
éphémère, vérifie les routes OWNER, le mode SERVICE, les pages FR/EN,
le stockage `localStorage`, `sessionStorage`, les noms IndexedDB et
CacheStorage. Elle ne publie pas de capture, HAR ou secrets.

Deux exécutions depuis deux réseaux réels sont nécessaires. La commande
ne change pas les en-têtes IP et ne simule pas le LAN.
Un HTTP 503 OWNER signifie que le collecteur peut être indisponible,
pas nécessairement que l'authentification est refusée.

Le header `X-Nabla-Trace-ID` de `/api/homelab-health-v2` est généré
côté Site. `X-Nabla-Trace-Propagation: sent` signifie transmission
non confirmée ; `confirmed` impose une réponse FastAPI portant le même ID. Confronter ensuite
l'identifiant aux logs de la route `/api/site/health/v2`.

Noter la date, le SHA `/api/deployment`, le réseau réel, et le verdict.

## Portée et sécurité supplémentaires

- Le JWT Access optionnel est injecté uniquement sur l'origine HTTPS auditée. Playwright ne suit pas les redirections avec le jeton. Les ressources tierces le reçoivent sans cet en-tête.
- Les données de stockage sont lues uniquement pour les clés opérationnelles et ne sont jamais imprimées. IndexedDB et CacheStorage sont contrôlés par noms/URLs, sans lecture complète des données.
- Le navigateur démarre avec un profil vierge. Les recettes LAN et WAN **ne prouvent pas** la purge des données lors d'un changement de réseau dans un profil OWNER encore ouvert. Valider cette transition séparément dans un même profil réel.
- `X-Nabla-Trace-Propagation: confirmed` exige un écho exact de FastAPI. `sent` signifie transmission sans confirmation. Le script ne considère aucun écho absent comme validé.
- La confirmation suppose le déploiement préalable du correctif FastAPI (branche `feat/site-v2-trace-receipt-20261025`). Ne pas publier en production sans validation.

## HTTP 429 au précontrôle

Le code 429 est un obstacle de transport/limitation. Il ne prouve pas un refus
OWNER. Le script doit s'arrêter immédiatement sans lancer les cinq routes
privées ni interpréter `trusted=false`. Le code de sortie **4** signifie
`BLOCKED/UNVERIFIED`, distinct d'une assertion fonctionnelle en échec (1).

Le rapport ne doit afficher que `Retry-After` en secondes, `X-Vercel-Id`
et `CF-Ray`, lorsque présents et valides. Aucun JWT, cookie, corps 429, IP
cliente, clé diagnostics ou en-tête arbitraire ne doit être recopié.

Depuis le LAN, faire **une seule requête** pour relever les en-têtes :
```bash
curl -sS -D - -o /dev/null --max-time 15 \
  'https://www.albanandrieu.com/api/homelab-access?diagnose=1' \
  | grep -Ei '^(HTTP/|retry-after:|x-vercel-id:|cf-ray:|server:|x-vercel-mitigated:)'
```
L'en-tête `Server` ou la présence d'un identifiant edge est un indice,
pas une preuve de la couche qui a appliqué le quota. Respecter
`Retry-After` ; ne pas déclencher de nouvelle rafale en cas de 429.

Comparer aux événements Vercel dans la fenêtre temporelle correspondante ;
si aucun runtime n'a exécuté la route, rechercher une décision edge
(Vercel/Cloudflare/proxy) avant tout changement FastAPI.

FastAPI Cloud peut fournir des preuves indépendantes via
`GET https://fastapi-sample.fastapicloud.dev/healthz` ou les endpoints
authentifiés du catalogue. Une réponse FastAPI ne peut **pas** établir
l'identité réseau OWNER vue par Vercel ; ne jamais injecter de
`X-Forwarded-For` ni de faux `X-Real-IP`.

Sans réseau WAN alternatif, marquer S-04 `NOT_RUN` et exécuter seulement
S-03 depuis le LAN réel.

### Observation croisée sans navigateur ni deuxième réseau

Une commande à faible volume effectue exactement **deux GET**, sans retry :
```bash
npm run diagnose:homelab-429
```
Elle interroge depuis la machine actuelle :
- Site `/api/homelab-access?diagnose=1` (origine `BASE_URL`) ;
- FastAPI Cloud `/healthz` (liveness de FastAPI uniquement).

Chaque ligne ne contient que le code HTTP et les métadonnées `Retry-After`,
`X-Vercel-Id`, `CF-Ray` filtrées. Un JWT Access optionnel n'est
transmis qu'à l'origine du Site. Aucun corps, cookie, jeton ou en-tête IP
forgé n'est enregistré. Si Site renvoie 429, sortie 4. Le fonctionnement
de FastAPI Cloud ne prouve pas l'autorisation OWNER dans Next.js.
