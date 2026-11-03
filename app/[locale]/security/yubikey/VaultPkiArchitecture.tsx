import type { AppLocale } from "@/i18n/routing";
import styles from "./VaultPkiArchitecture.module.css";

/** Planned design only: no card inventory, certificate subjects or private material. */
export default function VaultPkiArchitecture({
	locale,
}: Readonly<{ locale: AppLocale }>) {
	const fr = locale === "fr";
	const labels = {
		title: fr
			? "Vault PKI et certificats PIV"
			: "Vault PKI and PIV certificates",
		intro: fr
			? "Architecture cible, non déployée : chaque YubiKey conserve sa clé privée. Vault signe uniquement les demandes de certificat (CSR) et publie les certificats et les informations de révocation."
			: "Target design, not deployed: each YubiKey retains its private key. Vault signs certificate requests (CSRs) and publishes certificates and revocation information.",
		planned: fr ? "Architecture envisagée" : "Planned architecture",
		root: fr ? "CA racine hors ligne" : "Offline root CA",
		issue: fr ? "CA intermédiaire / CRL / audit" : "Issuing CA / CRL / audit",
		primary: fr ? "YubiKey principale" : "Primary YubiKey",
		backup: fr ? "YubiKey de secours" : "Backup YubiKey",
		clients: fr ? "Clients / vérification CRL" : "Clients / CRL validation",
		process: fr ? "Cycle de vie du certificat" : "Certificate lifecycle",
		footer: fr
			? "Deux clés distinctes nécessitent deux paires de clés et deux certificats. Les certificats professionnels restent gouvernés par la PKI de l’entreprise. Ce guide n’effectue aucune écriture sur les YubiKey."
			: "Two separate security keys require distinct key pairs and certificates. Corporate credentials remain governed by enterprise PKI. This guide does not write to either YubiKey.",
		detail: fr
			? "Consulter la roadmap technique"
			: "Read the technical roadmap",
	};
	const flow = fr
		? [
				{
					title: "Déléguer l’émission",
					description:
						"La CA racine hors ligne délègue la signature à une autorité intermédiaire Vault PKI.",
				},
				{
					title: "Créer les demandes",
					description:
						"Chaque YubiKey génère sa propre clé privée PIV 9A et émet sa demande CSR, sans exporter la clé privée.",
				},
				{
					title: "Signer et vérifier",
					description:
						"Vault signe les deux CSR. Les clients vérifient la chaîne X.509 et l’état de révocation (CRL).",
				},
				{
					title: "Renouveler ou révoquer",
					description:
						"Chaque certificat dispose de son propre cycle de vie et peut être renouvelé ou révoqué indépendamment.",
				},
			]
		: [
				{
					title: "Delegate issuance",
					description:
						"An offline root CA delegates signing to a Vault PKI intermediate issuing authority.",
				},
				{
					title: "Generate requests",
					description:
						"Each YubiKey creates its own private PIV 9A key and CSR without exporting private material.",
				},
				{
					title: "Sign and validate",
					description:
						"Vault signs both CSRs. Clients verify the X.509 chain and certificate revocation status (CRL).",
				},
				{
					title: "Renew or revoke",
					description:
						"Each certificate has an independent lifecycle and can be renewed or revoked separately.",
				},
			];

	return (
		<section
			id="yubikey-vault-pki"
			aria-labelledby="yubikey-vault-pki-title"
			className={styles.section}
		>
			<div className={styles.header}>
				<h2 id="yubikey-vault-pki-title">{labels.title}</h2>
				<span className={styles.planned}>{labels.planned}</span>
			</div>
			<p className={styles.intro}>{labels.intro}</p>
			<div className={styles.diagramFrame} aria-hidden="true">
				<svg viewBox="0 0 760 425" className={styles.diagram} focusable="false">
					<defs>
						<marker
							id="vault-pki-flow-arrow"
							markerWidth="8"
							markerHeight="8"
							refX="7"
							refY="4"
							orient="auto"
						>
							<path d="M0 0 L8 4 L0 8Z" fill="#b5d6e9" />
						</marker>
					</defs>
					<g
						fill="none"
						stroke="#b5d6e9"
						strokeWidth="2"
						markerEnd="url(#vault-pki-flow-arrow)"
					>
						<path d="M380 65 V112" />
						<path d="M240 175 H145 V263" />
						<path d="M520 175 H615 V263" />
						<path d="M380 202 V285" />
					</g>
					<g fill="#182b3b" stroke="#6fa6c9" strokeWidth="2">
						<rect x="242" y="12" width="276" height="53" rx="10" />
						<rect x="240" y="112" width="280" height="90" rx="10" />
						<rect x="18" y="263" width="254" height="78" rx="10" />
						<rect x="488" y="263" width="254" height="78" rx="10" />
						<rect x="275" y="285" width="210" height="56" rx="10" />
					</g>
					<g fill="#f5fafc" textAnchor="middle" fontSize="17" fontWeight="600">
						<text x="380" y="44">
							{labels.root}
						</text>
						<text x="380" y="146">
							HashiCorp Vault PKI
						</text>
						<text x="380" y="173" fontSize="13" fontWeight="400">
							{labels.issue}
						</text>
						<text x="145" y="293">
							{labels.primary}
						</text>
						<text x="145" y="317" fontSize="13" fontWeight="400">
							PIV 9A / X.509
						</text>
						<text x="615" y="293">
							{labels.backup}
						</text>
						<text x="615" y="317" fontSize="13" fontWeight="400">
							PIV 9A / X.509
						</text>
						<text x="380" y="319" fontSize="13">
							{labels.clients}
						</text>
					</g>
					<text
						x="380"
						y="386"
						fill="#f5fafc"
						textAnchor="middle"
						fontSize="14"
					>
						{fr
							? "Aucune clé privée transférée à Vault"
							: "No private key sent to Vault"}
					</text>
				</svg>
			</div>
			<h3 className={styles.flowTitle}>{labels.process}</h3>
			<ol className={styles.flow}>
				{flow.map((step, index) => (
					<li key={step.title} className={styles.flowStep}>
						<span className={styles.stepNumber} aria-hidden="true">
							{String(index + 1).padStart(2, "0")}
						</span>
						<strong>{step.title}</strong>
						<p>{step.description}</p>
					</li>
				))}
			</ol>
			<p className={styles.note}>{labels.footer}</p>
			<p className={styles.link}>
				<a
					href="https://github.com/AlbanAndrieu/nabla-yubikey/blob/master/docs/roadmap-vault-pki.md"
					target="_blank"
					rel="noopener noreferrer"
				>
					{labels.detail}
				</a>
			</p>
		</section>
	);
}
