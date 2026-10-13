---
name: security-rss-opml
description: Synchroniser les sources RSS de sécurité de Site Alban depuis OPML vers le JSON publié.
---

# Source RSS canonique

Le seul fichier à éditer pour ajouter, supprimer ou réordonner les flux est `data/security/security-feeds.opml`.

1. Modifier l'OPML 2.0 ; utiliser exclusivement des URL HTTPS sans identifiants, éviter les doublons et encoder `&` en `&amp;` dans les attributs XML.
2. Exécuter `node scripts/generate-security-rss.mjs` pour régénérer `public/ciso-rss-feeds.json`.
3. Exécuter `node scripts/generate-security-rss.mjs --check` puis `node --test unit-tests/securityRssOpml.test.mjs`.
4. Commiter **ensemble** OPML et JSON, sans modifier le format `{ "feeds": [...] }` consommé par `ThreatFeed`.
5. En cas d'échec de pre-commit après régénération, ajouter le JSON modifié au staging et relancer le commit. Ne pas contourner les hooks.

Le hook local de `.pre-commit-config.yaml` exécute automatiquement la génération **lorsque l'OPML est stagé pour un commit**, même si l'agent a oublié la commande. La CI `.github/workflows/security-rss-opml.yml` ne réécrit pas la branche : elle échoue en cas de dérive, ce qui protège les PR sans disposer d'un token GitHub en écriture.

L'OPML n'est pas consulté dynamiquement depuis le navigateur ; le site conserve la lecture du JSON. Aucun appel vers FreshRSS, un service tiers ou les flux eux-mêmes n'est nécessaire pour générer les données.
