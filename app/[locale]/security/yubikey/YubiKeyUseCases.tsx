"use client";

import { useState } from "react";
import type { AppLocale } from "@/i18n/routing";
import styles from "./page.module.css";
import { USE_CASE_LABELS, USE_CASES } from "./useCases";

type LevelFilter = "all" | "common" | "advanced";

const FILTER_LABELS = {
	fr: {
		search: "Rechercher un usage",
		placeholder: "SSH, FIDO2, coffre, certificat…",
		help: "Filtrez les exemples sans envoyer de recherche au serveur.",
		all: "Tous",
		common: "Courants",
		advanced: "Avancés",
		results: (count: number, total: number) =>
			`${count} exemple${count !== 1 ? "s" : ""} sur ${total}`,
		empty: "Aucun exemple ne correspond aux critères.",
		reset: "Effacer les filtres",
	},
	en: {
		search: "Search use cases",
		placeholder: "SSH, FIDO2, vault, certificate…",
		help: "Filter the examples locally, without sending your query to a server.",
		all: "All",
		common: "Everyday",
		advanced: "Advanced",
		results: (count: number, total: number) =>
			`${count} of ${total} example${total > 1 ? "s" : ""}`,
		empty: "No examples match these filters.",
		reset: "Clear filters",
	},
} as const;

function normalizeSearch(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase()
		.trim();
}

export default function YubiKeyUseCases({
	locale,
}: Readonly<{ locale: AppLocale }>) {
	const labels = USE_CASE_LABELS[locale];
	const copy = FILTER_LABELS[locale];
	const cases = USE_CASES[locale];
	const [filter, setFilter] = useState<LevelFilter>("all");
	const [query, setQuery] = useState("");

	const needle = normalizeSearch(query);
	const visibleCases = cases.filter((item) => {
		if (filter !== "all" && item.level !== filter) return false;
		if (!needle) return true;
		return normalizeSearch(
			[
				item.title,
				item.mechanism,
				item.purpose,
				item.prerequisites,
				item.caution,
			].join(" "),
		).includes(needle);
	});

	const reset = () => {
		setFilter("all");
		setQuery("");
	};

	return (
		<section
			id="yubikey-use-cases"
			className={styles.section}
			aria-labelledby="yubikey-use-cases-title"
		>
			<h2 id="yubikey-use-cases-title">{labels.title}</h2>
			<p>{labels.intro}</p>
			<div className={styles.useCaseToolbar}>
				<div className={styles.useCaseSearch}>
					<label htmlFor="yubikey-use-case-search">{copy.search}</label>
					<input
						id="yubikey-use-case-search"
						type="search"
						autoComplete="off"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={copy.placeholder}
						aria-describedby="yubikey-use-case-help"
					/>
					<p id="yubikey-use-case-help" className={styles.useCaseHelp}>
						{copy.help}
					</p>
				</div>
				<div
					className={styles.useCaseFilters}
					role="group"
					aria-label={locale === "fr" ? "Niveau des usages" : "Use case level"}
				>
					{(["all", "common", "advanced"] as const).map((level) => (
						<button
							key={level}
							type="button"
							className={styles.useCaseFilter}
							aria-pressed={filter === level}
							onClick={() => setFilter(level)}
						>
							{copy[level]}
						</button>
					))}
				</div>
			</div>
			<div className={styles.useCaseResults}>
				<p role="status" aria-live="polite" aria-atomic="true">
					{copy.results(visibleCases.length, cases.length)}
				</p>
				{visibleCases.length > 0 && (filter !== "all" || needle) && (
					<button type="button" className={styles.useCaseReset} onClick={reset}>
						{copy.reset}
					</button>
				)}
			</div>
			{visibleCases.length === 0 ? (
				<div className={styles.useCaseEmpty}>
					<p>{copy.empty}</p>
					<button type="button" className={styles.useCaseReset} onClick={reset}>
						{copy.reset}
					</button>
				</div>
			) : (
				<div className={styles.useCaseGrid} id="yubikey-use-case-results">
					{visibleCases.map((item) => (
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
								{item.code ? (
									<pre
										className={styles.command}
										tabIndex={0}
										aria-label={item.title}
									>
										<code>{item.code}</code>
									</pre>
								) : null}
							</details>
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
			)}
		</section>
	);
}
