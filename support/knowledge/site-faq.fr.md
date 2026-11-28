# FAQ du site albanandrieu.com (support)

Base de connaissance de l'assistant de support. Source : contenu public du site
<https://www.albanandrieu.com> (version française sous `/fr`). Réponses
factuelles uniquement ; pas d'engagement de délai, de prix définitif ou d'action.
Quand une question sort de ce périmètre, orienter vers « Parler à un humain » ou
l'adresse e-mail adaptée.

## Qui est derrière le site ?

Alban Andrieu, ingénieur cybersécurité et DevSecOps, architecte cloud,
indépendant / freelance depuis 2007, avec plus de 20 ans d'expérience en
environnement d'entreprise. Basé dans l'ouest parisien (La Défense, Nanterre),
il intervient à distance et sur site dans la région.

## Quelles prestations sont proposées ?

Page : `/fr/expertise`.

- Intégration de la sécurité : scans SAST/DAST et dépendances en CI/CD,
  gestion des vulnérabilités, préparation ISO 27001 / SOC 2.
- Intégration de l'IA : assistants à base de LLM, intégration OpenAI,
  Azure OpenAI ou modèles hébergés, maîtrise des coûts et observabilité.
- Architecture cloud sur AWS, Azure ou OVHcloud : réseau, durcissement, coûts,
  haute disponibilité, sauvegarde et reprise d'activité.
- Transformation DevOps, Infrastructure as Code (Terraform, Ansible, GitOps),
  orchestration de conteneurs (Kubernetes, Nomad, Docker), supervision
  (Prometheus, Grafana, Loki, OpenTelemetry).
- Infrastructure IA et MLOps (LLM, RAG, GPU) avec garde-fous de sécurité et de
  coûts.

## Combien coûte une mission ? Quel est le TJM ?

Page : `/fr/pricing`. Les tarifs sont confirmés après un court cadrage et
s'entendent hors TVA lorsqu'elle s'applique.

- DevSecOps / architecte cloud fractionné : 750 à 790 € par jour, hors TVA,
  en mandat mensuel (souvent 1 à 3 jours par semaine), à distance sur les
  fuseaux européens.
- Sprint d'audit : forfait fixé après la phase de découverte, généralement
  2 à 4 semaines calendaires, avec rapport et atelier de restitution.
- Projet : jalons contractualisés (SOW) ou régie plafonnée.
- Options : interventions critiques le soir ou le week-end sur accord
  préalable, astreinte facturée à part, formations et ateliers.
- Frais (cloud, déplacements, outils tiers) : accord préalable, refacturés au
  coût réel.

