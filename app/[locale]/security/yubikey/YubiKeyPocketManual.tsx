import type { AppLocale } from "@/i18n/routing";
import styles from "./YubiKeyPocketManual.module.css";

// Static, redacted documentation. Never turn this public component into a
// live hardware inventory or publish serials, private key paths or escrow data.
const copy = {
	fr: {
		title: "Mes deux YubiKey — mémo rapide",
		intro:
			"Vue de type ykman, fondée sur les contrôles du 31 octobre 2026. Ce n’est pas un inventaire en direct : chaque état reste limité au test réalisé.",
		keys: [
			{
				name: "Principale",
				connector: "USB-C · NFC · firmware 5.4.3",
				otp1: "Programmé · type à confirmer",
				otp2: "HMAC-SHA1 · ouverture KeePassXC validée",
				piv: "9A : inventaire à confirmer",
				fido: "SSH-sk : accès GitHub validé · autres comptes à vérifier",
			},
			{
				name: "Secours",
				connector: "USB-A · NFC · firmware 5.4.3",
				otp1: "Programmé · type à confirmer",
				otp2: "HMAC-SHA1 · ouverture KeePassXC validée",
				piv: "9A : certificat historique expiré · 82 libre au dernier contrôle",
				fido: "SSH-sk : clé créée · test GitHub final à refaire",
			},
		],
		slotsTitle: "Que font les deux touches / slots OTP ?",
		slotOne:
			"Slot 1 = appui court : déclenche la configuration OTP n° 1 (par exemple Yubico OTP ou mot de passe statique). Son type exact reste à vérifier.",
		slotTwo:
			"Slot 2 = appui long (~3 s) pour les sorties OTP clavier. Mais en mode HMAC-SHA1, KeePassXC envoie lui-même un défi à la clé : un appui long seul ne saisit aucun code. Un toucher de confirmation peut être requis.",
		slotNote:
			"Le toucher demandé par FIDO2, SSH ou PIV n’est pas un slot OTP. Les slots PIV 9A/82 sont encore un autre espace.",
		pinsTitle: "PIN, PUK : lequel et combien d’essais ?",
		headers: ["Protection", "Code d’usine", "Essais d’usine"],
		pins: [
			[
				"FIDO2 / passkeys",
				"Aucun PIN initial",
				"8 (réinsertion après 3 erreurs)",
			],
			["PIV : PIN", "123456", "3"],
			["PIV : PUK", "12345678", "3"],
			["OpenPGP : PIN utilisateur", "123456", "À lire sur la clé"],
			["OpenPGP : PIN administrateur", "12345678", "À lire sur la clé"],
		],
		pinsNote:
			"Ce sont des valeurs d’usine, jamais tes codes actuels. Le PUK PIV débloque uniquement le PIN PIV. OpenPGP possède son propre code de réinitialisation ; FIDO2 n’a pas de PUK. La clé de gestion PIV (AES-256 sur les clés inspectées) est distincte du PIN.",
		inspectTitle: "Comment vérifier les deux clés sans les modifier ?",
		inspectNote:
			"Brancher une seule clé à la fois. Les commandes lisent les métadonnées et les compteurs, sans entrer de PIN. Ne pas publier les sorties : elles peuvent contenir des identifiants.",
		filesTitle: "Où retrouver les fichiers et les sauvegardes ?",
		locations: [
			[
				"SSH FIDO2",
				"Création des deux clés SSH résidentes sur la workstation (~/.ssh). Le fichier _sk est un descripteur récupérable, pas la clé privée matérielle. Accès GitHub validé avec la principale ; test final de la secondaire à refaire.",
			],
			[
				"GPG / OpenPGP",
				"Trousseau logiciel et réglages GPG sur la workstation (~/.gnupg). Les clés GPG locales ne sont pas des clés OpenPGP matérielles : 0/3 emplacement rempli sur la carte examinée le 31/10. Sauvegarde GPG et reprise à valider.",
			],
			[
				"KeePassXC",
				"Base KDBX chiffrée conservée séparément de son fichier clé, situé localement sous ~/.local/share/keepassxc (mode 600). Copie NAS à actualiser et copie hors ligne du fichier clé encore à confirmer.",
			],
			[
				"SOPS / age",
				"La workstation peut charger son identité age depuis ~/.config/sops/age ou un fichier géré par mise : vérifier le destinataire exact avant restauration. L’identité de récupération séparée est sur la SanDisk LUKS2.",
			],
			[
				"Copies chiffrées",
				"Archive age sauvegardée sur TrueNAS et copie chiffrée sur la workstation, déjà comparées et testées avec la SanDisk. La copie indépendante de l’identité privée de la SanDisk reste à sécuriser.",
			],
		],
		manualLink:
			"Runbook précis : génération, noms des fichiers, montages, vérification et restauration",
		manualLink2: "État de migration et validations (nabla-yubikey)",
		lastNote:
			"Manuel public : seuls les emplacements génériques sont visibles ici. Les détails d’exploitation résident dans les runbooks ; aucune identité privée, aucun PIN ni contenu de coffre n’est affiché.",
		source: "Références Yubico :",
	},
	en: {
		title: "My two YubiKeys — quick reference",
		intro:
			"ykman-style view based on 31 October 2026 inspections, not a live scan. Each state only describes the specific check performed.",
		keys: [
			{
				name: "Primary",
				connector: "USB-C · NFC · firmware 5.4.3",
				otp1: "Configured · type to confirm",
				otp2: "HMAC-SHA1 · KeePassXC unlock verified",
				piv: "9A: inventory to confirm",
				fido: "SSH-sk: GitHub access verified · other accounts pending",
			},
			{
				name: "Backup",
				connector: "USB-A · NFC · firmware 5.4.3",
				otp1: "Configured · type to confirm",
				otp2: "HMAC-SHA1 · KeePassXC unlock verified",
				piv: "9A: expired legacy certificate · 82 clear at last inspection",
				fido: "SSH-sk: key created · final GitHub test pending",
			},
		],
		slotsTitle: "What do OTP slots 1 and 2 do?",
		slotOne:
			"Slot 1 = short touch: triggers OTP configuration 1 (such as Yubico OTP or a static password). The exact type remains unverified.",
		slotTwo:
			"Slot 2 = long touch (~3 s) for keyboard OTP output. In HMAC-SHA1 mode, KeePassXC sends a challenge to the key: a long touch alone does not type any code. An approval touch may be required.",
		slotNote:
			"FIDO2, SSH or PIV touch confirmation does not trigger an OTP slot. PIV slots 9A/82 are a separate namespace.",
		pinsTitle: "PIN and PUK: which one and how many retries?",
		headers: ["Protection", "Factory default", "Factory retry limit"],
		pins: [
			["FIDO2 / passkeys", "No default PIN", "8 (reinsert after 3 failures)"],
			["PIV PIN", "123456", "3"],
			["PIV PUK", "12345678", "3"],
			["OpenPGP user PIN", "123456", "Read from device"],
			["OpenPGP admin PIN", "12345678", "Read from device"],
		],
		pinsNote:
			"These are factory defaults, not the device's current codes. The PIV PUK only unblocks the PIV PIN. OpenPGP has its own reset code; FIDO2 has no PUK. The PIV management key (AES-256 on the inspected devices) is distinct from the PIN.",
		inspectTitle: "How to inspect each key without changing it",
		inspectNote:
			"Connect one key at a time. These commands read metadata and counters without entering a PIN. Do not publish output: it may contain identifiers.",
		filesTitle: "Where are the generated files and backups?",
		locations: [
			[
				"FIDO2 SSH",
				"Both resident SSH keys generated on the workstation (~/.ssh). The _sk file is a recoverable handle, not the hardware private key. GitHub access verified with the primary; final backup-key test pending.",
			],
			[
				"GPG / OpenPGP",
				"Software keyring and settings on the workstation (~/.gnupg). Local GPG keys are not hardware OpenPGP keys: 0/3 slots filled on the device examined on 31 Oct. GPG backup and recovery remain unverified.",
			],
			[
				"KeePassXC",
				"Encrypted KDBX database kept separate from its local key file under ~/.local/share/keepassxc (mode 600). The NAS copy needs updating and the offline key-file copy still needs confirmation.",
			],
			[
				"SOPS / age",
				"The workstation may load its age identity from ~/.config/sops/age or a mise-managed file: verify the exact recipient before recovery. A separate recovery identity lives on a LUKS2-encrypted SanDisk.",
			],
			[
				"Encrypted copies",
				"An age archive is backed up to TrueNAS and an encrypted workstation copy was compared and restored using the SanDisk. An independent backup of the SanDisk's private identity remains outstanding.",
			],
		],
		manualLink:
			"Detailed runbook: provenance, filenames, mounts, verification and restore",
		manualLink2: "Migration and validation status (nabla-yubikey)",
		lastNote:
			"Public guide: only generic paths appear here. Operational details belong in the runbooks. No private identity, PIN or vault contents are shown.",
		source: "Yubico references:",
	},
} as const;

