# Chatbot de support du site — étude (26/11/2026)

**Statut : étude, rien n'est implémenté.** Objectif : envoyer le support du site
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
