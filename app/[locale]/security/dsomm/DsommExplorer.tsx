"use client";

import { useMemo, useState } from "react";
import type { DsommActivity } from "@/lib/dsommSnapshot";
import styles from "./DsommExplorer.module.css";

const INITIAL_ACTIVITY_LIMIT = 36;
const ACTIVITY_PAGE_SIZE = 36;

const FRAMEWORK_LABELS: Record<string, string> = {
	samm2: "OWASP SAMM 2",
	"iso27001-2017": "ISO/IEC 27001:2017",
	"iso27001-2022": "ISO/IEC 27001:2022",
	openCRE: "OpenCRE",
	d3f: "D3F",
};

export type DsommExplorerCopy = {
	title: string;
	lead: string;
	searchLabel: string;
	searchPlaceholder: string;
	dimensionLabel: string;
	allDimensions: string;
	levelLabel: string;
	allLevels: string;
	frameworkLabel: string;
	allFrameworks: string;
	tagLabel: string;
	allTags: string;
	results: string;
	noResults: string;
	showMore: string;
	details: string;
	description: string;
	risk: string;
	measure: string;
	assessment: string;
	mappings: string;
	tags: string;
	usefulness: string;
	difficulty: string;
	knowledge: string;
	time: string;
	resources: string;
};

type Props = Readonly<{
	activities: DsommActivity[];
	dimensions: string[];
	copy: DsommExplorerCopy;
}>;