const recoveryRunbook =
	"https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/runbooks/sops-age-usb-disaster-recovery.md";
const stateRunbook =
	"https://github.com/AlbanAndrieu/nabla-yubikey/blob/91898cf4901c28856293fe568f4c6f60be46ed22/docs/roadmap.md";

export default function YubiKeyPocketManual({
	locale,
}: Readonly<{ locale: AppLocale }>) {
	const t = copy[locale];
	return (
		<section
			id="yubikey-manual"
			className={styles.section}
			aria-labelledby="yubikey-manual-title"
		>
			<h2 id="yubikey-manual-title">{t.title}</h2>
			<p className={styles.intro}>{t.intro}</p>
			<div className={styles.devices}>
				{t.keys.map((device) => (
					<article className={styles.device} key={device.name}>
						<div className={styles.deviceHead}>
							<div className={styles.keyIllustration} aria-hidden="true">
								<span className={styles.contact} />
								<span className={styles.touch} />
								<span className={styles.port} />
							</div>
							<div>
								<h3>{device.name}</h3>
								<p>{device.connector}</p>
							</div>
						</div>
						<dl className={styles.statuses}>
							<div>
								<dt>OTP 1</dt>
								<dd>{device.otp1}</dd>
							</div>
							<div>
								<dt>OTP 2</dt>
								<dd>{device.otp2}</dd>
							</div>
							<div>
								<dt>PIV</dt>
								<dd>{device.piv}</dd>
							</div>
							<div>
								<dt>FIDO2</dt>
								<dd>{device.fido}</dd>
							</div>
						</dl>
					</article>
				))}
			</div>
			<div className={styles.details}>
				<details>
					<summary>{t.slotsTitle}</summary>
					<p>{t.slotOne}</p>
					<p>{t.slotTwo}</p>
					<p>{t.slotNote}</p>
				</details>
				<details>
					<summary>{t.pinsTitle}</summary>
					<div className={styles.scroll}>
						<table>
							<thead>
								<tr>
									{t.headers.map((head) => (
										<th scope="col" key={head}>
											{head}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{t.pins.map((pin) => (
									<tr key={pin[0]}>
										<th scope="row">{pin[0]}</th>
										<td>{pin[1]}</td>
										<td>{pin[2]}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<p>{t.pinsNote}</p>
				</details>
				<details>
					<summary>{t.inspectTitle}</summary>
					<p>{t.inspectNote}</p>
					<pre className={styles.command}>
						<code>
							{[
								"ykman info",
								"ykman otp info",
								"ykman piv info",
								"ykman fido info",
								"ykman openpgp info",
							].join("\n")}
						</code>
					</pre>
				</details>
				<details>
					<summary>{t.filesTitle}</summary>
					<dl className={styles.paths}>
						{t.locations.map(([name, location]) => (
							<div key={name}>
								<dt>{name}</dt>
								<dd>{location}</dd>
							</div>
						))}
					</dl>
					<p>
						<a href={recoveryRunbook} target="_blank" rel="noopener noreferrer">
							{t.manualLink}
						</a>
					</p>
					<p>
						<a href={stateRunbook} target="_blank" rel="noopener noreferrer">
							{t.manualLink2}
						</a>
					</p>
					<p>{t.lastNote}</p>
				</details>
			</div>
			<p className={styles.sources}>
				{t.source}{" "}
				<a
					href="https://docs.yubico.com/yesdk/users-manual/application-otp/commands-configure-slot.html"
					target="_blank"
					rel="noopener noreferrer"
				>
					OTP
				</a>
				{" · "}
				<a
					href="https://docs.yubico.com/yesdk/users-manual/application-piv/pin-puk-mgmt-key.html"
					target="_blank"
					rel="noopener noreferrer"
				>
					PIV
				</a>
				{" · "}
				<a
					href="https://docs.yubico.com/hardware/yubikey/yk-tech-manual/yk5-apps-fido.html"
					target="_blank"
					rel="noopener noreferrer"
				>
					FIDO2
				</a>
				{" · "}
				<a
					href="https://docs.yubico.com/hardware/yubikey/yk-tech-manual/yk5-apps-openpgp.html"
					target="_blank"
					rel="noopener noreferrer"
				>
					OpenPGP
				</a>
			</p>
		</section>
	);
}
