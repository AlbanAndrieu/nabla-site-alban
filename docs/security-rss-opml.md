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
