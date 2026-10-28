/**
 * Public, bilingual YubiKey architecture guide.
 * Never put device serial numbers, key identifiers, PINs, PUKs, OTP seeds,
 * certificate payloads, private URLs or actual escrow paths in this module.
 * This is an intended configuration, not an automated hardware inventory.
 */
export type GuideLocale = "en" | "fr";
export type GuideStep = { title: string; text: string; state: "observed" | "planned" | "blocked" };
export type GuideTerm = { acronym: string; expansion: string; meaning: string };
export type GuideCopy = {
  meta: { title: string; description: string };
  back: string; eyebrow: string; title: string; lead: string; disclaimer: string;
  diagramTitle: string; diagramLead: string; accessibleGraph: string;
  graphRoles: Record<string, string>;
  graphEdges: Record<string, string>;
  keyLegend: string; workflowTitle: string;
  stateLabels: Record<GuideStep["state"], string>;
  steps: GuideStep[]; safetyTitle: string; safety: string[];
  glossaryTitle: string; glossaryLead: string; terms: GuideTerm[];
  nextTitle: string; nextSteps: string[]; glossaryLink: string; sourceLabel: string;
};
export const GUIDE_COPY: Record<GuideLocale, GuideCopy> = {
  fr: {
    meta: { title: "YubiKey : architecture, configuration et reprise | Sécurité",
      description: "Guide public des usages FIDO2, SSH, PIV, OpenPGP, OTP, des deux clés et des contrôles de sauvegarde, avec graphe et lexique." },
    back: "Retour à Sécurité", eyebrow: "Authentification matérielle et continuité",
    title: "Configurer deux YubiKey sans perdre l'accès",
    lead: "Une clé principale pour l'usage quotidien et une seconde clé pour la continuité. Cette page décrit une architecture cible et les vérifications en lecture seule, pas un état matériel en direct.",
    disclaimer: "Schéma conceptuel public. Aucun numéro de série, code PIN/PUK, secret OTP, clé privée, certificat personnel, chemin d'escrow ou information de compte n'est publié. « Observé » signifie documenté lors d'une vérification antérieure, pas revérifié aujourd'hui.",
    diagramTitle: "Graphe des usages et des dépendances",
    diagramLead: "Sélectionnez un nœud pour explorer son rôle. Les liens décrivent une fonction ou une dépendance, jamais une synchronisation automatique des secrets entre les deux clés.",
    accessibleGraph: "Liste accessible des relations du diagramme",
    graphRoles: {
      workstation: "Poste de confiance", primary: "YubiKey principale", backup: "YubiKey secondaire",
      webauthn: "Comptes WebAuthn", ssh: "Accès SSH", piv: "Certificats PIV",
      openpgp: "Signature OpenPGP", otp: "OTP / HMAC", recovery: "Tests de reprise",
      escrow: "Escrow chiffré age", vault: "KeePassXC"
    },
    graphEdges: { primary: "utilisation quotidienne", backup: "continuité indépendante",
      webauthn: "authentification FIDO2", ssh: "clé SSH FIDO", piv: "certificat et clé PIV",
      openpgp: "signature et chiffrement", otp: "défi-réponse", recovery: "contrôle sans mutation",
      escrow: "restauration vérifiée", vault: "déverrouillage à tester" },
    keyLegend: "La clé de secours exige son propre enrôlement auprès des services : il n'existe pas de copie automatique de ses clés privées.",
    workflowTitle: "Configuration prévue et éléments à vérifier",
    stateLabels: { observed: "Documenté", planned: "Prévu", blocked: "À débloquer" },
    steps: [
      { title: "Inventaire en lecture seule", text: "Vérifier les interfaces USB/NFC, versions de firmware, capacités FIDO2, OTP, PIV et OpenPGP des deux clés sans modifier de slots.", state: "observed" },
      { title: "FIDO2 / WebAuthn", text: "Enregistrer les deux clés séparément sur chaque compte critique, garder une méthode de reprise indépendante et tester la connexion avec chacune.", state: "planned" },
      { title: "SSH avec confirmation physique", text: "Conserver une clé SSH matérielle de secours dédiée (ed25519-sk), vérifier le toucher et le code PIN et tester l'accès de manière non destructive.", state: "observed" },
      { title: "PIV et certificats", text: "Inventorier les emplacements (dont 9A et 82), vérifier les dates et la chaîne de confiance ; renouveler les certificats expirés seulement après sauvegarde et autorisation explicite.", state: "blocked" },
      { title: "OpenPGP / agent GPG", text: "Documenter l'usage d'OpenPGP et les interactions GPG-agent/pcscd ; différencier certificat PIV, sous-clé OpenPGP et clé SSH FIDO.", state: "planned" },
      { title: "OTP HMAC-SHA1", text: "Conserver le défi-réponse historique comme mécanisme distinct de FIDO2. Vérifier le slot et l'application cliente sans divulguer ni reprogrammer le secret.", state: "observed" },
      { title: "Escrow et copies indépendantes", text: "Produire deux archives age distinctes, valider empreintes et chemins de restauration sans secret dans les journaux ; bloquer la procédure si deux sauvegardes sont le même fichier.", state: "blocked" },
      { title: "KeePassXC et rotation", text: "Tester le déverrouillage avec la clé principale et le scénario de secours ; documenter les dépendances et la procédure de rotation après une perte.", state: "planned" },
      { title: "Exercice de continuité", text: "Simuler la perte de la clé principale : comptes prioritaires, SSH, coffre, certificats, récupération des archives et journal de preuves expurgées.", state: "planned" }
    ],
    safetyTitle: "Règles de sécurité",
    safety: [
      "Ne jamais modifier PIN, PUK, clé de gestion PIV, slots OTP ou clés privées dans un diagnostic automatique.",
      "Ne jamais mettre les secrets, identifiants matériels, certificats personnels, contenus de sauvegarde ou chemins privés dans Git et dans une page publique.",
      "La clé de secours doit être testée indépendamment, stockée séparément et protégée par son propre code PIN.",
      "Séparer « configuré », « fonctionnel au dernier test » et « à vérifier ». Un test lecture seule ne valide pas une restauration."
    ],
    glossaryTitle: "Lexique des acronymes", glossaryLead: "Les sigles employés dans le graphe et dans le plan.",
    terms: [
      { acronym: "FIDO2", expansion: "Fast IDentity Online 2", meaning: "Standard d'authentification forte avec clé matérielle, notamment pour l'accès sans mot de passe." },
      { acronym: "WebAuthn", expansion: "Web Authentication", meaning: "API Web utilisée pour enregistrer puis authentifier une clé de sécurité." },
      { acronym: "CTAP", expansion: "Client to Authenticator Protocol", meaning: "Protocole entre navigateur/système et authentificateur matériel." },
      { acronym: "SSH", expansion: "Secure Shell", meaning: "Protocole d'accès distant ; la variante -sk emploie un authentificateur FIDO." },
      { acronym: "PIV", expansion: "Personal Identity Verification", meaning: "Application de carte à puce pour les certificats et opérations cryptographiques." },
      { acronym: "PKCS#11", expansion: "Public-Key Cryptography Standards #11", meaning: "Interface standard pour accéder aux objets cryptographiques d'un module ou d'une carte." },
      { acronym: "GPG", expansion: "GNU Privacy Guard", meaning: "Logiciel pour gérer les clés et les signatures OpenPGP." },
      { acronym: "OpenPGP", expansion: "Open Pretty Good Privacy", meaning: "Standard ouvert de chiffrement et de signature des données." },
      { acronym: "OTP", expansion: "One-Time Password", meaning: "Mot de passe à usage unique ; ne pas confondre avec WebAuthn." },
      { acronym: "HMAC", expansion: "Hash-based Message Authentication Code", meaning: "Code d'authentification calculé à partir d'une clé secrète et d'une fonction de hachage." },
      { acronym: "SHA-1", expansion: "Secure Hash Algorithm 1", meaning: "Fonction de hachage historique utilisée par certains modes défi-réponse ; ne pas généraliser cet usage à la signature moderne." },
      { acronym: "NFC", expansion: "Near Field Communication", meaning: "Communication radio courte portée avec un téléphone ou un lecteur compatible." },
      { acronym: "PIN", expansion: "Personal Identification Number", meaning: "Code personnel de déverrouillage de la clé." },
      { acronym: "PUK", expansion: "PIN Unblocking Key", meaning: "Code de déblocage du PIN de l'application PIV, à conserver hors ligne." },
      { acronym: "CA", expansion: "Certificate Authority", meaning: "Autorité de certification qui émet ou signe des certificats." },
      { acronym: "age", expansion: "age encryption tool", meaning: "Outil de chiffrement de fichiers utilisé pour les sauvegardes chiffrées." }
    ],
    nextTitle: "Conditions de clôture", nextSteps: [
      "Vérifier les deux clés en lecture seule et enregistrer des résultats expurgés datés.",
      "Enrôler la clé secondaire dans chaque service critique et valider un accès de reprise.",
      "Réparer la chaîne PIV/les certificats et les deux sauvegardes age indépendantes avant tout changement destructif.",
      "Tester KeePassXC et conduire un exercice complet de restauration."
    ],
    glossaryLink: "Lexique général de sécurité", sourceLabel: "Documentation de référence"
  },
  en: {
    meta: { title: "YubiKey: architecture, setup and recovery | Security",
      description: "Public overview of FIDO2, SSH, PIV, OpenPGP, OTP, dual-key recovery, with an interactive graph and acronym glossary." },
    back: "Back to Security", eyebrow: "Hardware authentication and continuity",
    title: "Configure two YubiKeys without losing access",
    lead: "A primary key for daily use and a separate backup key for recovery. This page describes the intended architecture and read-only verification, not a live device inventory.",
    disclaimer: "Public conceptual diagram. No serial numbers, PINs/PUKs, OTP seeds, private keys, personal certificates, escrow paths or account identifiers are published. 'Documented' reflects a past observation, not a check performed today.",
    diagramTitle: "Authentication and recovery graph",
    diagramLead: "Select a node to explore its role. Links describe intended dependencies, not automatic synchronization of private keys between devices.",
    accessibleGraph: "Accessible list of diagram relationships",
    graphRoles: {
      workstation: "Trusted workstation", primary: "Primary YubiKey", backup: "Backup YubiKey",
      webauthn: "WebAuthn accounts", ssh: "SSH access", piv: "PIV certificates",
      openpgp: "OpenPGP signing", otp: "OTP / HMAC", recovery: "Recovery rehearsals",
      escrow: "Encrypted age escrow", vault: "KeePassXC"
    },
    graphEdges: { primary: "daily usage", backup: "independent recovery",
      webauthn: "FIDO2 authentication", ssh: "FIDO SSH key", piv: "certificate and PIV key",
      openpgp: "signing and encryption", otp: "challenge-response", recovery: "read-only checks",
      escrow: "verified restoration", vault: "unlock to be tested" },
    keyLegend: "The backup YubiKey must be enrolled separately with each service; its private keys are not cloned automatically.",
    workflowTitle: "Configuration plan and validation",
    stateLabels: { observed: "Documented", planned: "Planned", blocked: "Blocked" },
    steps: [
      { title: "Read-only device inventory", text: "Inspect USB/NFC, firmware and FIDO2, OTP, PIV and OpenPGP capabilities on both devices without changing slots.", state: "observed" },
      { title: "FIDO2 / WebAuthn", text: "Enroll both keys separately on each critical account, retain an independent recovery method, and test sign-in with each.", state: "planned" },
      { title: "Touch-confirmed SSH", text: "Keep a dedicated backup hardware SSH key (ed25519-sk), verify touch and PIN requirements, and test access non-destructively.", state: "observed" },
      { title: "PIV and certificates", text: "Inspect slots (including 9A and 82), expiration and trust chain; renew expired certificates only after backup and explicit authorization.", state: "blocked" },
      { title: "OpenPGP / GPG agent", text: "Document OpenPGP and GPG-agent/pcscd integration; distinguish PIV certificates, OpenPGP subkeys and FIDO-backed SSH.", state: "planned" },
      { title: "HMAC-SHA1 OTP", text: "Keep the legacy challenge-response mechanism separate from FIDO2. Validate the slot and client without revealing or reprogramming the secret.", state: "observed" },
      { title: "Independent encrypted backups", text: "Create two separate age archives; validate fingerprints and recovery paths without secrets in logs. Stop if both backups refer to the same file.", state: "blocked" },
      { title: "KeePassXC and rotation", text: "Verify unlock using the primary key and a backup scenario; document dependencies and rotation after loss.", state: "planned" },
      { title: "Recovery drill", text: "Simulate losing the primary key: critical accounts, SSH, vault, certificates, archive recovery and redacted evidence.", state: "planned" }
    ],
    safetyTitle: "Security rules",
    safety: [
      "Never change PIN, PUK, PIV management key, OTP slots or private keys in an automated diagnostic.",
      "Never publish secrets, hardware identifiers, personal certificates, backup contents or private paths in Git or on a public page.",
      "Enroll, test and store the backup key independently with its own PIN.",
      "Distinguish configured, last-known working and unverified. A read-only test does not prove recovery."
    ],
    glossaryTitle: "Acronym glossary", glossaryLead: "Terms used throughout the diagram and plan.",
    terms: [
      { acronym: "FIDO2", expansion: "Fast IDentity Online 2", meaning: "Strong authentication standard with hardware keys, including passwordless sign-in." },
      { acronym: "WebAuthn", expansion: "Web Authentication", meaning: "Browser API to register and authenticate a security key." },
      { acronym: "CTAP", expansion: "Client to Authenticator Protocol", meaning: "Protocol between the client system and a hardware authenticator." },
      { acronym: "SSH", expansion: "Secure Shell", meaning: "Remote access protocol; the -sk key type uses a FIDO authenticator." },
      { acronym: "PIV", expansion: "Personal Identity Verification", meaning: "Smartcard application for certificate-based authentication and cryptographic operations." },
      { acronym: "PKCS#11", expansion: "Public-Key Cryptography Standards #11", meaning: "Standard interface to cryptographic modules and smartcard objects." },
      { acronym: "GPG", expansion: "GNU Privacy Guard", meaning: "Software to manage OpenPGP keys and signatures." },
      { acronym: "OpenPGP", expansion: "Open Pretty Good Privacy", meaning: "Open standard for signing and encrypting data." },
      { acronym: "OTP", expansion: "One-Time Password", meaning: "Single-use password; not the same as WebAuthn." },
      { acronym: "HMAC", expansion: "Hash-based Message Authentication Code", meaning: "Authentication code derived from a secret key and hash function." },
      { acronym: "SHA-1", expansion: "Secure Hash Algorithm 1", meaning: "Legacy hash function used by some challenge-response modes; not a recommendation for new digital signatures." },
      { acronym: "NFC", expansion: "Near Field Communication", meaning: "Short-range radio communication with phones and readers." },
      { acronym: "PIN", expansion: "Personal Identification Number", meaning: "Personal code protecting key access." },
      { acronym: "PUK", expansion: "PIN Unblocking Key", meaning: "Unlock code for the PIV application, kept offline." },
      { acronym: "CA", expansion: "Certificate Authority", meaning: "Authority issuing or signing certificates." },
      { acronym: "age", expansion: "age encryption tool", meaning: "File encryption tool used for encrypted recovery archives." }
    ],
    nextTitle: "Exit criteria", nextSteps: [
      "Read-only inventory both keys and record dated, redacted results.",
      "Enroll the backup separately on every critical service and validate recovery access.",
      "Repair the PIV trust chain/certificates and independent age backups before destructive changes.",
      "Test KeePassXC and perform one complete restoration drill."
    ],
    glossaryLink: "General security glossary", sourceLabel: "Reference documentation"
  }
};
