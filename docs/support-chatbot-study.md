# Chatbot de support du site — étude (26/11/2026)

**Statut : Option A retenue le 26/11 par le propriétaire — implémentation** (côté site : CODED, voir [Exploitation](#exploitation)). Objectif : envoyer le support du site
(prestations, TJM et paiement Stripe, pages homelab, contact) vers un assistant
conversationnel. Quand l'assistant ne sait pas répondre, il passe la main au
propriétaire.

## Ce qui existe déjà

| Brique | État | Conséquence pour le chatbot |
| --- | --- | --- |
| Site | Next.js 16 sur Vercel, Route Handlers côté serveur, Turnstile déjà sur `/login` | Le widget et la route serveur vivent ici |
| Accès au homelab depuis Vercel | `lib/server/freshRssPublic.ts` appelle FreshRSS avec un jeton de service Cloudflare Access | Motif réutilisable, sans nouvelle exposition publique |
| OpenWebUI (nabla-compose `apps/openwebui`) | v0.11.0, `openwebui.albandrieu.com` derrière Cloudflare Access (`access.required`), inscription fermée, clés d'API actives, modèles via LiteLLM | Peut porter le modèle « support » et sa base de connaissance (RAG) |
| OpenClaw | Lit la boîte `openclaw@albandrieu.com` ; Slack et Telegram | Destinataire de l'escalade, pas de l'interlocuteur public |
| Mails des robots | Expéditeur `no-reply@albandrieu.com`, destinataire `openclaw@albandrieu.com` (nabla-compose, 26/11) | Même convention pour l'escalade |

## Options

| Critère | A. Widget du site + OpenWebUI | B. Widget du site + Vercel AI Gateway | C. OpenWebUI public intégré | D. OpenClaw répond aux visiteurs |
| --- | --- | --- | --- | --- |
| Exposition | Aucune nouvelle : Access reste exigé, la route Vercel passe par un jeton de service | Aucune côté homelab | **Nouvelle exposition publique** d'une application d'administration | Agent outillé exposé à des inconnus |
| Authentification | Clé d'API d'un compte `site-support` restreint au seul modèle | Clé AI Gateway côté Vercel | Accès anonyme : **authentification affaiblie** | — |
| Où tu rédiges le support | Base de connaissance OpenWebUI, sans déploiement | Markdown dans le dépôt, publié au déploiement | OpenWebUI | Mémoire d'OpenClaw |
| Disponibilité | Dépend du homelab (repli formulaire si indisponible) | Indépendante du homelab | Dépend du homelab | Dépend du homelab |
| Coût | LiteLLM existant | Facturé au jeton | LiteLLM existant | LiteLLM existant |
| Données des visiteurs | Restent auto-hébergées | Partent chez le fournisseur du modèle | Auto-hébergées | Auto-hébergées |
| Verdict | **Recommandée** | Plan B si le homelab ne suffit pas | Rejetée | Rejetée ; OpenClaw reçoit l'escalade |

### Recommandation : A, avec repli automatique

1. **OpenWebUI** :
   - créer le compte `site-support` (rôle utilisateur) et sa clé d'API ;
   - créer le modèle `site-support` : modèle de base via LiteLLM, prompt système FR/EN qui refuse le hors-sujet et ne promet aucune action ;
   - créer la base de connaissance `support-site` : pages publiques et FAQ que tu rédiges, attachée au modèle.

   Le compte doit pouvoir lire cette base : un modèle qui a une base attachée ne contourne pas les droits d'accès, la recherche reviendrait vide.
2. **Cloudflare Access** : créer le jeton de service `site-support-vercel`, puis une politique *Service Auth* limitée à ce jeton sur l'application OpenWebUI. Le faire en IaC dans nabla-compose `terraform/cloudflare`.
3. **Secrets** :
   - Vaultwarden (`nabla/prod/site-support`), puis Vercel : `SUPPORT_OPENWEBUI_API_KEY`, `SUPPORT_CF_ACCESS_CLIENT_ID`, `SUPPORT_CF_ACCESS_CLIENT_SECRET` ;
   - jamais côté client.
4. **Site** : la route `app/api/support-chat/route.ts` :
   - tourne en runtime Node et répond en streaming ;
   - vérifie Turnstile à l'ouverture de la conversation ;
   - plafonne l'entrée à 2 000 caractères, la conversation à 20 messages et la réponse à 600 jetons ;
   - abandonne la connexion après 5 s et bascule alors vers un formulaire de contact ;
   - appelle `POST /api/chat/completions` avec le modèle `site-support` et `features` coupées (pas de recherche web, d'outils ni de mémoire).

   Le widget `components/SupportChat.tsx` (AI SDK `useChat`) est accessible au clavier et traduit en FR et EN. La page est `/{locale}/support`.
5. **Escalade** : un bouton « Parler à un humain » appelle `/api/support-contact`. La transcription part au canal Slack openclaw et par mail à `openclaw@albandrieu.com`, depuis `no-reply@albandrieu.com` (relais SMTP ou intégration Marketplace à choisir).
6. **Abus et vie privée** :
   - règle de limitation de débit Vercel par IP ;
   - budget mensuel sur la clé LiteLLM du modèle ;
   - aucune donnée personnelle conservée au-delà de 30 jours ;
   - mention sur la page.
7. **Tests** :
   - unitaires : limites, repli, refus sans Turnstile ;
   - Playwright : ouverture du widget, repli quand le backend tombe ;
   - le ZAP existant couvre la nouvelle route.

## Décisions pour le propriétaire

- Choisir A (homelab, données gardées chez toi) ou B (disponibilité, coût au jeton).
- Choisir le modèle de base et le budget mensuel de LiteLLM pour `site-support`.
- Décider si les transcriptions sont conservées (et combien de temps) ou seulement transmises lors de l'escalade.

## Exploitation

Implémentation de l'option A côté site (26/11) :

- page `app/[locale]/support/page.tsx` (`/support`, `/fr/support`, non indexée) et
  widget `components/support/SupportChat.tsx`, lien discret dans le pied de page ;
- routes `app/api/support-chat/route.ts` et `app/api/support-contact/route.ts` ;
- validation, analyse SSE et texte Slack dans `lib/supportChat.ts`, appels réseau
  dans `lib/server/supportChat.ts` ; tests dans `unit-tests/supportChat*.test.ts` ;
- FAQ de départ pour la base de connaissance : `support/knowledge/site-faq.fr.md`
  et `support/knowledge/site-faq.en.md` (import dans OpenWebUI par un script
  nabla-compose).

### Variables d'environnement (Vercel)

| Variable | Portée | Rôle |
| --- | --- | --- |
| `SUPPORT_OPENWEBUI_URL` | serveur | Facultative, défaut `https://openwebui.albandrieu.com` |
| `SUPPORT_OPENWEBUI_API_KEY` | serveur, secret | Clé d'API du compte `site-support` |
| `SUPPORT_CF_ACCESS_CLIENT_ID` | serveur, secret | Jeton de service Cloudflare Access |
| `SUPPORT_CF_ACCESS_CLIENT_SECRET` | serveur, secret | Jeton de service Cloudflare Access |
| `SUPPORT_OPENWEBUI_MODEL` | serveur | Facultative, défaut `site-support` |
| `SUPPORT_TURNSTILE_SECRET_KEY` | serveur, secret | Active la vérification Turnstile ; absente = pas de vérification (previews) |
| `SUPPORT_SLACK_WEBHOOK_URL` | serveur, secret | Webhook Slack de l'escalade |
| `NEXT_PUBLIC_SUPPORT_TURNSTILE_SITE_KEY` | public (build) | Affiche le widget Turnstile |

Aucune variable serveur n'est préfixée `NEXT_PUBLIC_`. Les deux clés Turnstile
vont ensemble : un secret sans clé de site refuse toutes les requêtes (403).

### Comportement et repli

- `/api/support-chat` n'accepte que les rôles `user`/`assistant` (le prompt
  système et la base vivent dans le modèle OpenWebUI), 20 messages, 2 000
  caractères par message, 12 000 au total ; 400/413 sinon, 403 si Turnstile
  échoue. Appel `POST /api/chat/completions` (`stream: true`, `max_tokens: 600`),
  réponse retransmise en texte brut, plafonnée à environ 6 000 caractères.
- Variables absentes, erreur ou redirection d'Access, ou en-têtes non reçus en
  15 s : **503 `support_unavailable`**, et le widget ouvre « Parler à un humain ».
- `/api/support-contact` poste un message Slack court (langue, e-mail
  facultatif, message, 6 derniers échanges tronqués à 300 caractères, `<>&`
  échappés) et répond 202 ; 503 si le webhook manque ou échoue, et le widget
  affiche alors `openclaw@albandrieu.com`.
- Journaux : code HTTP et durée uniquement, jamais le contenu ni les secrets.

### Écarts assumés par rapport à l'étude

- Pas d'AI SDK (`useChat`) : lecture du flux avec `fetch` et `TextDecoder`, sans
  nouvelle dépendance.
- Délai de 15 s pour recevoir les en-têtes (au lieu de 5 s ; 8 s jusqu'au 28/11) et
  jeton Turnstile frais à chaque requête.
- Un seul message `system` fixe, émis par le serveur : répondre dans la langue du
  dernier message du visiteur. Un rôle `system` envoyé par le client reste refusé.
- Les marqueurs de citation RAG (`[1]`) sont masqués à l'affichage.
- Les `features` (recherche web, outils, mémoire) se coupent dans le modèle
  OpenWebUI, pas dans la requête.
- Escalade par Slack uniquement ; l'envoi par mail depuis
  `no-reply@albandrieu.com` reste à décider.

### Test réel depuis la workstation — 28/11/2026

Site local (`next dev`) pointé sur OpenWebUI en LAN (`172.17.0.24:31028`, v0.11.0),
clé de la workstation, modèle `site-support` (base `gpt-4.1-mini`, connaissance
`support-site` contenant les deux FAQ à jour). En WAN, OpenWebUI répond par la
connexion Cloudflare Access (302) : jeton de service toujours requis.

| Constat | Correction |
| --- | --- |
| 1re question à froid : 503 après 8,1 s ; à chaud, premier octet entre 1 et 7,4 s | délai d'en-têtes porté à 15 s (site) |
| Réponse en français à une question anglaise (prompt du modèle surtout en français) | indication de langue côté serveur (site) ; page FR + question EN reste en français |
| Marqueur `[1]` affiché | masqué à l'affichage (site) |
| Tarifs ou services « non mentionnés » une fois sur deux : `TOP_K = 3` extraits de 1 000 caractères sur ~14 Ko bilingues | **à faire dans OpenWebUI** : connaissance du modèle en mode « document entier » (`context: "full"`), vérifié par requête : bonnes réponses en ~2,5 s |

Parcours navigateur réel (Chromium et WebKit) : réponse en flux, aucun marqueur
`[n]`, 4/4. La modification du modèle OpenWebUI n'a pas été appliquée par l'agent
(refusée par le garde-fou d'exécution) ; une sauvegarde du modèle est conservée
hors Git dans `~/w/nabla-ops/nabla-site-alban/`.

## Contrôles de budget, quotas, arrêt et traçabilité (28/11/2026)

**CODED dans nabla-site-alban PR #341 et nabla-compose PR #455 ; NOT DEPLOYED /
NOT VERIFIED en production à cette date.** La page support fonctionne
actuellement, mais son fonctionnement antérieur ne prouve pas l'activation
des nouveaux contrôles.

### Budget LiteLLM

Le compte OpenWebUI qui porte le bot est
`site-support@albanandrieu.com`. La clé virtuelle
`openwebui` est partagée avec d'autres utilisateurs et dispose déjà d'un
budget maximal de **10 USD / 30 jours**. Le nouveau contrôle séparé s'appuie
sur l'en-tête `X-OpenWebUI-User-Email`, interprété par LiteLLM comme
`customer` ; le client `site-support` reçoit un plafond de **3 USD /
30 jours**, sans enlever le plafond général de la clé.

Sur TrueNAS, vérifier la DB LiteLLM active, la version de son API customer,
l'identité effective transmise par OpenWebUI, puis exécuter :

```bash
python3 scripts/truenas/reconcile-site-support-budget.py --check
sudo python3 scripts/truenas/reconcile-site-support-budget.py --apply
sudo python3 scripts/truenas/reconcile-site-support-budget.py
```

La commande ne doit pas créer de second compte à la place du compte existant,
ni modifier un budget non conforme : elle s'arrête pour contrôle. **Un plafond
en configuration n'est pas la preuve que les dépenses sont réellement bloquées.**
Exécuter un appel contrôlé sous l'identité `site-support` et confirmer
son attribution dans la table de dépenses (et son comportement une fois un
plafond de test atteint) avant de déclarer l'application du budget.

### Quota IP et kill switch

Dans `nabla-compose/terraform/vercel-waf/alban.tf` : **une règle
Hobby** pour la route `/api/support-chat` des domaines publics du site,
avec **6 questions sur 300 secondes par IP**, fenêtre fixe, dépassement refusé.
Le formulaire de contact humain `/api/support-contact` reste accessible.

- Kill switch Vercel : appliquer la valeur
  `alban_support_kill_switch=true` sur la même règle WAF, qui
  devient un **deny** immédiat des questions sans toucher à la messagerie ;
  réappliquer `false` pour rétablir les quotas.
- Kill switch applicatif : configurer `SUPPORT_CHAT_ENABLED=false`
  pour les fonctions Vercel et redéployer. La page affiche alors un message
  explicite et laisse la conversation humaine disponible.
- La première activation du WAF exige d'abord d'inspecter l'état OpenTofu
  Garage, puis `plan`, puis `apply`, sans double import.

### Langfuse v4 et pertinence

Ajouter dans **Vercel Production** les secrets serveur
`SUPPORT_LANGFUSE_PUBLIC_KEY` et
`SUPPORT_LANGFUSE_SECRET_KEY` du projet Langfuse autorisé pour le
support, idéalement avec `SUPPORT_FEEDBACK_SIGNING_KEY` distinct.
Ne jamais utiliser `NEXT_PUBLIC_` pour ces clés. Le jeton Cloudflare
Access déjà en place pour OpenWebUI est autorisé vers Langfuse après
application de `terraform/cloudflare/access-routes.tofu`.

Pour chaque réponse aboutie, le serveur envoie **un span OTLP v4**
(`POST /api/public/otel/v1/traces`) avec identifiant W3C,
question(s) et réponse, version de prompt `site-support-v2`,
skill/FAQ `site-faq-v1` et modèle. Le widget associe le même
identifiant de trace au vote 👍/👎 ; la route
`/api/support-feedback` enregistre un score
`support_relevance` (BOOLEAN = 1/0) via l'API Langfuse.
Le jeton de vote est signé, expire après 24 h et n'expose aucun secret au navigateur.
L'import de la FAQ et du prompt dans OpenWebUI n'est **pas** automatique
lorsqu'une PR fusionne : appliquer `reconcile-site-support.py` et
confirmer que son modèle utilise réellement les versions annoncées.

**Limite de corrélation** : le span de l'application et le score partagent
leur trace W3C. La génération interne LiteLLM/OpenWebUI peut encore apparaître
dans une autre trace Langfuse ; une propagation W3C de bout en bout doit être
vérifiée avant de prétendre disposer d'une seule arborescence.

### Citations

Le prompt de support demande une citation Markdown vers une page publique
vérifiable. Les fichiers `support/knowledge/site-faq.fr.md` et
`site-faq.en.md` listent les URL de référence. Le widget transforme
uniquement les liens HTTPS autorisés en ancres cliquables et n'exécute jamais
le HTML généré. Les marqueurs RAG nus de type `[1]` sont supprimés
car ils ne correspondent pas seuls à une URL.
Le comportement des liens doit être vérifié lors d'une vraie réponse du modèle ;
la présence d'un prompt n'est pas une garantie de citation.

### Tests de recette

1. Activer les variables Langfuse et la nouvelle configuration OpenWebUI.
2. En FR et en EN : poser une question et vérifier une citation cliquable.
3. Noter une réponse et vérifier dans Langfuse le score et le span du même
   `traceId`, les tags/version du prompt et du skill.
4. Sur une IP de test : envoyer sept requêtes en moins de cinq minutes, confirmer
   le refus WAF de la septième (ne pas tester à travers un NAT partagé).
5. Activer le kill switch : aucune inférence ne doit partir ; le contact
   humain continue de fonctionner. Tester le retour arrière.
6. Revoir la politique de rétention des questions et réponses dans Langfuse et
   l'information de confidentialité avant d'activer la télémétrie en production.
