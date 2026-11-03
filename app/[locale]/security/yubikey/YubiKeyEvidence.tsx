import type { AppLocale } from "@/i18n/routing";
import styles from "./YubiKeyEvidence.module.css";

// Historical, redacted operator reports only. The source repository is public,
// but these labels are not a live inventory, device state or recovery proof.
const upstreamCommit = "91898cf4901c28856293fe568f4c6f60be46ed22";
const runbookRoot = `https://github.com/AlbanAndrieu/nabla-yubikey/blob/${upstreamCommit}/docs/runbooks`;
const repoPull = "https://github.com/AlbanAndrieu/nabla-yubikey/pull/1";

const evidence = {
	fr: {
		title: "Dernières preuves et reprise",
		intro:
			"État déclaré dans nabla-yubikey au 31 octobre 2026. Ce n’est pas une télémétrie en direct : un contrôle GO ne garantit pas qu’une sauvegarde est restaurable.",
		updated: "Source datée : 31/10/2026",
		results: [
			{
				id: "keepassxc",
				tone: "verified",
				label: "Coffre KeePassXC",
				state: "Validé sur les deux clés",
				explanation:
					"Ouverture du coffre avec OTP 2 HMAC-SHA1 sur chaque clé. La copie NAS avec la nouvelle protection reste à tester.",
				link: "keepassxc.md",
			},
			{
				id: "ssh",
				tone: "partial",
				label: "SSH FIDO2",
				state: "Partiellement validé",
				explanation:
					"Clés SSH résidentes enregistrées ; GitHub a accepté la principale. Test final de la secondaire avec la configuration SSH définitive encore attendu.",
				link: "ssh-fido2.md",
			},
			{
				id: "applets",
				tone: "inventory",
				label: "Applet PIV / OpenPGP",
				state: "Inventaire seulement",
				explanation:
					"Un inventaire en lecture seule est GO, avec conseils OTP/NFC/KDF. Aucun emplacement de clé OpenPGP rempli sur la carte inspectée.",
				link: "inventaire-applets.md",
			},
			{
				id: "recovery",
				tone: "pending",
				label: "Reprise et sauvegardes",
				state: "À compléter",
				explanation:
					"Restauration logicielle age/SOPS précédemment testée ; copie indépendante de l’identité de récupération et PRA complet non démontrés.",
				link: null,
			},
		],
		moreTitle: "Comment revérifier sans modifier une clé ?",
		more: "Depuis la branche de la PR #1 de nabla-yubikey, une seule clé branchée à la fois. Les commandes n’entrent aucun PIN et ne déverrouillent aucun coffre. GO indique uniquement que les contrôles exécutés sont satisfaits.",
		nextTitle: "Où retrouver la provenance et les prochaines étapes ?",
		links: [
			{
				label: "Runbook KeePassXC — coffre et fichier clé",
				href: `${runbookRoot}/keepassxc.md`,
			},
			{
				label: "Runbook SSH FIDO2 — création et récupération du handle",
				href: `${runbookRoot}/ssh-fido2.md`,
			},
			{
				label: "Inventaire des applets et compteurs",
				href: `${runbookRoot}/inventaire-applets.md`,
			},
			{
				label: "PRA age/SOPS et copies sur TrueNAS",
				href: "https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/runbooks/sops-age-usb-disaster-recovery.md",
			},
		],
		pullLabel: "Migration en cours : nabla-yubikey PR #1",
		safety:
			"La branche dédiée n’est pas encore la version de référence publiée sur master. Ne jamais publier de série, PIN, empreinte privée, nom de coffre ou fichier d’export dans le site.",
	},
	en: {
		title: "Latest evidence and recovery",
		intro:
			"State recorded in nabla-yubikey as of 31 October 2026. This is not live telemetry: a GO diagnostic does not prove a backup can be restored.",
		updated: "Recorded: 31 Oct 2026",
		results: [
			{
				id: "keepassxc",
				tone: "verified",
				label: "KeePassXC vault",
				state: "Verified with both keys",
				explanation:
					"Vault opened using OTP slot 2 HMAC-SHA1 on each key. The NAS copy with the new protection still needs to be tested.",
				link: "keepassxc.md",
			},
			{
				id: "ssh",
				tone: "partial",
				label: "FIDO2 SSH",
				state: "Partially verified",
				explanation:
					"Resident SSH keys enrolled; GitHub accepted the primary. Final backup-key test with the definitive SSH configuration is outstanding.",
				link: "ssh-fido2.md",
			},
			{
				id: "applets",
				tone: "inventory",
				label: "PIV / OpenPGP applets",
				state: "Inventory only",
				explanation:
					"One read-only inventory passed with OTP/NFC/KDF advice. No OpenPGP key slots were filled on the inspected device.",
				link: "inventaire-applets.md",
			},
			{
				id: "recovery",
				tone: "pending",
				label: "Backup and recovery",
				state: "Incomplete",
				explanation:
					"Software age/SOPS recovery was previously tested; an independent copy of the recovery identity and a full disaster-recovery exercise are not proven.",
				link: null,
			},
		],
		moreTitle: "How to recheck without changing either key",
		more: "From the nabla-yubikey PR #1 branch, with one YubiKey connected at a time. These commands do not enter a PIN or unlock a vault. GO only applies to the checks performed.",
		nextTitle: "Where to find source evidence and next steps",
		links: [
			{
				label: "KeePassXC runbook — vault and key file",
				href: `${runbookRoot}/keepassxc.md`,
			},
			{
				label: "FIDO2 SSH runbook — creation and handle recovery",
				href: `${runbookRoot}/ssh-fido2.md`,
			},
			{
				label: "Applet inventory and retry counters",
				href: `${runbookRoot}/inventaire-applets.md`,
			},
			{
				label: "age/SOPS disaster recovery and TrueNAS copies",
				href: "https://github.com/AlbanAndrieu/nabla-compose/blob/master/docs/runbooks/sops-age-usb-disaster-recovery.md",
			},
		],
		pullLabel: "Migration in progress: nabla-yubikey PR #1",
		safety:
			"The dedicated branch is not yet the published master source of truth. Never expose serial numbers, PINs, private fingerprints, vault names or export files on the website.",
	},
} as const;

