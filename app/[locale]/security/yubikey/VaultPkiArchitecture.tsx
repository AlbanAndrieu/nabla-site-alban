/** Public, conceptual diagram only. No serial numbers, certificate subjects or secret material. */
export default function VaultPkiArchitecture({ locale }: { locale: string }) {
	const fr = locale === "fr";
	const labels = {
		title: fr
			? "Vault PKI et certificats PIV"
			: "Vault PKI and PIV certificates",
		intro: fr
			? "Architecture cible (non déployée) : les clés privées restent dans chaque YubiKey. Vault signe uniquement une CSR, puis fournit le certificat public et les informations de révocation."
			: "Target architecture (not deployed): private keys stay on each YubiKey. Vault only signs a CSR, then provides the public certificate and revocation information.",
		root: fr ? "CA racine hors ligne" : "Offline Root CA",
		issue: fr ? "Vault PKI — CA intermédiaire" : "Vault PKI — Issuing CA",
		csr: fr ? "CSR : clé publique" : "CSR: public key",
		cert: fr ? "Certificat signé" : "Signed certificate",
		primary: fr ? "YubiKey primaire" : "Primary YubiKey",
		backup: fr ? "YubiKey secondaire" : "Backup YubiKey",
		clients: fr ? "Clients / vérification CRL" : "Clients / CRL verification",
		footer: fr
			? "Deux clés distinctes = deux paires de clés et deux certificats. Le PIV professionnel reste sous contrôle de la PKI de l’entreprise. Aucune écriture sur les YubiKey n’est prévue ici."
			: "Two separate security keys mean two key pairs and two certificates. Corporate PIV credentials remain under company PKI governance. No YubiKey writes are performed here.",
		detail: fr ? "Voir la roadmap technique" : "Read the technical roadmap",
	};
	return (
		<section
			id="yubikey-vault-pki"
			aria-labelledby="yubikey-vault-pki-title"
			style={{ marginBlock: "2rem" }}
		>
			<h2 id="yubikey-vault-pki-title">{labels.title}</h2>
			<p>{labels.intro}</p>
			<div style={{ overflowX: "auto", maxWidth: "100%" }}>
				<svg
					viewBox="0 0 760 425"
					role="img"
					aria-label={labels.intro}
					style={{
						display: "block",
						width: "100%",
						minWidth: 580,
						height: "auto",
					}}
				>
					<defs>
						<marker
							id="vault-arrow"
							markerWidth="8"
							markerHeight="8"
							refX="7"
							refY="4"
							orient="auto"
						>
							<path d="M0 0 L8 4 L0 8Z" fill="currentColor" />
						</marker>
					</defs>
					<g
						fill="none"
						stroke="currentColor"
						opacity=".75"
						strokeWidth="2"
						markerEnd="url(#vault-arrow)"
					>
						<path d="M380 65 V112" />
						<path d="M240 175 H145 V263" />
						<path d="M520 175 H617 V263" />
						<path d="M240 157 H145 V263" strokeDasharray="5 5" />
						<path d="M520 157 H617 V263" strokeDasharray="5 5" />
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
							{fr
								? "CA intermédiaire / CRL / audit"
								: "Issuing CA / CRL / audit"}
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
					<g fill="currentColor" fontSize="12" textAnchor="middle">
						<text x="122" y="226">
							{labels.csr} ↑
						</text>
						<text x="637" y="226">
							{labels.cert} ↓
						</text>
						<text x="380" y="239">
							CRL ↓
						</text>
					</g>
					<text
						x="380"
						y="385"
						fill="currentColor"
						textAnchor="middle"
						fontSize="14"
					>
						{fr
							? "Clés privées jamais transmises à Vault"
							: "Private keys are never transmitted to Vault"}
					</text>
				</svg>
			</div>
			<p>{labels.footer}</p>
			<p>
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
