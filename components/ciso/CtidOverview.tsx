import type { AppLocale } from "@/i18n/routing";
import type { CtidItem } from "@/lib/ctidDigest";
import { type NewsFilters, recentSummary } from "@/lib/ctidView";
import { type CtidCopy, initialFilters } from "./CtidFilters";
import styles from "./CtidIntelligence.module.css";

export default function CtidOverview({
	items,
	now,
	locale,
	copy,
	onSelect,
}: {
	items: CtidItem[];
	now: number;
	locale: AppLocale;
	copy: CtidCopy;
	onSelect: (filters: NewsFilters) => void;
}) {
	const counts = recentSummary(items, now);
	const cards: {
		label: string;
		count: number;
		filters: Partial<NewsFilters>;
		level?: string;
	}[] = [
		{
			label: copy.critical24h,
			count: counts.critical,
			filters: { severity: "critical" },
			level: "critical",
		},
		{
			label: copy.high24h,
			count: counts.high,
			filters: { severity: "high" },
			level: "high",
		},
		{
			label: copy.api24h,
			count: counts.api,
			filters: { category: "api" },
		},
		{
			label: copy.identity24h,
			count: counts.identity,
			filters: { category: "identity" },
		},
	];
	return (
		<section aria-label={copy.recent}>
			<h3>
				{copy.recent} ({new Intl.NumberFormat(locale).format(counts.total)})
			</h3>
			<div className={styles.overview}>
				{cards.map((card) => (
					<button
						key={card.label}
						type="button"
						data-level={card.level}
						onClick={() =>
							onSelect({ ...initialFilters, days: 1, ...card.filters })
						}
					>
						<strong>{new Intl.NumberFormat(locale).format(card.count)}</strong>
						<span>{card.label}</span>
					</button>
				))}
			</div>
		</section>
	);
}
