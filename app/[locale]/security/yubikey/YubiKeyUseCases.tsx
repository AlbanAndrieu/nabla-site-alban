import type { AppLocale } from "@/i18n/routing";
import styles from "./page.module.css";
import { USE_CASE_LABELS, USE_CASES } from "./useCases";

export default function YubiKeyUseCases({
	locale,
}: Readonly<{ locale: AppLocale }>) {
	const labels = USE_CASE_LABELS[locale];
	const cases = USE_CASES[locale];
	return (
		<section
			id="yubikey-use-cases"
			className={styles.section}
			aria-labelledby="yubikey-use-cases-title"
		>
			<h2 id="yubikey-use-cases-title">{labels.title}</h2>
			<p>{labels.intro}</p>
			<div className={styles.useCaseGrid}>
				{cases.map((item) => (
					<article
						key={item.id}
						className={styles.useCase}
						id={`yubikey-use-${item.id}`}
					>
						<div className={styles.caseHead}>
							<span className={styles.caseLevel} data-level={item.level}>
								{item.level === "common" ? labels.common : labels.advanced}
							</span>
							<span className={styles.caseMechanism}>{item.mechanism}</span>
						</div>
						<h3>{item.title}</h3>
						<p>{item.purpose}</p>
						<details className={styles.caseDetails}>
							<summary>
								{labels.requires} / {labels.caution}
							</summary>
							<p>
								<strong>{labels.requires} :</strong> {item.prerequisites}
							</p>
							<p>
								<strong>{labels.caution} :</strong> {item.caution}
							</p>
						</details>
						{item.code ? (
							<pre
								className={styles.command}
								tabIndex={0}
								aria-label={item.title}
							>
								<code>{item.code}</code>
							</pre>
						) : null}
						<p className={styles.caseSource}>
							{labels.source} :{" "}
							<a
								href={item.source.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								{item.source.label}
							</a>
						</p>
					</article>
				))}
			</div>
		</section>
	);
}
