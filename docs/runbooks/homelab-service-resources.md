# Homelab OWNER — RAM, GPU et stockage par service

La consommation de ressources **observée** doit rester séparée du
catalogue **déclaré** et du statut de santé FastAPI. Un service peut
être en cours d'exécution avec un pic RAM, ou être arrêté alors que
l'ARC ZFS utilise encore de la mémoire.

## Mode propriétaire / import ponctuel

La section \`/fr/truenas\` expose, uniquement en mode **OWNER**,
un import local du JSON \`nabla-service-resources/v1\` produit
par \`nabla-compose\` :

\`\`\`bash
cd /mnt/cpool/compose/nabla-compose
sudo install -d -o root -g root -m 0700 /mnt/cpool/var/nabla/service-resources
sudo python3 scripts/truenas/collect-service-resource-evidence.py \
  --check --host truenas \
  --output "/mnt/cpool/var/nabla/service-resources/resources-$(date -u +%Y%m%dT%H%M%SZ).json"
\`\`\`

Ouvrir le site depuis un canal OWNER autorisé et importer le fichier
dans **Ressources par service · RAM / GPU / stockage**. Il n'y a
**aucun envoi au serveur/Vercel** ; le JSON validé et nettoyé reste
dans \`localStorage\` du navigateur OWNER. Le bouton d'effacement
supprime cet historique local.

La carte du service fait une jointure stricte sur
\`component:default/<id>\` ou \`resource:default/<id>\`,
et affiche :

- RAM Docker working-set (mesure ponctuelle, pas un pic) ;
- GPU NVIDIA attribué par PID/cgroup (ne vaut pas 0 si le GPU
  est inaccessible ou installé sur la workstation) ;
- couche écrivable Docker, indépendamment des datasets ;
- datasets ZFS montés avec leurs volumes occupés et
  un avertissement lorsqu'ils sont partagés.

Au-delà de 30 minutes, le snapshot est affiché comme
**historique**. Une révision Backstage non concordante est
signalée. Une valeur absente devient **— / non vérifié**,
pas \`0\` ni \`DOWN\`.

Aucune de ces valeurs ne passe dans le HTML public SERVICE ni
dans les endpoints d'exposition. Un basculement hors de la
frontière OWNER masque immédiatement le panneau et les valeurs.
Le fichier est plafonné à 750 Ko et le parseur élimine les
champs inconnus (exemple : labels ou contenus secrets).

## Prochain palier

- Rendre le relevé disponible via une API **OWNER authentifiée**
  émise par le collecteur LAN autorisé, sans polluer le
  catalogue Backstage ni créer un nouveau scrapper côté Vercel.
- Historiser la RAM/CPU avec les séries cAdvisor déjà collectées
  par Prometheus ; ZFS et GPU restent des métriques distinctes.
- Corréler les épisodes OOM avec un identifiant de conteneur
  Docker et, le cas échéant, les VM QEMU/Talos : une absence
  de GPU attribué n'est pas un état sain.
- Conserver les métriques globales de capacité et les quotas
  en dehors du graphe de disponibilité Gatus.