function readableText(value: string) {
	return value
		.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
		.replace(/`([^`]+)`/g, "$1");
}

function frameworkLabel(key: string) {
	return FRAMEWORK_LABELS[key] ?? key;
}

export default function DsommExplorer({ activities, dimensions, copy }: Props) {
	const [query, setQuery] = useState("");
	const [dimension, setDimension] = useState("");
	const [level, setLevel] = useState("");
	const [framework, setFramework] = useState("");
	const [tag, setTag] = useState("");
	const [limit, setLimit] = useState(INITIAL_ACTIVITY_LIMIT);

	const frameworks = useMemo(
		() =>
			[
				...new Set(
					activities.flatMap((activity) =>
						Object.entries(activity.references)
							.filter(([, values]) => values.length > 0)
							.map(([key]) => key),
					),
				),
			].sort((left, right) =>
				frameworkLabel(left).localeCompare(frameworkLabel(right)),
			),
		[activities],
	);
	const tags = useMemo(
		() =>
			[...new Set(activities.flatMap((activity) => activity.tags))].sort(
				(left, right) => left.localeCompare(right),
			),
		[activities],
	);

	const filtered = useMemo(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase();
		return activities.filter((activity) => {
			if (dimension && activity.dimension !== dimension) return false;
			if (level && String(activity.level) !== level) return false;
			if (framework && !(activity.references[framework]?.length > 0))
				return false;
			if (tag && !activity.tags.includes(tag)) return false;
			if (!normalizedQuery) return true;

			const searchable = [
				activity.name,
				activity.dimension,
				activity.subdimension,
				activity.description,
				activity.risk,
				activity.measure,
				...activity.tags,
			]
				.join(" ")
				.toLocaleLowerCase();
			return searchable.includes(normalizedQuery);
		});
	}, [activities, dimension, framework, level, query, tag]);

	const visible = filtered.slice(0, limit);
	const resultLabel = copy.results
		.replace("{count}", String(filtered.length))
		.replace("{total}", String(activities.length));

	function resetLimit() {
		setLimit(INITIAL_ACTIVITY_LIMIT);
	}

	return (
		<section
			className={styles.section}
			aria-labelledby="dsomm-explorer-heading"
		>
			<header className={styles.heading}>
				<h2 id="dsomm-explorer-heading">{copy.title}</h2>
				<p>{copy.lead}</p>
			</header>

			<div className={styles.filters} role="group" aria-label={copy.title}>
				<label className={styles.searchField}>
					<span>{copy.searchLabel}</span>
					<input
						type="search"
						value={query}
						placeholder={copy.searchPlaceholder}
						onChange={(event) => {
							setQuery(event.currentTarget.value);
							resetLimit();
						}}
					/>
				</label>
				<label>
					<span>{copy.dimensionLabel}</span>
					<select
						value={dimension}
						onChange={(event) => {
							setDimension(event.currentTarget.value);
							resetLimit();
						}}
					>
						<option value="">{copy.allDimensions}</option>
						{dimensions.map((item) => (
							<option value={item} key={item}>
								{item}
							</option>
						))}
					</select>
				</label>
				<label>
					<span>{copy.levelLabel}</span>
					<select
						value={level}
						onChange={(event) => {
							setLevel(event.currentTarget.value);
							resetLimit();
						}}
					>
						<option value="">{copy.allLevels}</option>
						{[1, 2, 3, 4, 5].map((item) => (
							<option value={item} key={item}>
								{copy.levelLabel} {item}
							</option>
						))}
					</select>
				</label>
				<label>
					<span>{copy.frameworkLabel}</span>
					<select
						value={framework}
						onChange={(event) => {
							setFramework(event.currentTarget.value);
							resetLimit();
						}}
					>
						<option value="">{copy.allFrameworks}</option>
						{frameworks.map((item) => (
							<option value={item} key={item}>
								{frameworkLabel(item)}
							</option>
						))}
					</select>
				</label>
				<label>
					<span>{copy.tagLabel}</span>
					<select
						value={tag}
						onChange={(event) => {
							setTag(event.currentTarget.value);
							resetLimit();
						}}
					>
						<option value="">{copy.allTags}</option>
						{tags.map((item) => (
							<option value={item} key={item}>
								{item}
							</option>
						))}
					</select>
				</label>
			</div>

			<p className={styles.resultCount} aria-live="polite">
				{resultLabel}
			</p>

			{visible.length === 0 ? (
				<p className={styles.empty}>{copy.noResults}</p>
			) : (
				<div className={styles.activityGrid}>
					{visible.map((activity) => (
						<article className={styles.activityCard} key={activity.uuid}>
							<header className={styles.activityHeader}>
								<div>
									<p className={styles.dimension}>{activity.dimension}</p>
									<h3>{activity.name}</h3>
									<p className={styles.subdimension}>{activity.subdimension}</p>
								</div>
								<span className={styles.levelBadge}>
									{copy.levelLabel} {activity.level}
								</span>
							</header>

							{activity.tags.length > 0 && (
								<div className={styles.chips} aria-label={copy.tags}>
									{activity.tags.map((item) => (
										<span key={item}>{item}</span>
									))}
								</div>
							)}

							<details className={styles.details}>
								<summary>{copy.details}</summary>
								<div className={styles.detailBody}>
									{activity.description && (
										<section>
											<h4>{copy.description}</h4>
											<p>{readableText(activity.description)}</p>
										</section>
									)}
									{activity.risk && (
										<section>
											<h4>{copy.risk}</h4>
											<p>{readableText(activity.risk)}</p>
										</section>
									)}
									{activity.measure && (
										<section>
											<h4>{copy.measure}</h4>
											<p>{readableText(activity.measure)}</p>
										</section>
									)}
									{activity.assessment && (
										<section>
											<h4>{copy.assessment}</h4>
											<p className={styles.preLine}>
												{readableText(activity.assessment)}
											</p>
										</section>
									)}
									<section>
										<h4>{copy.difficulty}</h4>
										<p>
											{copy.knowledge}:{" "}
											{activity.difficultyOfImplementation.knowledge}/5 ·{" "}
											{copy.time}: {activity.difficultyOfImplementation.time}/5
											· {copy.resources}:{" "}
											{activity.difficultyOfImplementation.resources}/5
											{activity.usefulness !== null
												? ` · ${copy.usefulness}: ${activity.usefulness}/5`
												: ""}
										</p>
									</section>
									{Object.keys(activity.references).length > 0 && (
										<section>
											<h4>{copy.mappings}</h4>
											<div className={styles.mappingList}>
												{Object.entries(activity.references).map(
													([key, values]) => (
														<div key={key}>
															<strong>{frameworkLabel(key)}</strong>
															<ul>
																{values.map((value) => (
																	<li key={value}>
																		{value.startsWith("http") ? (
																			<a
																				href={value}
																				target="_blank"
																				rel="noreferrer"
																			>
																				{value}
																			</a>
																		) : (
																			value
																		)}
																	</li>
																))}
															</ul>
														</div>
													),
												)}
											</div>
										</section>
									)}
								</div>
							</details>
						</article>
					))}
				</div>
			)}

			{visible.length < filtered.length && (
				<button
					type="button"
					className={styles.showMore}
					onClick={() => setLimit((current) => current + ACTIVITY_PAGE_SIZE)}
				>
					{copy.showMore}
				</button>
			)}
		</section>
	);
}
