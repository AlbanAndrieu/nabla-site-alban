### Déploiement propriétaire et accès depuis le domicile — 20 octobre 2026

**État vérifié le 20 octobre :** la PR #238 est fusionnée. La production
Vercel READY sert `master` au commit `6b051516220b7bf905e80eae26d8ea83b910897f`
(#239 inclus). Les cartes et React Flow existent dans ce build mais restent
masqués lorsque `/api/homelab-access` répond `trusted:false`.
Cause du refus **non établie** : ne pas conclure que la valeur Vercel est vide,
car les variables de type `sensitive` sont systématiquement masquées par l'API.
Un visiteur du domicile peut être vu en IPv6 alors que la liste autorise
uniquement `82.66.4.247/32`.

**Diagnostic sécurisé à réaliser sur un build contenant ce correctif :**
ouvrir `/api/homelab-access?diagnose=1` depuis le même appareil et la même
connexion que la page TrueNAS. La réponse indique `sourceFamily`,
`trustedCidrsConfigured`, `networkAllowed`, `identityRequired` et
`reason`, **sans révéler l'IP cliente**, le CIDR configuré, les tokens,
le catalogue ni les ports homelab. `client-ip-outside-trusted-cidrs` avec
`sourceFamily=ipv6` signale une sortie IPv6 à qualifier séparément :
ne pas élargir la règle à un /0, ne pas ajouter de préfixe non vérifié.
`runtime-unverified` et `trusted-cidrs-not-configured` nécessitent une
correction de configuration. Les routes sensibles gardent leur refus 404 et
leurs politiques no-store.

**Recette après fusion approuvée :** depuis le domicile tester
`/api/homelab-access` (seulement `{"trusted":true}`), puis les cartes
et le graphique depuis `/fr/truenas`, le deep link historique
`#service-postgresql` et le lien canonique
`#homelab-service-postgresql`. Depuis un réseau externe, vérifier le
refus neutre de toutes les API owner. Vérifier aussi que le navigateur
n'est pas connecté par VPN, proxy ou IPv6 de sortie non autorisé.
L'authentification Access reste nécessaire si configurée. L'IP seule
n'est pas une preuve d'identité individuelle.

---

## PR #238 — contrôle CIDR des vues homelab (20 octobre 2026)

Sur la plateforme Vercel, déclarer la variable **serveur uniquement** :
`HOMELAB_TRUSTED_CIDRS=82.66.4.247/32`. Cette valeur correspond à
l'adresse IPv4 publique fixe du domicile, et ne doit jamais être exposée
comme variable `NEXT_PUBLIC_*` ou utilisée pour des décisions côté React.

Chaque API privée `/api/homelab-*` et `/api/runtime-topology` exige une IP
source dans cette allowlist, d'après `x-real-ip` réécrit par le proxy Vercel
(`VERCEL=1`), avant d'appeler l'amont. La réponse refusée reste un
`404` neutre avec `Cache-Control: private, no-store`.
Une signature Cloudflare Access, même valide, **ne contourne jamais** le CIDR.
Lorsque `CF_ACCESS_TEAM_DOMAIN` et `CF_ACCESS_AUD` sont configurés,
la validation du JWT devient un **second facteur obligatoire** ; sinon le
contrôle IP seul autorise l'accès depuis le domicile. Une IP autorisée ne
constitue toutefois pas une identité forte, car tous les équipements derrière
le même NAT public la partagent. Pour une confidentialité renforcée, préférer
l'application opérateur `ops.albandrieu.com` derrière Access + MFA.

Ce contrôle s'applique aux **requêtes serveur**, pas aux assets JS statiques,
dont les URL restent publiques. Les données sensibles doivent donc être
absentes du bundle public et transmises uniquement par les APIs protégées.
Contrôler aussi IPv6 : ne pas ajouter de préfixe IPv6 sans besoin vérifié.
La variable devra être renseignée dans la configuration Vercel et validée
sur un déploiement Preview depuis la maison puis un réseau externe.
Un succès unitaire n'est pas une preuve de configuration runtime Vercel.

---

# Frontière de confidentialité du homelab — Site Alban

Statut : **architecture/roadmap approuvable, non déployée** (18 octobre 2026).
Épopée : [Site Alban #233](https://github.com/AlbanAndrieu/nabla-site-alban/issues/233).
Coordination : [FastAPI #352](https://github.com/AlbanAndrieu/fastapi-sample/issues/352) · [Nabla Compose #262](https://github.com/AlbanAndrieu/nabla-compose/issues/262).

## Décision de conception

`/fr/truenas` et `/en/truenas` restent des **pages publiques de démonstration**, sans métriques brutes,
ports, IP ou inventaire administrable. L'espace opérateur passe à **`https://ops.albandrieu.com`**, sur hostname
distinct derrière Cloudflare Access, Tunnel et une API FastAPI TrueNAS à autorisation **en profondeur**.
L'identité Cloudflare/GitHub (avec MFA vérifié) est la première étape ; Keycloak OIDC est facultatif ensuite.
Ne pas placer Cloudflare comme nouveau reverse proxy global du site Vercel ni sécuriser par simple CSS/React.

## Inventaire de risque (constats de code, PAS une preuve live)

| Source | Comportement actuel | Remédiation prioritaire |
| --- | --- | --- |
| `public/homelab-services.json` | Fallback **public** avec champs `internalHost`, `internalPort`, `tunnelUrl`, notes | Retirer le détail sensible du répertoire public et des paquets de build |
| `public/service-topology.json` | Topologie locale sérialisée sous `public/` | Publier seulement une projection strictement assainie |
| `config/homelab-navigation-overrides.json` | Navigation contenant des endpoints administratifs possibles | Classification, jamais sérialiser les endpoints privés dans le client |
| `/api/homelab-services`, `/api/homelab-topology` | Renvoyés par des routes Next.js sans vérification d'identité | DTO publics **allowlist**, sans fallback détaillé |
| `/api/homelab-health`, `/api/homelab-status`, `/api/homelab-probes` | État technique, certaines réponses mises en cache publiquement et en-têtes `X-Homelab-*-Primary` | Résumé public minimal ou 404; jamais publier preuves/provenance |
| `/api/homelab-observability`, `/api/homelab-diagnostics`, `/api/runtime-topology` | Diagnostics et topologie runtime riches, sans vérification d'identité dans les routes | Retirer de la surface publique; ne pas créer de proxy secret ouvert |
| `/fr/truenas`, `/en/truenas`, `/architecture`, `/nabla` | Consommateurs UI et éventuels diagrammes avec informations intégrées | Scanner SSR, HTML, JS, JSON, source maps et traductions EN/FR |

L'URL de production n'a pas pu être ouverte dans cette session ; vérifier toutes les réponses et caches
sur le déploiement réel **sans recopier les données privées dans des logs publics**.

## Contrat d'exposition

**PUBLIC** : projet, technologies de catégorie, visuels non sensibles, description, statuts globaux
facultatifs à faible granularité et éventuellement différés. Construire un DTO explicite
`public-homelab/v1`; **allowlist** de clés et validation du schéma, pas de suppression
dynamique d'une liste de champs interdits sur une réponse complète.

**OWNER** : topology interne, relations observées, host/port, sondes, métriques, health boards,
latences, criticalités, preuves, logs/audit. Doit rester derrière Access sur le **hostname privé**,
autorisé à l'origine, avec `Cache-Control: private, no-store`.

**INTERDIT dans tout contenu public**, y compris headers d'erreur, RSC payloads, fichiers statiques,
sitemaps, OpenGraph, scripts, SSE et previews : adresses RFC1918, noms DNS internes, numéros
de ports d'administration, URL d'origine, chemins internes de déploiement, endpoints Prometheus,
exposition/contrôle Access, jetons, identifiants de sondes et preuves techniques.

## Ordre d'exécution

- **P0 inventaire/snapshot** : scanner toutes les pages et API publiques (GET/HEAD, FR/EN, previews
      Vercel), assets `public/`, source maps et caches; consigner uniquement nom du fichier,
      catégorie, champs détectés et nombre de violations, sans valeurs sensibles. Baseline `NOT_RUN`
      tant que le déploiement réel n'est pas consulté.
- **P0 containment frontend** : supprimer les exports techniques sous `public/`, retirer les
      références/fallbacks riches de `lib/homelabServices.ts` et `lib/serviceTopology.ts` (en tenant
      compte du cutover v2 déjà prévu), assainir les routes/API exposées; préférer une indisponibilité
      publique temporaire à un fallback indiscret. Garder les routes publiques stables seulement si leur
      réponse est validée par le DTO public; sinon 404/503 neutre.
- **P0 non-régression** : tests Node de propriétés (clés autorisées uniquement), probes récursifs
      de champs et formats (IPv4 privées, ports, URL internes, labels de télémétrie), variations
      d'en-têtes, erreurs, mode degraded et local fallback. Ne jamais confondre masquage visuel
      et contrôle d'accès.
- **P1 adaptation UI** : remplacer `HomelabServicesBlock`/les détails opérateur par une carte
      vitrine sûre et un lien explicite vers l'espace privé, sans appel navigateur aux APIs privées.
      Conserver responsive/a11y/EN-FR et route `/truenas` indexable; `ops.albandrieu.com` n'est pas indexable.
- **P1 validation croisée** : FastAPI livre la projection et la fermeture des routes riches
      (issue #352), Compose livre Access/Tunnel (issue #262), puis recette E2E anonyme/autorisé/refusé.
- **P1 publication** : purge/invalidations des anciens caches Cloudflare/Vercel et dérivés
      statiques après déploiement; re-scan www, apex, redirections, versions locales et previews.
      Le git history reste public : vérifier si des secrets **réellement** exposés nécessitent rotation.
- **P2 catalogue** : auditer les pages `architecture`, `security`, `nabla`, pages générées,
      export PDF/JSON et métadonnées. Aucun nouveau composant ne doit accepter un DTO propriétaire
      sur une page publique.

## Contrats de recette

1. Utilisateur anonyme : public `/truenas` 200 mais aucun champ privé dans HTML/JS/API;
   `ops` et toutes les API opérateur refusent (Access peut répondre 302 vers login ou 403);
   aucun bypass `www`, apex, preview, URL directe ni ancienne route.
2. Utilisateur propriétaire authentifié : `ops` 200, identité vérifiée **côté FastAPI**, métriques
   en lecture seule, aucune clé dans le JS; fuite de jeton, provenance ou détail interne interdite
   dans en-têtes/réponses publics.
3. Mauvais jeton, audience, issuer, subject, expiration, Service Token mal scindé : rejet.
4. Panne TrueNAS, Cloudflare ou FastAPI : affichage public neutre, aucune dégradation vers
   l'inventaire complet; logs redigés et pas de snapshot privé mis en cache partagé.
5. CI SAST, BetterLeaks, Playwright/axe et ZAP **maintenues**; pas de merge automatique.

## Références

- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/
- https://owasp.github.io/API-Security/editions/2023/fr/0xa3-broken-object-property-level-authorization/
- https://vercel.com/kb/guide/cloudflare-with-vercel

## Destination opérateur retenue : `https://ops.albandrieu.com`

**Décision ferme du 18 octobre 2026** : l'UI propriétaire est hébergée
**hors du domaine Vercel public**, derrière Cloudflare Access. Le nom est
réservé par les roadmaps, mais aucun DNS/Access/Tunnel n'est actuellement
créé/validé par ce chantier.

### Expérience publique et privée

- Sur `/fr/truenas` et `/en/truenas`, ne garder que la description du
  projet, les catégories technologiques et une disponibilité **agrégée**
  facultative. Les informations plus fines sont supprimées des réponses
  serveur et des assets et **pas simplement masquées** via CSS ou détails
  fermés par défaut.
- Le lien `Espace privé` / `Private operations` cible le **FQDN complet**
  `https://ops.albandrieu.com`. Ce lien ne contient ni jeton, ni email,
  ni URL de redirection interne et ne déverrouille aucun fetch du site public.
- Le login, le session cookie, les APIs riches et les retours d'erreur
  appartiennent à `ops`, **pas** à `www.albanandrieu.com`. Le site ne
  doit pas proxyfier un Service Token ou exposer un bearer dans `NEXT_PUBLIC_*`.
- Lorsqu'Access ou TrueNAS est indisponible, le lien peut mener à un
  service non disponible; le site reste publié avec données **neutres** et
  ne tente pas un fallback en clair vers FastAPI Cloud.

### Séquence de migration sans fuite résiduelle

1. **P0 maintenant** : assainir les JSON `public/` et les APIs Next.js
   exposées (incluant `/api/homelab-observability` et `/api/runtime-topology`).
   Inventorier `/fr/architecture`, `/en/architecture`, pages Nabla et
   documents statiques contenant de la télémétrie technique.
2. **P0 anti-régression** : tests whitelist de schéma public strict,
   cas `fastapi down`, cache stale, JSON fallback, RSC/SSR, headers
   `X-*-Primary`, images/OG et traces. Toute fuite fait échouer les gates.
3. **P1 fonctionnalité** : intégrer la nouvelle projection
   `/api/public-homelab/v1` de FastAPI, puis le lien vers
   `https://ops.albandrieu.com` (pas de secret/identité dans l'URL).
4. **P1 E2E** : navigateur anonyme (vitrine visible, APIs privées
   inaccessibles), utilisateur non autorisé (403), propriétaire authentifié
   (dashboard op read-only), HTTP caches et previews Vercel contrôlés.
5. **P1 publication** : confirmer purge d'anciennes versions de fichiers
   statiques/JS et d'anciens caches; informer que Git history est déjà
   publique et ne peut pas être traité comme une source de confidentialité.

### Contrat d'intégration avec les deux autres dépôts

- `fastapi-sample` — [PR #353](https://github.com/AlbanAndrieu/fastapi-sample/pull/353)
  : DTO public, API `/private/ops/api/v1/*`, JWT Access à l'origine.
- `nabla-compose` — [PR #263](https://github.com/AlbanAndrieu/nabla-compose/pull/263)
  : tunnel/Access `ops.albandrieu.com`, MFA, politique default-deny,
  origine privée, Terraform/OpenTofu import-first.
- `nabla-site-alban` — [PR #234](https://github.com/AlbanAndrieu/nabla-site-alban/pull/234)
  : assainissement de toutes les réponses publiques et migration UI.

Tous les tests d'intégration sur site réel restent `NOT_RUN` jusqu'à
l'installation de l'infrastructure, sans demande de commande sur la
workstation ou le TrueNAS de l'utilisateur.

## Accès propriétaire sur `www` (amendement du 20 octobre 2026)

**Décision du propriétaire** : la vue Architecture, `HomelabServicesBlock`,
l'explorateur, l'inspecteur d'impact, le flux réseau, `HomelabOperationsDisclosure`
et `CloudflareStatusWarning` sont **conservés** sur `www.albanandrieu.com`, mais
servis **uniquement** au propriétaire. Ce point amende « ne garder que la
description » ci-dessus ; `ops.albandrieu.com` reste la cible à terme.

Contrôle d'accès **côté serveur** (`lib/homelabAccess.ts`), sans état ni cookie :

1. **Réseau du propriétaire** : `x-real-ip` posé par l'edge Vercel, lu
   seulement si `VERCEL=1`, comparé à `HOMELAB_TRUSTED_CIDRS` (IPv4/IPv6,
   liste séparée par virgules/espaces ; `/0` et entrées invalides ignorés).
   Vercel voit l'**IP publique de sortie NAT**, pas l'IP du VLAN : tout
   appareil derrière cette IP (Wi-Fi invité compris) est considéré
   propriétaire. Une IP résidentielle dynamique change : mettre à jour la
   variable, sinon l'accès retombe en 404 (échec fermé).
2. **Cloudflare Access** : en-tête `Cf-Access-Jwt-Assertion` vérifié en RS256
   avec la JWKS `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`
   (cache 1 h), contrôles `iss`, `aud`, `exp`, `nbf` (tolérance 60 s).
   Variables : `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`. Inerte tant que le
   trafic `www` ne transite pas par une application Access ; un en-tête forgé
   est rejeté.

Sans variable configurée, **tout est refusé**. Les variables se définissent
dans Vercel (Production et, si voulu, Preview) ; aucune n'est `NEXT_PUBLIC_*`.

Côté pages : `/api/homelab-access` (no-store) répond `{ trusted }` ; si vrai,
les vues sont chargées par `next/dynamic` (`ssr: false`) et lisent leurs
données sur les routes protégées. Le graphe réseau (adresses, ports, IP WAN)
n'est plus intégré au JS : il vient de `/api/homelab-network-flow`.

Limites connues :

- Les chunks JS des composants restent téléchargeables publiquement : ils ne
  contiennent que du code de présentation, pas de données opérationnelles.
  Le test `publicHomelabPrivacy.test.mjs` interdit à tout module client
  d'importer `homelabNetworkFlowNodes`/`homelabNetworkFlowEdges`.
- Recette live `NOT_RUN` : vérifier sur la production, depuis le réseau
  domestique puis depuis un réseau mobile, que les vues apparaissent puis
  disparaissent et que `/api/homelab-services` répond 404 hors réseau.
