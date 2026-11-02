import type { GuideCopy } from "./content";

export const GUIDE_COPY_FR: GuideCopy = {
	meta: {
		title: "YubiKey : architecture, configuration et reprise | Sécurité",
		description:
			"Guide public des usages FIDO2, SSH, PIV, OpenPGP, OTP, des deux clés et des contrôles de sauvegarde, avec graphe et lexique.",
	},
	back: "Retour à Sécurité",
	eyebrow: "Authentification matérielle et continuité",
	title: "Configurer deux YubiKey sans perdre l'accès",
	lead: "Une clé principale pour l'usage quotidien et une seconde clé pour la continuité. Cette page décrit une architecture cible et les vérifications en lecture seule, pas un état matériel en direct.",
	disclaimer:
		"Schéma conceptuel public. Aucun numéro de série, code PIN/PUK, secret OTP, clé privée, certificat personnel, chemin d'escrow ou information de compte n'est publié. « Observé » signifie documenté lors d'une vérification antérieure, pas revérifié aujourd'hui.",
	diagramTitle: "Graphe des usages et des dépendances",
	diagramLead:
		"Sélectionnez un nœud pour explorer son rôle. Les liens décrivent une fonction ou une dépendance, jamais une synchronisation automatique des secrets entre les deux clés.",
	accessibleGraph: "Liste accessible des relations du diagramme",
	graphSelectorLabel: "Sélectionner un composant du graphe",
	graphRoles: {
		workstation: "Poste de confiance",
		primary: "YubiKey principale",
		backup: "YubiKey secondaire",
		webauthn: "Comptes WebAuthn",
		ssh: "Accès SSH",
		piv: "Certificats PIV",
		openpgp: "Signature OpenPGP",
		otp: "OTP / HMAC",
		recovery: "Tests de reprise",
		escrow: "Escrow chiffré age",
		vault: "KeePassXC",
	},
	graphEdges: {
		primary: "utilisation quotidienne",
		backup: "continuité indépendante",
		webauthn: "authentification FIDO2",
		ssh: "clé SSH FIDO",
		piv: "certificat et clé PIV",
		openpgp: "signature et chiffrement",
		otp: "défi-réponse",
		recovery: "contrôle sans mutation",
		escrow: "restauration vérifiée",
		vault: "déverrouillage à tester",
	},
	keyLegend:
		"La clé de secours exige son propre enrôlement auprès des services : il n'existe pas de copie automatique de ses clés privées.",
	workflowTitle: "Configuration prévue et éléments à vérifier",
	stateLabels: {
		observed: "Documenté",
		planned: "Prévu",
		blocked: "À débloquer",
	},
	steps: [
		{
			title: "Inventaire en lecture seule",
			text: "Vérifier les interfaces USB/NFC, versions de firmware, capacités FIDO2, OTP, PIV et OpenPGP des deux clés sans modifier de slots.",
			state: "observed",
		},
		{
			title: "FIDO2 / WebAuthn",
			text: "Enregistrer les deux clés séparément sur chaque compte critique, garder une méthode de reprise indépendante et tester la connexion avec chacune.",
			state: "planned",
		},
		{
			title: "SSH avec confirmation physique",
			text: "Conserver une clé SSH matérielle de secours dédiée (ed25519-sk), vérifier le toucher et le code PIN et tester l'accès de manière non destructive.",
			state: "observed",
		},
		{
			title: "PIV et certificats",
			text: "Inventorier les emplacements (dont 9A et 82), vérifier les dates et la chaîne de confiance ; renouveler les certificats expirés seulement après sauvegarde et autorisation explicite.",
			state: "blocked",
		},
		{
			title: "OpenPGP / agent GPG",
			text: "Documenter l'usage d'OpenPGP et les interactions GPG-agent/pcscd ; différencier certificat PIV, sous-clé OpenPGP et clé SSH FIDO.",
			state: "planned",
		},
		{
			title: "OTP HMAC-SHA1",
			text: "Conserver le défi-réponse historique comme mécanisme distinct de FIDO2. Vérifier le slot et l'application cliente sans divulguer ni reprogrammer le secret.",
			state: "observed",
		},
		{
			title: "Escrow et copies indépendantes",
			text: "Produire deux archives age distinctes, valider empreintes et chemins de restauration sans secret dans les journaux ; bloquer la procédure si deux sauvegardes sont le même fichier.",
			state: "blocked",
		},
		{
			title: "KeePassXC et rotation",
			text: "Tester le déverrouillage avec la clé principale et le scénario de secours ; documenter les dépendances et la procédure de rotation après une perte.",
			state: "planned",
		},
		{
			title: "Exercice de continuité",
			text: "Simuler la perte de la clé principale : comptes prioritaires, SSH, coffre, certificats, récupération des archives et journal de preuves expurgées.",
			state: "planned",
		},
	],
	safetyTitle: "Règles de sécurité",
	safety: [
		"Ne jamais modifier PIN, PUK, clé de gestion PIV, slots OTP ou clés privées dans un diagnostic automatique.",
		"Ne jamais mettre les secrets, identifiants matériels, certificats personnels, contenus de sauvegarde ou chemins privés dans Git et dans une page publique.",
		"La clé de secours doit être testée indépendamment, stockée séparément et protégée par son propre code PIN.",
		"Séparer « configuré », « fonctionnel au dernier test » et « à vérifier ». Un test lecture seule ne valide pas une restauration.",
	],
	glossaryTitle: "Lexique des acronymes",
	glossaryLead: "Les sigles employés dans le graphe et dans le plan.",
	terms: [
		{
			acronym: "FIDO2",
			expansion: "Fast IDentity Online 2",
			meaning:
				"Standard d'authentification forte avec clé matérielle, notamment pour l'accès sans mot de passe.",
		},
		{
			acronym: "WebAuthn",
			expansion: "Web Authentication",
			meaning:
				"API Web utilisée pour enregistrer puis authentifier une clé de sécurité.",
		},
		{
			acronym: "CTAP",
			expansion: "Client to Authenticator Protocol",
			meaning:
				"Protocole entre navigateur/système et authentificateur matériel.",
		},
		{
			acronym: "SSH",
			expansion: "Secure Shell",
			meaning:
				"Protocole d'accès distant ; la variante -sk emploie un authentificateur FIDO.",
		},
		{
			acronym: "PIV",
			expansion: "Personal Identity Verification",
			meaning:
				"Application de carte à puce pour les certificats et opérations cryptographiques.",
		},
		{
			acronym: "PKCS#11",
			expansion: "Public-Key Cryptography Standards #11",
			meaning:
				"Interface standard pour accéder aux objets cryptographiques d'un module ou d'une carte.",
		},
		{
			acronym: "GPG",
			expansion: "GNU Privacy Guard",
			meaning: "Logiciel pour gérer les clés et les signatures OpenPGP.",
		},
		{
			acronym: "OpenPGP",
			expansion: "Open Pretty Good Privacy",
			meaning: "Standard ouvert de chiffrement et de signature des données.",
		},
		{
			acronym: "OTP",
			expansion: "One-Time Password",
			meaning: "Mot de passe à usage unique ; ne pas confondre avec WebAuthn.",
		},
		{
			acronym: "HMAC",
			expansion: "Hash-based Message Authentication Code",
			meaning:
				"Code d'authentification calculé à partir d'une clé secrète et d'une fonction de hachage.",
		},
		{
			acronym: "SHA-1",
			expansion: "Secure Hash Algorithm 1",
			meaning:
				"Fonction de hachage historique utilisée par certains modes défi-réponse ; ne pas généraliser cet usage à la signature moderne.",
		},
		{
			acronym: "NFC",
			expansion: "Near Field Communication",
			meaning:
				"Communication radio courte portée avec un téléphone ou un lecteur compatible.",
		},
		{
			acronym: "PIN",
			expansion: "Personal Identification Number",
			meaning: "Code personnel de déverrouillage de la clé.",
		},
		{
			acronym: "PUK",
			expansion: "PIN Unblocking Key",
			meaning:
				"Code de déblocage du PIN de l'application PIV, à conserver hors ligne.",
		},
		{
			acronym: "CA",
			expansion: "Certificate Authority",
			meaning: "Autorité de certification qui émet ou signe des certificats.",
		},
		{
			acronym: "age",
			expansion: "age encryption tool",
			meaning:
				"Outil de chiffrement de fichiers utilisé pour les sauvegardes chiffrées.",
		},
		{
			acronym: "MFA",
			expansion: "Multi-Factor Authentication",
			meaning:
				"Authentification multifacteur : au moins deux facteurs indépendants, par exemple mot de passe et clé matérielle.",
		},
		{
			acronym: "SOPS",
			expansion: "Secrets OPerationS",
			meaning:
				"Outil d'édition et de chiffrement des secrets structurés, notamment avec age.",
		},
		{
			acronym: "OIDC",
			expansion: "OpenID Connect",
			meaning:
				"Protocole d'identité sur OAuth 2.0 utilisé notamment pour la connexion fédérée à Vault.",
		},
		{
			acronym: "IdP",
			expansion: "Identity Provider",
			meaning:
				"Fournisseur d'identité qui authentifie l'utilisateur et applique éventuellement WebAuthn.",
		},
		{
			acronym: "OATH",
			expansion: "Initiative for Open Authentication",
			meaning:
				"Famille de standards pour les codes de vérification, distincte de l'application OTP défi-réponse.",
		},
		{
			acronym: "TOTP",
			expansion: "Time-based One-Time Password",
			meaning:
				"Code temporaire fondé sur le temps, généralement à six chiffres.",
		},
		{
			acronym: "TLS",
			expansion: "Transport Layer Security",
			meaning:
				"Protocole de protection des connexions réseau ; peut utiliser un certificat client.",
		},
		{
			acronym: "X.509",
			expansion: "ITU-T X.509",
			meaning:
				"Norme de format et de validation de certificats à clé publique.",
		},
		{
			acronym: "SQL",
			expansion: "Structured Query Language",
			meaning: "Langage de bases de données utilisé notamment par PostgreSQL.",
		},
	],
	nextTitle: "Conditions de clôture",
	nextSteps: [
		"Vérifier les deux clés en lecture seule et enregistrer des résultats expurgés datés.",
		"Enrôler la clé secondaire dans chaque service critique et valider un accès de reprise.",
		"Réparer la chaîne PIV/les certificats et les deux sauvegardes age indépendantes avant tout changement destructif.",
		"Tester KeePassXC et conduire un exercice complet de restauration.",
	],
	glossaryLink: "Lexique général de sécurité",
	sourceLabel: "Documentation de référence",
};
