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
côté Site. `X-Nabla-Trace-Propagation: sent` prouve l'envoi du header
vers FastAPI, non sa présence dans les traces FastAPI. Confronter ensuite
l'identifiant aux logs de la route `/api/site/health/v2`.

Noter la date, le SHA `/api/deployment`, le réseau réel, et le verdict.
