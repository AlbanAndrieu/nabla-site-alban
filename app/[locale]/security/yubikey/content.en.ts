import type { GuideCopy } from "./content";

export const GUIDE_COPY_EN: GuideCopy = {
	meta: {
		title: "YubiKey: architecture, setup and recovery | Security",
		description:
			"Public overview of FIDO2, SSH, PIV, OpenPGP, OTP, dual-key recovery, with an interactive graph and acronym glossary.",
	},
	back: "Back to Security",
	eyebrow: "Hardware authentication and continuity",
	title: "Configure two YubiKeys without losing access",
	lead: "A primary key for daily use and a separate backup key for recovery. This page describes the intended architecture and read-only verification, not a live device inventory.",
	disclaimer:
		"Public conceptual diagram. No serial numbers, PINs/PUKs, OTP seeds, private keys, personal certificates, escrow paths or account identifiers are published. 'Documented' reflects a past observation, not a check performed today.",
	diagramTitle: "Authentication and recovery graph",
	diagramLead:
		"Select a node to explore its role. Links describe intended dependencies, not automatic synchronization of private keys between devices.",
	accessibleGraph: "Accessible list of diagram relationships",
	graphSelectorLabel: "Select a graph component",
	graphRoles: {
		workstation: "Trusted workstation",
		primary: "Primary YubiKey",
		backup: "Backup YubiKey",
		webauthn: "WebAuthn accounts",
		ssh: "SSH access",
		piv: "PIV certificates",
		openpgp: "OpenPGP signing",
		otp: "OTP / HMAC",
		recovery: "Recovery rehearsals",
		escrow: "Encrypted age escrow",
		vault: "KeePassXC",
	},
	graphEdges: {
		primary: "daily usage",
		backup: "independent recovery",
		webauthn: "FIDO2 authentication",
		ssh: "FIDO SSH key",
		piv: "certificate and PIV key",
		openpgp: "signing and encryption",
		otp: "challenge-response",
		recovery: "read-only checks",
		escrow: "verified restoration",
		vault: "unlock to be tested",
	},
	keyLegend:
		"The backup YubiKey must be enrolled separately with each service; its private keys are not cloned automatically.",
	workflowTitle: "Configuration plan and validation",
	stateLabels: {
		observed: "Documented",
		planned: "Planned",
		blocked: "Blocked",
	},
	steps: [
		{
			title: "Read-only device inventory",
			text: "Inspect USB/NFC, firmware and FIDO2, OTP, PIV and OpenPGP capabilities on both devices without changing slots.",
			state: "observed",
		},
		{
			title: "FIDO2 / WebAuthn",
			text: "Enroll both keys separately on each critical account, retain an independent recovery method, and test sign-in with each.",
			state: "planned",
		},
		{
			title: "Touch-confirmed SSH",
			text: "Keep a dedicated backup hardware SSH key (ed25519-sk), verify touch and PIN requirements, and test access non-destructively.",
			state: "observed",
		},
		{
			title: "PIV and certificates",
			text: "Inspect slots (including 9A and 82), expiration and trust chain; renew expired certificates only after backup and explicit authorization.",
			state: "blocked",
		},
		{
			title: "OpenPGP / GPG agent",
			text: "Document OpenPGP and GPG-agent/pcscd integration; distinguish PIV certificates, OpenPGP subkeys and FIDO-backed SSH.",
			state: "planned",
		},
		{
			title: "HMAC-SHA1 OTP",
			text: "Keep the legacy challenge-response mechanism separate from FIDO2. Validate the slot and client without revealing or reprogramming the secret.",
			state: "observed",
		},
		{
			title: "Independent encrypted backups",
			text: "Create two separate age archives; validate fingerprints and recovery paths without secrets in logs. Stop if both backups refer to the same file.",
			state: "blocked",
		},
		{
			title: "KeePassXC and rotation",
			text: "Verify unlock using the primary key and a backup scenario; document dependencies and rotation after loss.",
			state: "planned",
		},
		{
			title: "Recovery drill",
			text: "Simulate losing the primary key: critical accounts, SSH, vault, certificates, archive recovery and redacted evidence.",
			state: "planned",
		},
	],
	safetyTitle: "Security rules",
	safety: [
		"Never change PIN, PUK, PIV management key, OTP slots or private keys in an automated diagnostic.",
		"Never publish secrets, hardware identifiers, personal certificates, backup contents or private paths in Git or on a public page.",
		"Enroll, test and store the backup key independently with its own PIN.",
		"Distinguish configured, last-known working and unverified. A read-only test does not prove recovery.",
	],
	glossaryTitle: "Acronym glossary",
	glossaryLead: "Terms used throughout the diagram and plan.",
	terms: [
		{
			acronym: "FIDO2",
			expansion: "Fast IDentity Online 2",
			meaning:
				"Strong authentication standard with hardware keys, including passwordless sign-in.",
		},
		{
			acronym: "WebAuthn",
			expansion: "Web Authentication",
			meaning: "Browser API to register and authenticate a security key.",
		},
		{
			acronym: "CTAP",
			expansion: "Client to Authenticator Protocol",
			meaning:
				"Protocol between the client system and a hardware authenticator.",
		},
		{
			acronym: "SSH",
			expansion: "Secure Shell",
			meaning:
				"Remote access protocol; the -sk key type uses a FIDO authenticator.",
		},
		{
			acronym: "PIV",
			expansion: "Personal Identity Verification",
			meaning:
				"Smartcard application for certificate-based authentication and cryptographic operations.",
		},
		{
			acronym: "PKCS#11",
			expansion: "Public-Key Cryptography Standards #11",
			meaning:
				"Standard interface to cryptographic modules and smartcard objects.",
		},
		{
			acronym: "GPG",
			expansion: "GNU Privacy Guard",
			meaning: "Software to manage OpenPGP keys and signatures.",
		},
		{
			acronym: "OpenPGP",
			expansion: "Open Pretty Good Privacy",
			meaning: "Open standard for signing and encrypting data.",
		},
		{
			acronym: "OTP",
			expansion: "One-Time Password",
			meaning: "Single-use password; not the same as WebAuthn.",
		},
		{
			acronym: "HMAC",
			expansion: "Hash-based Message Authentication Code",
			meaning:
				"Authentication code derived from a secret key and hash function.",
		},
		{
			acronym: "SHA-1",
			expansion: "Secure Hash Algorithm 1",
			meaning:
				"Legacy hash function used by some challenge-response modes; not a recommendation for new digital signatures.",
		},
		{
			acronym: "NFC",
			expansion: "Near Field Communication",
			meaning: "Short-range radio communication with phones and readers.",
		},
		{
			acronym: "PIN",
			expansion: "Personal Identification Number",
			meaning: "Personal code protecting key access.",
		},
		{
			acronym: "PUK",
			expansion: "PIN Unblocking Key",
			meaning: "Unlock code for the PIV application, kept offline.",
		},
		{
			acronym: "CA",
			expansion: "Certificate Authority",
			meaning: "Authority issuing or signing certificates.",
		},
		{
			acronym: "age",
			expansion: "age encryption tool",
			meaning: "File encryption tool used for encrypted recovery archives.",
		},
		{
			acronym: "MFA",
			expansion: "Multi-Factor Authentication",
			meaning:
				"Authentication with multiple independent factors, for example a password and hardware key.",
		},
		{
			acronym: "SOPS",
			expansion: "Secrets OPerationS",
			meaning:
				"Editor and encryption tool for structured secrets, including age recipients.",
		},
		{
			acronym: "OIDC",
			expansion: "OpenID Connect",
			meaning:
				"Identity protocol built on OAuth 2.0, used for federated Vault login.",
		},
		{
			acronym: "IdP",
			expansion: "Identity Provider",
			meaning:
				"Provider authenticating users and optionally enforcing WebAuthn.",
		},
		{
			acronym: "OATH",
			expansion: "Initiative for Open Authentication",
			meaning:
				"Standards for authentication passcodes, distinct from the OTP challenge-response application.",
		},
		{
			acronym: "TOTP",
			expansion: "Time-based One-Time Password",
			meaning: "Short-lived time-based code, often six digits.",
		},
		{
			acronym: "TLS",
			expansion: "Transport Layer Security",
			meaning:
				"Protocol securing network connections, optionally using client certificates.",
		},
		{
			acronym: "X.509",
			expansion: "ITU-T X.509",
			meaning: "Standard for public-key certificate format and validation.",
		},
		{
			acronym: "SQL",
			expansion: "Structured Query Language",
			meaning: "Database language used by PostgreSQL.",
		},
	],
	nextTitle: "Exit criteria",
	nextSteps: [
		"Read-only inventory both keys and record dated, redacted results.",
		"Enroll the backup separately on every critical service and validate recovery access.",
		"Repair the PIV trust chain/certificates and independent age backups before destructive changes.",
		"Test KeePassXC and perform one complete restoration drill.",
	],
	glossaryLink: "General security glossary",
	sourceLabel: "Reference documentation",
};
