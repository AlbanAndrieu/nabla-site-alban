# Site Alban — diagnostic de bout en bout et frontière d'accès

**Document canonique Site** pour les erreurs du catalogue et leur rendu.
Pour les sondes, voir [FastAPI : diagnostic provenance](https://github.com/AlbanAndrieu/fastapi-sample/blob/master/docs/diagnostic-provenance-contract.md).
Pour le réseau et l'éventuelle gateway, voir la [feuille de choix Compose](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/api-gateway-selection.md).
Les trois roadmaps conservent **une seule tâche active par dépôt**.

## Modèle de confiance

Les rôles `PUBLIC`, `SERVICE`, `OWNER`, `INTERNAL` décrivent **la réponse autorisée**,
pas un groupe déduit d'un en-tête navigateur. Le serveur valide l'identité et la
provenance réseau. Le Vercel Edge normalise l'IP ; `X-Forwarded-For` client ne confère aucun droit.
Le JWT Cloudflare Access doit être vérifié (signature, issuer, audience, expiration et acteur).
L'absence de Keycloak et d'API gateway n'autorise aucun raccourci.

| Contexte vérifié | Données disponibles |
| --- | --- |
| Anonyme hors LAN | catalogue SERVICE expurgé, statuts `unknown` si cache ancien |
| Machine autorisée | projection SERVICE v2 sans URL interne ni secrets |
| OWNER LAN et identité admise par la politique en vigueur | sondes détaillées et erreurs de provenance |
| OWNER hors LAN avec JWT Access vérifié, politique explicitement autorisée | uniquement les opérations OWNER autorisées |
| Cloudflare edge 302/401/403 | état du contrôle d'accès, **pas** état de TrueNAS |
| Collecteur interne | preuves détaillées sous authentification de workload |

`trusted: true` dans `/api/homelab-access` sert à la présentation.
Chaque endpoint privé applique lui-même `gatedHomelabResponse`.

## Diagnostic catalogue : responsabilités

1. Compose génère la référence Backstage + `catalogRevision`.
2. FastAPI télécharge et vérifie le digest ; classe timeout, HTTP, auth et schéma.
3. Next.js récupère le catalogue côté serveur ; transmet **uniquement** un code
   allowlist de phase, jamais l'erreur d'origine ou l'URL.
4. Le navigateur OWNER peut montrer `stage` + `requestId` émis par Next.js.
5. Un visiteur PUBLIC ne reçoit aucune preuve interne.
6. Les cartes affichent séparément les sondes FastAPI TrueNAS et la santé du catalogue.

Le `requestId` actuellement généré par Next.js sur un 503 identifie **l'erreur Site**.
Il ne doit pas être présenté comme un ID de trace distribué. P1 : implémenter
`traceparent`/OpenTelemetry et une corrélation au niveau des frontières de confiance,
puis enregistrer les mêmes IDs dans les deux journaux expurgés.

Codes du premier incrément : `site_configuration`, `upstream_auth`,
`upstream_http`, `upstream_network`, `upstream_timeout`,
`catalog_validation`, `unknown`.
Tout en-tête inconnu est ramené à `upstream_http`.

## Refactoring et runbooks

- **Site** : isoler les adaptateurs FastAPI des composants React ; partager
  la classification des erreurs et la validation de catalogue ; garder
  un seul mapping d'icônes et un seul index `entityRef`.
- **API** : la politique d'autorisation et les DTO public/OWNER doivent
  précéder tout rendu ; FastAPI est le seul propriétaire des états de sondes.
- **Compose** : catalogue, mapping et exposition des routes restent
  déclaratifs et contrôlés. Ni Next ni FastAPI ne gèrent le routage Traefik.
- Les runbooks opérateur doivent décrire **une étape par action** et se
  référer ici pour les codes d'erreur ; les rapports d'incident datés restent
  archivés comme preuves, non comme procédures actuelles.

## Tests d'acceptation P0 / P1

- Provoquer un digest invalide avec une fixture : `catalog_validation`,
  sans attribuer de panne TrueNAS.
- Provoquer une erreur FastAPI 503 : code de stage conforme et expurgé.
- Provoquer un vrai timeout : `upstream_timeout`, non `fail` de service.
- Vérifier le retour HTTP, le `requestId` et `Cache-Control: private, no-store`
  sans JWT, IP privée, URL amont ni exception dans le corps.
- Vérifier SERVICE public, OWNER LAN, Access JWT hors LAN, JWT forgé,
  défaut de source IP et révocation. Tester aussi navigation clavier et
  nettoyage du cache `localStorage`.
- Exiger Playwright/Node 24 et le HEAD exact avant de considérer une Preview
  comme validation fonctionnelle.

## Première présentation OWNER

Les deux routes catalogue utilisent le même constructeur de 503 et le même
`X-Nabla-Request-ID` de support. La grille TrueNAS affiche le stage et l'ID
**uniquement en mode OWNER** après un refus ou un échec de collecte.
Le mode SERVICE ignore ces métadonnées et ne les stocke pas dans le cache
public. Le renouvellement du catalogue supprime l'incident de l'état React.
L'identifiant appartient encore au Site, pas à une trace FastAPI distribuée.

## Harmonisation Architecture / TrueNAS (P0)

Les cartes TrueNAS et le panneau Architecture utilisent le même
`catalogFailureReason` et le même validateur `parseOwnerCatalogIncident`.
Seule une décision `access === "trusted"` autorise l'affichage du stage et
de l'UUID de support. Le mode `readonly` n'enregistre ni n'affiche l'incident.
L'interface informe sur la cause catalogue, **pas** sur la santé de TrueNAS.
Le panneau Réessayer ne contacte que le catalogue, sans déclencher de sondes
LAN supplémentaires. Les tests navigateur et les droits restent à prouver en Preview.

### Corrections de frontière de sécurité HTTP (P0)

Le mode temporaire `HOMELAB_PUBLIC_READONLY_ENABLED` peut autoriser
`/api/homelab-services` et `/api/homelab-catalog-v2` sans identité OWNER.
**Même en erreur**, le serveur revalide `isTrustedHomelabRequest(request)`.
La réponse publique 503 se limite à
`{ "error": "...", "reason": "unavailable" }`, sans en-tête de phase,
UUID, cause FastAPI, configuration clé ou identité. OWNER validé conserve
la phase et la référence. Un contrôle d'affichage dans React n'est jamais
une mesure suffisante de confidentialité.

## Rendu C4 et séparation des responsabilités

L'ADR/RACI demeure dans [Compose](https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/architecture-governance.md), pas dans le frontend. Le composant `C4ArchitectureView` de la page Architecture utilise `@xyflow/react` et la topologie v2 déjà fournie par FastAPI. La vue L1 est **conceptuelle** ; la projection L2 utilise au maximum 16 services et 48 liens canoniques. Les URLs, IP LAN et preuves OWNER n'entrent pas dans cette projection. L3 attend un contrat métier de composants ; aucun inventaire parallèle n'est maintenu. La lecture publique dépend toujours des restrictions du read-model et du contrôle serveur.

## Contrat d'identité v2 (mise à jour S-08a)

Site ne joint plus les observations de sondes par nom ou URL :
`canonicalHomelabEvidence` exige `observation.id === service.id`, avec un
ID non ambigu. Une observation absente donne `unknown` et ne devient pas
verte par coïncidence de libellé ; les statuts v2 liés par `entityRef`
restent une source distincte, contrôlée par `catalogRevision`.
La vue C4 expurge les noms contenant des origines privées, les descriptions
sensibles et les types de relation non reconnus avant le rendu ReactFlow.
Ces contraintes s'appliquent même si l'API renvoie un schéma JSON valide.