export default function YubiKeyEvidence({
	locale,
}: Readonly<{ locale: AppLocale }>) {
	const t = evidence[locale];
	return (
		<section
			id="yubikey-evidence"
			className={styles.section}
			aria-labelledby="yubikey-evidence-title"
		>
			<h2 id="yubikey-evidence-title">{t.title}</h2>
			<p className={styles.intro}>{t.intro}</p>
			<p className={styles.date}>
				<time dateTime="2026-10-31">{t.updated}</time>
			</p>
			<div className={styles.cards}>
				{t.results.map((item) => (
					<article className={styles.card} key={item.id}>
						<h3>{item.label}</h3>
						<p className={styles.state} data-tone={item.tone}>
							{item.state}
						</p>
						<p>{item.explanation}</p>
						{item.link ? (
							<a
								href={`${runbookRoot}/${item.link}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								{locale === "fr" ? "Voir le runbook" : "Read the runbook"}
							</a>
						) : null}
					</article>
				))}
			</div>
			<details className={styles.details}>
				<summary>{t.moreTitle}</summary>
				<p>{t.more}</p>
				<pre className={styles.commands} tabIndex={0} aria-label={t.moreTitle}>
					<code>
						{[
							"just dependencies-readonly",
							"just applets-readonly",
							"just ssh-fido2-readonly",
							"just keepassxc-readonly",
						].join("\n")}
					</code>
				</pre>
			</details>
			<details className={styles.details}>
				<summary>{t.nextTitle}</summary>
				<ul>
					{t.links.map((link) => (
						<li key={link.href}>
							<a href={link.href} target="_blank" rel="noopener noreferrer">
								{link.label}
							</a>
						</li>
					))}
				</ul>
				<p>
					<a href={repoPull} target="_blank" rel="noopener noreferrer">
						{t.pullLabel}
					</a>
				</p>
				<p>{t.safety}</p>
			</details>
		</section>
	);
}
