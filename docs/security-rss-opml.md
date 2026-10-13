# Flux RSS sécurité — OPML source de référence

- `data/security/security-feeds.opml` : liste portable OPML 2.0, versionnée.
- `public/ciso-rss-feeds.json` : sortie générée utilisée par `ThreatFeed`.
- `node scripts/generate-security-rss.mjs` : régénérer le JSON après modification de l'OPML.
- `node scripts/generate-security-rss.mjs --check` : vérifier l'absence de dérive sans modifier de fichier.
- `node --test unit-tests/securityRssOpml.test.mjs` : tests hors ligne.

Migration sans changement fonctionnel initial : les 78 URL HTTPS du JSON historique sont reprises dans l'OPML et le contrat JSON existant est conservé. Les imports/exports FreshRSS sont un chantier distinct ; aucune publication externe ni appel à l'API RSS n'est effectué par le générateur.

Les modifications du fichier JSON sont à proscrire : éditer exclusivement l'OPML, puis régénérer. Les flux ne sont **pas** interrogés par la quality gate et leur disponibilité réseau n'est donc pas certifiée.

## Quand la régénération est-elle déclenchée ?

- **Pendant l'édition** : lancer `node scripts/generate-security-rss.mjs` quand on modifie l'OPML ; le skill local `.agents/skills/security-rss-opml/SKILL.md` rappelle ce contrat à l'agent.
- **Avant chaque commit contenant l'OPML** : le hook local `generate-security-rss` de `.pre-commit-config.yaml` écrit automatiquement le JSON. Si ce fichier est modifié, le hook bloque normalement le premier commit : il faut ajouter le JSON généré au staging et recommencer.
- **À l'ouverture / mise à jour d'une PR** : le workflow `.github/workflows/security-rss-opml.yml` lance `--check` et les tests sans aucun accès en écriture. Le workflow échoue si le JSON ne reflète plus l'OPML. Il ne pousse pas de commits automatiques et économise les permissions GitHub Actions.

Le JSON initial ne figure pas dans le diff de la PR #221 car les 78 URL sont intentionnellement **identiques** : aucune nouvelle donnée n'avait à être régénérée dans ce premier commit. La mécanique de génération devient visible dès une modification effective de l'OPML.

## FreshRSS prioritaire et repli transitoire

La page `ThreatFeed` interroge d'abord `GET /api/ciso/threat-feed`, route Next.js **côté serveur** utilisant l'API Google Reader de FreshRSS. L'authentification `FRESHRSS_GREADER_AUTH` et les éventuels `FRESHRSS_CF_ACCESS_CLIENT_ID` / `FRESHRSS_CF_ACCESS_CLIENT_SECRET` ne sont transmis qu'à l'origine, jamais au navigateur. `FRESHRSS_PUBLICATION_ENABLED=true` reste un opt-in explicite, avec une identité de publication `securitypublic`.

La liste d'autorisation des flux publics de la route FreshRSS provient désormais directement de `public/ciso-rss-feeds.json`, généré depuis l'OPML canonique (78 URL au démarrage). Elle ne dépend plus d'une ancienne sélection de dix sources. La route ne renvoie que les articles dont le `streamId` correspond à un abonnement autorisé ; des sources privées ajoutées accidentellement au compte FreshRSS ne sont jamais publiées.

Tant que FreshRSS est non configuré (503), indisponible (502), renvoie une réponse invalide ou **ne contient aucun article autorisé** (503), le composant déclenche le repli historique : lire `/ciso-rss-feeds.json`, puis interroger les flux publics via `api.rss2json.com`. Ce mécanisme temporaire est volontairement borné à **16 sources et 4 requêtes concurrentes**, non à cause d'un abonnement payant, mais pour limiter les appels directs du navigateur et les quotas du convertisseur tiers. Ce repli n'est **pas une lecture d'articles depuis le JSON** : le JSON ne contient que des URL. Il doit être retiré après acceptation de FreshRSS et de la couverture de ses 78 abonnements.

La route continue à échouer en mode fermé lorsqu'aucun secret ou flag de publication n'est configuré ; les identifiants doivent être injectés en variables d'environnement Vercel côté serveur, sans fichier secret commité. Les erreurs de lecture ne révèlent ni réponse brute FreshRSS ni credentials.

**Critères de bascule** : compte `securitypublic` provisionné et rempli, liste de 78 abonnements vérifiée par l'API GReader, disponibilité Vercel → Access → FreshRSS validée, tests d'exclusion de sources privées, métriques du taux de fallback et désactivation progressive de `rss2json` après observation.
