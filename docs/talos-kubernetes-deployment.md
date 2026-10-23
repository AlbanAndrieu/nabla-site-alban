# Déploiement Next.js sur Talos/Kubernetes — image unique

## Un seul Dockerfile, deux plateformes

- `Dockerfile` produit **l'application Next.js complète**, avec SSR et routes API sur le port 3000. `Dockerfile.k8s` est supprimé, de même que son fichier `.dockerignore` dédié.
- `.dockerignore` exclut les clés, secrets locaux, `.git`, dépendances installées et artefacts de tests. Le `Dockerfile` ne contient aucun ARG de secret.
- Vercel continue à compiler le projet **nativement** via `vercel.json` ; le Dockerfile n'est pas le mode de production Vercel.
- L'ancien conteneur Nginx de fallback n'est plus l'image de ce dépôt. Les clients des tags GHCR/Docker Hub existants doivent être vérifiés **avant publication** : leur contenu passe de Nginx port 8080 à Next.js port 3000.

## Cible et limites

Recette **privée** sur `alban-site.int.albandrieu.com` via le Traefik du cluster Talos TrueNAS. Aucune bascule de DNS public, aucun changement du site Vercel actuel.

`Dockerfile` produit la **vraie application Next.js** SSR/API port 3000 : Node 24.22.1 LTS, npm 12.2, sortie `standalone` opt-in et UID/GID 10001. Le contexte Docker racine exclut `.git`, les secrets `.env*` et les clés. Pas de clé de diagnostic dans l'image.

## Build, contrôle et image immuable

Depuis un checkout complet et une machine avec Docker, hors GitHub Actions :

```bash
just k8s-contract
just k8s-build ghcr.io/albanandrieu/nabla-site-alban:talos-test
trivy image --exit-code 1 --ignore-unfixed --severity HIGH,CRITICAL \
  ghcr.io/albanandrieu/nabla-site-alban:talos-test
just k8s-smoke ghcr.io/albanandrieu/nabla-site-alban:talos-test
```

Le smoke lance l'unique image en conteneur read-only/non root, monte les caches temporaires, teste `/fr` et assure `/api/homelab-access` → `trusted:false`, **sans fabriquer VERCEL=1**. Publier sur un registre accessible aux nœuds Talos uniquement après validation, puis récupérer le digest `sha256` **du registre**. Ne pas utiliser `:latest` : déployer l'image Next.js validée par digest.

## Déploiement GitOps dans nabla-compose

`nabla-compose/scripts/talos/deploy-site-alban.sh` existe déjà : namespace `nabla-site-alban`, ingress `traefik`, hostname `alban-site.int.albandrieu.com`, UID 10001, port 3000, image immuable obligatoire. Il reste la source Kubernetes à faire évoluer, pour ne pas maintenir un second manifeste concurrent dans ce dépôt.

```bash
# Depuis nabla-compose et une machine disposant du kubeconfig autorisé
export SITE_ALBAN_K8S_IMAGE='ghcr.io/albanandrieu/nabla-site-alban@sha256:<DIGEST_VALIDÉ>'
export SITE_ALBAN_K8S_HOST='alban-site.int.albandrieu.com'
bash scripts/talos/deploy-site-alban.sh --preflight
bash scripts/talos/deploy-site-alban.sh --render
bash scripts/talos/deploy-site-alban.sh --server-dry-run
# N'exécuter --apply qu'après les corrections et vérifications ci-dessous.
```

### Bloquants d'activation

- **Traefik/TLS :** vérifier `IngressClass/traefik`, DNS privé, absence de collision, ingress réservé au LAN, certificat TLS correct. Le script actuel **ne déclare pas spec.tls** : ne pas exposer le hostname ni saisir des secrets en HTTP.
- **Filesystem :** le Pod existant utilise `readOnlyRootFilesystem: true`. Monter un `emptyDir` en écriture sur `/app/.next/cache` (et `/tmp` si requis), sous UID/GID 10001.
- **Secrets :** prévoir une Secret Kubernetes ou un opérateur de secrets pour `DIAGNOSTICS_ACCESS_KEY` et autres secrets strictement nécessaires ; jamais de `NEXT_PUBLIC_*` ni de secrets dans des ARG Docker ou dans Git.
- **Owner :** `lib/homelabAccess.ts` ne fait confiance à l'IP `x-real-ip` que lorsqu'elle est fournie par l'edge **Vercel**. Sur Talos, les vues OWNER restent **fermées par défaut**. Ne pas les ouvrir en définissant `VERCEL=1` dans le Pod ou en acceptant les entêtes client. Concevoir séparément une chaîne d'authentification, de proxy de confiance, de contrôle CIDR et d'audit.
- **Ressources :** le script actuel limite la RAM à 512 Mi, valeur non encore validée pour le runtime SSR. Vérifier RSS et latence avant d'augmenter les replicas.
- **Egress :** vérifier le DNS, TLS et les dépendances FastAPI Cloud/Stripe selon les routes activées. Ne pas activer de NetworkPolicy bloquante avant d'avoir vérifié le CNI et les flux utiles.

Après revue du manifeste, l'exploitant peut activer volontairement `SITE_ALBAN_K8S_ALLOW_APPLY=true` avec `--apply`. Vérifier rollout, EndpointSlices, les logs, `GET /fr`, assets Next.js et `GET /api/homelab-access` par HTTPS côté LAN.

**Done :** image complète, construite et scannée localement, digest immutable, Pod non-root et Ready, HTTPS privé fonctionnel, états d'accès OWNER fermés sans identité vérifiée, aucun secret exposé. **Différé :** DNS public, exposition Internet, bascule Vercel et accès OWNER enrichi.

**Preuve disponible aujourd'hui :** seulement contrats de source et syntaxe shell hors ligne. Build Docker, tests Next.js complets, image publiée, cluster Talos et HTTPS : **NOT_RUN**.
