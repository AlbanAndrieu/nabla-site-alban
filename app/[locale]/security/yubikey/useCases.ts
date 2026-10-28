/** Public examples: no secrets, device identifiers or environment-specific hosts. */
export type UseCase = {
  id: string;
  level: "common" | "advanced";
  mechanism: string;
  title: string;
  purpose: string;
  prerequisites: string;
  code: string;
  caution: string;
  source: { url: string; label: string };
};

export const USE_CASES: Record<"fr" | "en", readonly UseCase[]> = {
  "fr": [
    {
      "id": "mfa-webauthn",
      "level": "common",
      "mechanism": "FIDO2 / WebAuthn",
      "title": "MFA sur les comptes critiques",
      "purpose": "Enrôler séparément les deux YubiKey sur GitHub, Cloudflare ou un fournisseur d'identité compatible. Tester ensuite chacune des clés.",
      "prerequisites": "Compte compatible WebAuthn, accès déjà rétabli et méthode de récupération indépendante.",
      "code": "",
      "caution": "Enregistrement depuis les paramètres de sécurité du service : ajouter une clé principale puis une clé de secours. Éviter toute dépendance à un seul appareil.",
      "source": {
        "url": "https://fidoalliance.org/fido2/",
        "label": "FIDO Alliance"
      }
    },
    {
      "id": "ssh-fido",
      "level": "common",
      "mechanism": "OpenSSH / FIDO2",
      "title": "Connexion SSH sur serveur ou workstation",
      "purpose": "Utiliser une identité matérielle ed25519-sk déjà enregistrée sur le serveur ; l'opération demande généralement le toucher de la clé et éventuellement un PIN.",
      "prerequisites": "OpenSSH avec prise en charge FIDO, clé publique déjà autorisée dans authorized_keys et méthode de secours SSH indépendante.",
      "code": "ssh -V\nssh -i ~/.ssh/id_ed25519_sk user@host.example",
      "caution": "Ne pas remplacer la seule identité SSH fonctionnelle. La clé locale est un handle, pas une copie de la clé privée.",
      "source": {
        "url": "https://developers.yubico.com/SSH/Securing_SSH_with_FIDO2.html",
        "label": "Yubico SSH FIDO2"
      }
    },
    {
      "id": "ssh-git-sign",
      "level": "advanced",
      "mechanism": "FIDO2 / Git / SSH",
      "title": "Signature Git avec une clé SSH FIDO",
      "purpose": "Signer un commit avec une identité SSH matérielle dédiée, distincte de l'authentification SSH si possible.",
      "prerequisites": "Clé de signature ed25519-sk existante ; clé publique enregistrée comme clé de signature dans GitHub ; Git compatible.",
      "code": "git config --local gpg.format ssh\ngit config --local user.signingkey \"$HOME/.ssh/id_ed25519_sk_git_signing.pub\"\ngit config --local commit.gpgsign true",
      "caution": "Ces commandes modifient la configuration Git locale. Ne pas affirmer qu'un commit est Verified sans vérification côté forge.",
      "source": {
        "url": "https://developers.yubico.com/SSH/Securing_git_with_SSH_and_FIDO2.html",
        "label": "Yubico Git FIDO2"
      }
    },
    {
      "id": "gpg-git",
      "level": "advanced",
      "mechanism": "OpenPGP / GPG",
      "title": "Signature GPG des commits et tags Git",
      "purpose": "Utiliser une sous-clé de signature OpenPGP présente dans la YubiKey ; git appelle gpg-agent et exige éventuellement toucher/PIN.",
      "prerequisites": "Sous-clé OpenPGP et gpg-agent opérationnels ; empreinte de clé publique vérifiée.",
      "code": "gpg --card-status\ngit config --local gpg.format openpgp\ngit config --local user.signingkey \"$GPG_SIGNING_FINGERPRINT\"\ngit config --local commit.gpgsign true",
      "caution": "Ne pas confondre clé PIV, sous-clé OpenPGP et clé SSH FIDO. Aucun changement de PIN ou de sous-clé automatisé.",
      "source": {
        "url": "https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits",
        "label": "GitHub signing commits"
      }
    },
    {
      "id": "sops-age",
      "level": "common",
      "mechanism": "SOPS / age",
      "title": "Secrets de développement chiffrés sur la workstation",
      "purpose": "Stocker la configuration sensible chiffrée dans Git et l'injecter à la demande sans publier le clair. SOPS utilise un destinataire age, qui peut être logiciel ou fourni par un plugin YubiKey.",
      "prerequisites": "Fichier déjà chiffré, destinataire déclaré dans .sops.yaml, identité age accessible et commande de développement autorisée.",
      "code": "sops edit config/dev.enc.yaml\nsops exec-env config/dev.enc.yaml 'just dev-up'",
      "caution": "Ne jamais committer un fichier .env en clair ni afficher les variables en console. Une identité age logicielle n'est pas automatiquement protégée par la YubiKey.",
      "source": {
        "url": "https://getsops.io/docs/",
        "label": "SOPS"
      }
    },
    {
      "id": "age-piv-plugin",
      "level": "advanced",
      "mechanism": "age-plugin-yubikey / PIV",
      "title": "Chiffrement de fichiers avec une clé age matérielle",
      "purpose": "Après une configuration autorisée du plugin age-plugin-yubikey, chiffrer pour un destinataire issu du matériel et déchiffrer à l'aide de l'identité de plugin.",
      "prerequisites": "Plugin installé, slot PIV prévu et validé, fichier d'identité du plugin sauvegardé, destinataire vérifié et politique de reprise indépendante.",
      "code": "age-plugin-yubikey --list\nage -r \"$AGE_YUBIKEY_RECIPIENT\" -o artifact.age artifact.txt\nage -d -i \"$AGE_YUBIKEY_IDENTITY_FILE\" artifact.age | sha256sum",
      "caution": "La génération initiale de l'identité peut modifier le slot PIV : ne pas l'exécuter sans validation. Une identité sur clé USB n'est pas une clé privée PIV résidente.",
      "source": {
        "url": "https://github.com/str4d/age-plugin-yubikey",
        "label": "age-plugin-yubikey"
      }
    },
    {
      "id": "postgres-age",
      "level": "advanced",
      "mechanism": "PostgreSQL / age",
      "title": "Sauvegarde PostgreSQL chiffrée en flux",
      "purpose": "Chiffrer un dump PostgreSQL sans créer de fichier intermédiaire en clair. Destiner le flux à plusieurs clés de reprise indépendantes.",
      "prerequisites": "Droits pg_dump limités, destinataires age validés dans recipients.txt, destination de backup sécurisée et test de restauration planifié.",
      "code": "set -o pipefail\npg_dump -Fc --no-owner \"$PGDATABASE\" | age -R recipients.txt -o postgres.dump.age\nage -d -i \"$AGE_IDENTITY_FILE\" postgres.dump.age | pg_restore --list",
      "caution": "Le listing ne remplace pas une restauration réelle isolée. Utiliser des destinataires indépendants et contrôler le code de retour de chaque étape.",
      "source": {
        "url": "https://www.postgresql.org/docs/current/app-pgdump.html",
        "label": "PostgreSQL pg_dump"
      }
    },
    {
      "id": "gpg-backup-sign",
      "level": "advanced",
      "mechanism": "OpenPGP / PostgreSQL",
      "title": "Signature GPG d'une sauvegarde PostgreSQL",
      "purpose": "Apposer une signature détachée sur une sauvegarde déjà chiffrée afin de contrôler l'origine et l'intégrité avant restauration.",
      "prerequisites": "Sous-clé GPG de signature accessible sur YubiKey, fichier postgres.dump.age déjà produit et copie fiable de la clé publique.",
      "code": "gpg --local-user "$GPG_SIGNING_FINGERPRINT" --detach-sign --armor --output postgres.dump.age.asc postgres.dump.age\ngpg --verify postgres.dump.age.asc postgres.dump.age",
      "caution": "La signature ne chiffre pas le backup. Valider l'empreinte du signataire et vérifier avant toute restauration.",
      "source": {
        "url": "https://www.gnupg.org/documentation/manuals/gnupg/GPG-Esoteric-Options.html",
        "label": "GnuPG"
      }
    },
    {
      "id": "piv-certs",
      "level": "common",
      "mechanism": "PIV / PKCS#11 / X.509",
      "title": "Certificats d'authentification et de signature",
      "purpose": "Inspecter le certificat d'authentification PIV (slot 9a), son expiration, son émetteur et les usages autorisés. Pour l'usage client TLS, configurer le middleware PKCS#11.",
      "prerequisites": "YubiKey accessible, ykman installé, certificat existant ; chaîne d'autorité de certification approuvée.",
      "code": "ykman piv info\nykman piv certificates export 9a auth-public.pem\nopenssl x509 -in auth-public.pem -noout -subject -issuer -dates",
      "caution": "L'export ne contient que le certificat public, mais peut révéler une identité personnelle. Ne pas publier dans Git ; ne pas régénérer les clés en diagnostic.",
      "source": {
        "url": "https://docs.yubico.com/software/yubikey/tools/ykman/PIV_Commands.html",
        "label": "Yubico PIV"
      }
    },
    {
      "id": "vaultwarden",
      "level": "common",
      "mechanism": "Vaultwarden / WebAuthn",
      "title": "MFA du coffre Vaultwarden",
      "purpose": "Activer WebAuthn/FIDO2 pour la connexion au coffre, puis enregistrer la seconde clé séparément et vérifier les codes de récupération hors ligne.",
      "prerequisites": "Instance et client compatibles, session de secours, code de récupération conservé hors ligne.",
      "code": "",
      "caution": "Dans les paramètres du compte, activer la connexion en deux étapes WebAuthn puis enregistrer et tester les deux clés.",
      "source": {
        "url": "https://bitwarden.com/help/setup-two-step-login/",
        "label": "Bitwarden two-step login"
      }
    },
    {
      "id": "hashicorp-vault",
      "level": "advanced",
      "mechanism": "HashiCorp Vault / OIDC",
      "title": "Vault via fédération d'identité",
      "purpose": "Faire protéger l'accès humain à HashiCorp Vault par un fournisseur OIDC qui impose FIDO2/WebAuthn ; Vault peut également appliquer sa propre MFA selon les méthodes prises en charge.",
      "prerequisites": "Méthode OIDC configurée dans Vault et MFA imposée en amont par l'IdP.",
      "code": "vault login -method=oidc",
      "caution": "Vault ne prend pas automatiquement WebAuthn en MFA native. Ne pas confondre MFA du fournisseur d'identité et politique MFA interne à Vault.",
      "source": {
        "url": "https://developer.hashicorp.com/vault/docs/auth/login-mfa",
        "label": "HashiCorp Vault MFA"
      }
    },
    {
      "id": "keepassxc",
      "level": "common",
      "mechanism": "KeePassXC / OTP HMAC-SHA1",
      "title": "Déverrouillage KeePassXC par défi-réponse",
      "purpose": "Associer une base KeePassXC au mécanisme HMAC-SHA1 du slot OTP de la YubiKey. Prévoir la reprise indépendamment de la clé principale.",
      "prerequisites": "Slot défi-réponse existant, KeePassXC compatible, copie de test de la base et procédure de reprise validée.",
      "code": "",
      "caution": "Ne jamais reprogrammer le slot OTP sans sauvegarde du secret. Deux clés distinctes ne déverrouillent pas automatiquement la même base.",
      "source": {
        "url": "https://keepassxc.org/docs/",
        "label": "KeePassXC"
      }
    },
    {
      "id": "yubico-totp",
      "level": "common",
      "mechanism": "OATH-TOTP / Yubico Authenticator",
      "title": "Codes temporaires de seconde authentification",
      "purpose": "Conserver les secrets OATH-TOTP dans la YubiKey et afficher les codes via Yubico Authenticator, si le service ne prend pas WebAuthn en charge.",
      "prerequisites": "Application OATH configurée, service compatible TOTP et méthode de secours.",
      "code": "",
      "caution": "Le TOTP est moins résistant à l'hameçonnage que WebAuthn. OATH-TOTP et le slot OTP HMAC-SHA1 KeePassXC sont deux applications différentes.",
      "source": {
        "url": "https://docs.yubico.com/software/yubikey/tools/authenticator/",
        "label": "Yubico Authenticator"
      }
    }
  ],
  "en": [
    {
      "id": "mfa-webauthn",
      "level": "common",
      "mechanism": "FIDO2 / WebAuthn",
      "title": "MFA for critical accounts",
      "purpose": "Enroll both YubiKeys separately on GitHub, Cloudflare, or another WebAuthn-compatible identity provider. Test each key independently.",
      "prerequisites": "Compatible account, existing working access, and independent recovery method.",
      "code": "",
      "caution": "Use the service security settings: register the primary and backup keys separately. Do not depend on one authenticator.",
      "source": {
        "url": "https://fidoalliance.org/fido2/",
        "label": "FIDO Alliance"
      }
    },
    {
      "id": "ssh-fido",
      "level": "common",
      "mechanism": "OpenSSH / FIDO2",
      "title": "SSH login to a host or workstation",
      "purpose": "Use an already-enrolled ed25519-sk hardware identity. Authentication normally requires touch and optionally PIN.",
      "prerequisites": "FIDO-enabled OpenSSH, public key registered in authorized_keys, and independent SSH recovery access.",
      "code": "ssh -V\nssh -i ~/.ssh/id_ed25519_sk user@host.example",
      "caution": "Do not replace the only working SSH access. The local key file is a handle, not the hardware private key.",
      "source": {
        "url": "https://developers.yubico.com/SSH/Securing_SSH_with_FIDO2.html",
        "label": "Yubico SSH FIDO2"
      }
    },
    {
      "id": "ssh-git-sign",
      "level": "advanced",
      "mechanism": "FIDO2 / Git / SSH",
      "title": "Hardware SSH Git commit signing",
      "purpose": "Sign commits with a dedicated FIDO-backed SSH identity, preferably separate from the SSH login key.",
      "prerequisites": "Existing ed25519-sk signing identity; public key registered for signing on GitHub; compatible Git.",
      "code": "git config --local gpg.format ssh\ngit config --local user.signingkey \"$HOME/.ssh/id_ed25519_sk_git_signing.pub\"\ngit config --local commit.gpgsign true",
      "caution": "These commands change repository-local Git settings. A GitHub Verified badge still requires server-side verification.",
      "source": {
        "url": "https://developers.yubico.com/SSH/Securing_git_with_SSH_and_FIDO2.html",
        "label": "Yubico Git FIDO2"
      }
    },
    {
      "id": "gpg-git",
      "level": "advanced",
      "mechanism": "OpenPGP / GPG",
      "title": "GPG-signed Git commits and tags",
      "purpose": "Use an OpenPGP signing subkey stored on the YubiKey. Git invokes gpg-agent and may require touch/PIN.",
      "prerequisites": "Working OpenPGP signing subkey and gpg-agent; verified public fingerprint.",
      "code": "gpg --card-status\ngit config --local gpg.format openpgp\ngit config --local user.signingkey \"$GPG_SIGNING_FINGERPRINT\"\ngit config --local commit.gpgsign true",
      "caution": "Do not confuse PIV, OpenPGP, and FIDO-backed SSH keys. Do not automate PIN or key changes.",
      "source": {
        "url": "https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits",
        "label": "GitHub signing commits"
      }
    },
    {
      "id": "sops-age",
      "level": "common",
      "mechanism": "SOPS / age",
      "title": "Encrypted workstation development secrets",
      "purpose": "Keep sensitive configuration encrypted in Git and inject it only when needed. SOPS uses an age recipient, either software-based or via a YubiKey plugin.",
      "prerequisites": "Already encrypted file, recipient configured in .sops.yaml, accessible age identity, approved local dev command.",
      "code": "sops edit config/dev.enc.yaml\nsops exec-env config/dev.enc.yaml 'just dev-up'",
      "caution": "Never commit plaintext .env files or print environment secrets. Software age identities are not automatically YubiKey-backed.",
      "source": {
        "url": "https://getsops.io/docs/",
        "label": "SOPS"
      }
    },
    {
      "id": "age-piv-plugin",
      "level": "advanced",
      "mechanism": "age-plugin-yubikey / PIV",
      "title": "Hardware-backed file encryption with age",
      "purpose": "After explicitly approved age-plugin-yubikey provisioning, encrypt for the hardware recipient and decrypt with the plugin identity file.",
      "prerequisites": "Installed plugin, approved PIV slot, backed-up plugin identity file, verified recipient, independent recovery plan.",
      "code": "age-plugin-yubikey --list\nage -r \"$AGE_YUBIKEY_RECIPIENT\" -o artifact.age artifact.txt\nage -d -i \"$AGE_YUBIKEY_IDENTITY_FILE\" artifact.age | sha256sum",
      "caution": "Initial plugin setup can mutate a PIV slot: never run it without approval. An identity stored on a USB drive is not automatically hardware-resident.",
      "source": {
        "url": "https://github.com/str4d/age-plugin-yubikey",
        "label": "age-plugin-yubikey"
      }
    },
    {
      "id": "postgres-age",
      "level": "advanced",
      "mechanism": "PostgreSQL / age",
      "title": "Stream-encrypted PostgreSQL backup",
      "purpose": "Encrypt a pg_dump stream directly without creating an intermediate plaintext dump. Use multiple independent recovery recipients.",
      "prerequisites": "Restricted pg_dump permissions, verified age recipients in recipients.txt, secured backup storage, planned recovery drill.",
      "code": "set -o pipefail\npg_dump -Fc --no-owner \"$PGDATABASE\" | age -R recipients.txt -o postgres.dump.age\nage -d -i \"$AGE_IDENTITY_FILE\" postgres.dump.age | pg_restore --list",
      "caution": "Listing an archive is not a full restore test. Use independent recovery recipients and verify pipeline exit status.",
      "source": {
        "url": "https://www.postgresql.org/docs/current/app-pgdump.html",
        "label": "PostgreSQL pg_dump"
      }
    },
    {
      "id": "gpg-backup-sign",
      "level": "advanced",
      "mechanism": "OpenPGP / PostgreSQL",
      "title": "GPG signing a PostgreSQL backup",
      "purpose": "Add a detached signature to an already encrypted archive to verify origin and integrity before a restore.",
      "prerequisites": "YubiKey-accessible GPG signing subkey, existing postgres.dump.age file, trusted signer public key.",
      "code": "gpg --local-user "$GPG_SIGNING_FINGERPRINT" --detach-sign --armor --output postgres.dump.age.asc postgres.dump.age\ngpg --verify postgres.dump.age.asc postgres.dump.age",
      "caution": "A signature does not encrypt a backup. Check the signer fingerprint and verify before restoring.",
      "source": {
        "url": "https://www.gnupg.org/documentation/manuals/gnupg/GPG-Esoteric-Options.html",
        "label": "GnuPG"
      }
    },
    {
      "id": "piv-certs",
      "level": "common",
      "mechanism": "PIV / PKCS#11 / X.509",
      "title": "PIV authentication and signing certificates",
      "purpose": "Inspect the slot 9a authentication certificate, its issuer and expiration. For TLS client authentication, configure PKCS#11 middleware.",
      "prerequisites": "Connected YubiKey, ykman installed, existing certificate, approved trust chain.",
      "code": "ykman piv info\nykman piv certificates export 9a auth-public.pem\nopenssl x509 -in auth-public.pem -noout -subject -issuer -dates",
      "caution": "Export is public certificate only, but may expose personal identity information. Do not publish; never regenerate keys during diagnostics.",
      "source": {
        "url": "https://docs.yubico.com/software/yubikey/tools/ykman/PIV_Commands.html",
        "label": "Yubico PIV"
      }
    },
    {
      "id": "vaultwarden",
      "level": "common",
      "mechanism": "Vaultwarden / WebAuthn",
      "title": "Vaultwarden vault MFA",
      "purpose": "Use WebAuthn/FIDO2 for vault login, enroll a second key independently and verify offline recovery codes.",
      "prerequisites": "Compatible server/client, recovery session, securely stored recovery code.",
      "code": "",
      "caution": "In account settings, turn on WebAuthn two-step login and independently enroll and test both keys.",
      "source": {
        "url": "https://bitwarden.com/help/setup-two-step-login/",
        "label": "Bitwarden two-step login"
      }
    },
    {
      "id": "hashicorp-vault",
      "level": "advanced",
      "mechanism": "HashiCorp Vault / OIDC",
      "title": "Vault login through an identity provider",
      "purpose": "Protect human HashiCorp Vault login with an OIDC identity provider enforcing FIDO2/WebAuthn; Vault can also apply supported native MFA methods.",
      "prerequisites": "Configured OIDC method in Vault and upstream identity provider enforcing FIDO2.",
      "code": "vault login -method=oidc",
      "caution": "Vault does not automatically offer native WebAuthn MFA. Distinguish IdP MFA from Vault's built-in login MFA.",
      "source": {
        "url": "https://developer.hashicorp.com/vault/docs/auth/login-mfa",
        "label": "HashiCorp Vault MFA"
      }
    },
    {
      "id": "keepassxc",
      "level": "common",
      "mechanism": "KeePassXC / OTP HMAC-SHA1",
      "title": "KeePassXC challenge-response unlock",
      "purpose": "Bind a KeePassXC database to the YubiKey HMAC-SHA1 OTP challenge-response slot. Plan independent recovery.",
      "prerequisites": "Existing challenge-response slot, compatible KeePassXC, test copy of the database and validated recovery plan.",
      "code": "",
      "caution": "Never reprogram an OTP slot without secure secret backup. Separate keys cannot automatically unlock the same database.",
      "source": {
        "url": "https://keepassxc.org/docs/",
        "label": "KeePassXC"
      }
    },
    {
      "id": "yubico-totp",
      "level": "common",
      "mechanism": "OATH-TOTP / Yubico Authenticator",
      "title": "Time-based one-time passcodes",
      "purpose": "Keep OATH-TOTP credentials on the YubiKey and obtain codes through Yubico Authenticator when WebAuthn is unavailable.",
      "prerequisites": "Provisioned OATH app, TOTP-enabled service and recovery method.",
      "code": "",
      "caution": "TOTP is less phishing-resistant than WebAuthn. OATH-TOTP and the HMAC-SHA1 OTP challenge-response slot are separate applications.",
      "source": {
        "url": "https://docs.yubico.com/software/yubikey/tools/authenticator/",
        "label": "Yubico Authenticator"
      }
    }
  ]
};

export const USE_CASE_LABELS = {
  "fr": {
    "title": "Exemples d’utilisation : courants et avancés",
    "intro": "Commandes indicatives pour un environnement déjà configuré. Les variables entre $ et les noms de machines sont des exemples. Aucune opération de provisionnement de la YubiKey n'est déclenchée par cette page.",
    "common": "Courant",
    "advanced": "Avancé",
    "requires": "Prérequis",
    "caution": "Attention",
    "source": "Référence"
  },
  "en": {
    "title": "Use cases: everyday and advanced",
    "intro": "Illustrative commands for an already configured environment. Variables prefixed with $ and hostnames are examples. This page never provisions a physical YubiKey.",
    "common": "Common",
    "advanced": "Advanced",
    "requires": "Prerequisites",
    "caution": "Caution",
    "source": "Reference"
  }
} as const;
