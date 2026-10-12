# Flux RSS sécurité — OPML source de référence

- `data/security/security-feeds.opml` : liste portable OPML 2.0, versionnée.
- `public/ciso-rss-feeds.json` : sortie générée utilisée par `ThreatFeed`.
- `node scripts/generate-security-rss.mjs` : régénérer le JSON après modification de l'OPML.
- `node scripts/generate-security-rss.mjs --check` : vérifier l'absence de dérive sans modifier de fichier.
- `node --test unit-tests/securityRssOpml.test.mjs` : tests hors ligne.

Migration sans changement fonctionnel initial : les 78 URL HTTPS du JSON historique sont reprises dans l'OPML et le contrat JSON existant est conservé. Les imports/exports FreshRSS sont un chantier distinct ; aucune publication externe ni appel à l'API RSS n'est effectué par le générateur.

Les modifications du fichier JSON sont à proscrire : éditer exclusivement l'OPML, puis régénérer. Les flux ne sont **pas** interrogés par la quality gate et leur disponibilité réseau n'est donc pas certifiée.
