# Recette WAF Vercel et OWASP ZAP — Site Alban

**Transfert de [Bababou #286](https://github.com/AlbanAndrieu/nabla-site-bababou/pull/286)** — 22/11/2026. Le présent dépôt ne pilote ni l'API WAF Vercel ni Terraform : tout contrôle est en lecture seule. La configuration d'infrastructure reste propriété de [nabla-compose (H04, PR #433)](https://github.com/AlbanAndrieu/nabla-compose/pull/433) et son module actuel cible **Bababou**, pas Site Alban.

## Audit WAF hors ligne — politique candidate, non attestée

- Domaines publics de la recette candidate : `albanandrieu.com` et `www.albanandrieu.com`. Confirmer leur attribution au **même projet Vercel Site Alban** avant toute reprise Terraform ; exclure les domaines Preview et les routes OWNER privées.
- Contrat strict envisagé : `firewallEnabled=true`, bots `challenge`, catégorie générique `gen=log`, SQLi/XSS/RCE actives `deny` et **une** règle `fixed_window` 300 requêtes/60 secondes/IP, excès `deny` 1 minute. Le script constate les propriétés du JSON ; il **ne présume pas** leur éligibilité au forfait en service.
- `inventory` : code 0 si JSON valide mais `NOT_A_SECURITY_GATE`. `enforce` : code 0 seulement si toutes les règles correspondent, **2** si une protection manque ou reste en `log`, **1** si fichier absent/mal formé. Aucune donnée de requête, adresse IP, expression de règle ou secret n'est imprimée.
- `ENFORCED` signifie uniquement **snapshot conforme** ; ni événements 403/429 observés, ni garantie de déploiement effectif, ni mesure de faux positifs. Les droits OWASP, le forfait et les coûts sont **NOT_VERIFIED** ; ne jamais déclencher d'upgrade payant implicitement. Références : [règles gérées](https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets) et [limitation de débit](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

Depuis une workstation autorisée, exporter le snapshot `active` du **projet Site Alban** uniquement dans un fichier privé, hors dépôt :

```bash
umask 077
just waf-snapshot-test
just waf-snapshot-inventory /chemin/prive/waf-active.json
just waf-snapshot-verify /chemin/prive/waf-active.json
```

Un passage à l'action exige : audit des règles existantes, événements WAF et utilisateurs derrière NAT, habilitation et budget, import Terraform dans le Garage de Compose, `plan` sans destruction, revue explicite, rollback puis vérification des effets. Ne pas copier les domaines Bababou ni provisionner un deuxième WAF.

## ZAP — couverture bornée et fail-closed

- Les deux workflows existants (`master-dast.yml`, `zap-preview.yml`) chargent le hook `zap-rate-limit-hook.py` : **1 requête/seconde** sur l'hôte exact de Preview ou `www` et apex Alban en production, à condition que l'add-on Network confirme la règle. Une activation impossible provoque un échec, jamais un scan sans limitation.
- La production garde une baseline passive hebdomadaire, `-T 5 -m 2` ; la Preview reste attachée à un checkpoint SHA vérifié. **Aucun scan actif de production** et aucun nouveau workflow.
- `429`, `x-vercel-mitigated` et indices de checkpoint dans le journal du runner indiquent un **scan incomplet**, pas un site sain ni une vulnérabilité applicative. Aucun journal HTTP brut n'est téléversé ; seuls les findings expurgés de production déjà autorisés restent disponibles pour DefectDojo.
- Les alertes de Bababou (10038 CSP, 10098 CORS, 10099 code source, 90003 SRI) ne sont pas des findings de Site Alban : reproduire et qualifier **les occurrences du site Alban**. Ne pas ajouter d'ignore ZAP et ne pas inventer d'absence de faille.

**Validation restant à fournir :** tests unitaires sur HEAD exact, YAML, hook dans l'image ZAP épinglée, Preview authentifiée et événements WAF réels. Aucun scan ni mutation Vercel exécuté par ce transfert.