L'assistant ne fait pas de devis : pour une estimation écrite, réserver l'appel
gratuit de 30 minutes (Calendly, <https://calendly.com/alban-andrieu>) ou
écrire à job@albandrieu.com.

## Comment payer ?

Page : `/fr/payment`.

- Par carte, via la page de paiement hébergée par Stripe (paiement unique).
  Le site ne voit ni ne stocke les numéros de carte : la saisie se fait chez
  Stripe.
- Par virement SEPA : le RIB est téléchargeable en PDF sur la page de
  paiement. Indiquer la facture ou la référence dans le libellé du virement.
- Paiement du TJM : la page `/fr/checkout-tjm` ouvre le paiement Stripe
  (bouton ou QR code).
- Si le paiement Stripe ne démarre pas : utiliser le lien Stripe direct de la
  page de paiement, un virement SEPA, ou écrire à job@albandrieu.com.

## J'ai annulé ou je ne sais pas si mon paiement est passé

- Page d'annulation : aucun paiement n'a été effectué, vous pouvez réessayer.
- Page de confirmation : elle indique soit que Stripe a confirmé le paiement,
  soit que la vérification est en attente. En cas de doute, vérifier l'e-mail
  reçu de Stripe puis écrire à job@albandrieu.com.
- L'assistant ne peut ni vérifier un paiement, ni rembourser, ni modifier une
  facture : ces demandes vont à un humain.

## Factures, TVA, bons de commande

Écrire à invoice@albanandrieu.com pour toute question de facturation, de
paiement, de TVA ou de bon de commande. Ne pas envoyer les factures aux adresses
job ou contact.

## Comment contacter Alban Andrieu ?

Pages : `/fr/contact` et `/fr/email`.

- Missions et travail : job@albandrieu.com.
- Sécurité du site (signalement de vulnérabilité) : security@albandrieu.com.
- Factures : invoice@albanandrieu.com.
- Autres sujets : contact@albandrieu.com.
- Rendez-vous de 30 minutes : <https://calendly.com/alban-andrieu>.
- Brief de projet : formulaire de la page `/fr/startup`.
- Téléphone et réseaux sociaux (LinkedIn, GitHub, etc.) : page `/fr/contact`.

L'ancienne adresse alban.andrieu@free.fr n'est plus utilisée. Un message reçu de
no-reply@albandrieu.com, no-reply@albanandrieu.com, openclaw@albandrieu.com ou
assistant@albandrieu.com provient d'un tri automatique, pas d'une lecture
humaine.

## Comment parler à un humain depuis le support ?

Sur la page `/fr/support`, ouvrir « Parler à un humain », écrire le message et,
si vous souhaitez une réponse, votre e-mail. Le message et les derniers échanges
avec l'assistant sont transmis au propriétaire du site. Si l'envoi échoue,
écrire à openclaw@albandrieu.com.

## Que deviennent mes messages au support ?

Ils sont traités sur le serveur auto-hébergé du propriétaire du site.
Lorsque la télémétrie Langfuse est activée, les questions et réponses y sont
également enregistrées afin d'évaluer la pertinence du support et les versions
du prompt et de la FAQ. Ne partagez ni données personnelles sensibles,
ni mot de passe, ni données de paiement. Pour toute question sur vos données, voir la
politique de confidentialité (`/fr/policy/privacy_policy`) ou écrire à
contact@albandrieu.com.

## Qu'est-ce que le homelab Nabla ?

Pages : `/fr/nabla`, `/fr/truenas`, `/fr/architecture`, `/fr/workstation`.
Un homelab TrueNAS Scale sur une machine Mini-ITX (stockage ZFS, applications
auto-hébergées, outillage de sécurité et expérimentations IA). Il sert à tester
des intégrations de sécurité et d'IA et à reproduire des attaques visant les
domaines du propriétaire. Les pages publiques montrent un catalogue de services
et des états publics qui peuvent être en retard ou incomplets : un service
« déclaré » n'est pas forcément « observé » en bonne santé. Les services
eux-mêmes ne sont pas ouverts au public ; l'assistant ne donne ni accès, ni
identifiants, ni adresses internes.

## Les guides sécurité et YubiKey

Pages : `/fr/security`, `/fr/security/yubikey`, `/fr/security/dsomm`,
`/fr/security/lexique`, `/fr/security/ctem`, `/fr/security/ciso`, `/fr/security/ctid`, `/fr/security/compliance`, `/fr/ai`.

- Le guide YubiKey explique ce qu'est une clé de sécurité, l'intérêt de
  FIDO2 / WebAuthn, une configuration à deux clés, la récupération, puis PIV,
  la PKI Vault et l'authentification par certificat Microsoft Entra. C'est un
  guide conceptuel : aucun numéro de série, PIN ou identifiant n'y est publié.
- DSOMM : explorateur du modèle de maturité DevSecOps de l'OWASP.
- Lexique : acronymes sécurité, continuité, vulnérabilités et réglementation
  (BIA, RTO, RPO, SAST, DAST, CVSS, EPSS, KEV, DORA…).
- CTEM : architecture de gestion continue de l'exposition aux menaces.

L'assistant n'assure pas de support matériel personnalisé (clé bloquée, PIN
perdu) : contacter le fabricant ou un humain.

## J'ai trouvé une faille de sécurité sur le site

Écrire à security@albandrieu.com avec les détails. Ne pas tester au-delà de ce
qui est nécessaire pour décrire le problème.

## Mentions légales et politiques

Pages sous `/fr/policy` : mentions légales, impressum, politique de
confidentialité, conditions de service, politique cookies, déclaration
d'accessibilité.

## Quand passer la main à un humain ?

Toujours pour : devis, disponibilité, négociation, contrat, facture,
remboursement, vérification de paiement, données personnelles, signalement de
sécurité, ou toute question dont la réponse n'est pas dans cette FAQ ou sur le
site.

## Sources publiques pour les citations du chatbot (liens vérifiables)

Pour chaque réponse, citer la page exacte pertinente, sans inventer d'URL.
La citation doit être un lien Markdown lisible, par exemple
[Tarifs](https://www.albanandrieu.com/fr/pricing).
Les repères non cliquables du moteur RAG ([1], [2]) ne suffisent pas.

- Prestations : https://www.albanandrieu.com/fr/expertise
- Tarifs et TJM : https://www.albanandrieu.com/fr/pricing
- Paiements : https://www.albanandrieu.com/fr/payment
- Contact : https://www.albanandrieu.com/fr/contact
- Rendez-vous : https://calendly.com/alban-andrieu
- Homelab : https://www.albanandrieu.com/fr/truenas
- Sécurité : https://www.albanandrieu.com/fr/security
- Lexique : https://www.albanandrieu.com/fr/security/lexique
- Politique de confidentialité : https://www.albanandrieu.com/fr/policy/privacy_policy
