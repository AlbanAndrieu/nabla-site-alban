"use client";

import type { AppLocale } from "@/i18n/routing";
import { categories, type NewsFilters } from "@/lib/ctidView";
import styles from "./CtidIntelligence.module.css";

export const signalLabels = {
	fr: {
		critical: "Signal critique",
		high: "Signal élevé",
		medium: "Signal modéré",
		informational: "Information",
	},
	en: {
		critical: "Critical signal",
		high: "High signal",
		medium: "Medium signal",
		informational: "Information",
	},
} as const;

export type CtidCopy = {
	query: string;
	source: string;
	recent: string;
	critical24h: string;
	high24h: string;
	api24h: string;
	identity24h: string;
	refresh: string;
	category: string;
	severity: string;
	period: string;
	sort: string;
	all: string;
	risk: string;
	date: string;
	results: string;
	original: string;
	refreshed: string;
	reset: string;
	categories: Record<(typeof categories)[number], string>;
};

export const initialFilters: NewsFilters = {
	query: "",
	source: "",
	category: "all",
	severity: "all",
	days: 7,
	sort: "risk",
};

export default function CtidFilters({
	locale,
	copy,
	filters,
	setFilters,
	sources,
}: {
	locale: AppLocale;
	copy: CtidCopy;
	filters: NewsFilters;
	setFilters: (value: NewsFilters) => void;
	sources: string[];
}) {
	return (
		<div className={styles.filters}>
			<label>
				{copy.query}
				<input
					type="search"
					value={filters.query}
					onChange={(event) =>
						setFilters({ ...filters, query: event.target.value })
					}
					placeholder="APIM, Entra ID, CVE…"
				/>
			</label>
			<label>
				{copy.period}
				<select
					value={filters.days}
					onChange={(event) =>
						setFilters({ ...filters, days: Number(event.target.value) })
					}
				>
					{[1, 2, 7, 30].map((days) => (
						<option key={days} value={days}>
							{days === 1
								? "24 h"
								: days === 2
									? "48 h"
									: new Intl.NumberFormat(locale, {
											style: "unit",
											unit: "day",
										}).format(days)}
						</option>
					))}
					<option value={0}>{copy.all}</option>
				</select>
			</label>
			<label>
				{copy.category}
				<select
					value={filters.category}
					onChange={(event) =>
						setFilters({
							...filters,
							category: event.target.value as NewsFilters["category"],
						})
					}
				>
					<option value="all">{copy.all}</option>
					{categories.map((category) => (
						<option key={category} value={category}>
							{copy.categories[category]}
						</option>
					))}
				</select>
			</label>
			<label>
				{copy.severity}
				<select
					value={filters.severity}
					onChange={(event) =>
						setFilters({
							...filters,
							severity: event.target.value as NewsFilters["severity"],
						})
					}
				>
					<option value="all">{copy.all}</option>
					{Object.entries(signalLabels[locale]).map(([key, label]) => (
						<option key={key} value={key}>
							{label}
						</option>
					))}
				</select>
			</label>
			<label>
				{copy.source}
				<select
					value={filters.source ?? ""}
					onChange={(event) =>
						setFilters({ ...filters, source: event.target.value })
					}
				>
					<option value="">{copy.all}</option>
					{sources.map((source) => (
						<option key={source} value={source}>
							{source}
						</option>
					))}
				</select>
			</label>
			<label>
				{copy.sort}
				<select
					value={filters.sort}
					onChange={(event) =>
						setFilters({
							...filters,
							sort: event.target.value as NewsFilters["sort"],
						})
					}
				>
					<option value="risk">{copy.risk}</option>
					<option value="date">{copy.date}</option>
				</select>
			</label>
			<button type="button" onClick={() => setFilters(initialFilters)}>
				{copy.reset}
			</button>
		</div>
	);
}
