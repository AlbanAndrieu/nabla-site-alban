import {
	buildDsommHeatmapData,
	type DsommHeatmapStatus,
} from "@/lib/dsommHeatmap";
import styles from "./DsommAssessmentHeatmap.module.css";

export type DsommAssessmentHeatmapCopy = {
	title: string;
	lead: string;
	coverage: string;
	assessed: string;
	modelActivities: string;
	notAssessed: string;
	notApplicable: string;
	meanAssessed: string;
	noScore: string;
	caveat: string;
	dimension: string;
	legendTitle: string;
	dataLink: string;
	status: Record<DsommHeatmapStatus, string>;
};

const STATUS_CLASS: Record<DsommHeatmapStatus, string> = {
	"not-assessed": styles.notAssessed,
	"not-applicable": styles.notApplicable,
	"not-implemented": styles.notImplemented,
	started: styles.started,
	"partly-implemented": styles.partlyImplemented,
	"fully-implemented": styles.fullyImplemented,
};

const CENTER = 160;
const INNER_RADIUS = 103;
const OUTER_RADIUS = 146;
const GROUP_GAP_DEGREES = 3.5;
const SEGMENT_GAP_DEGREES = 0.16;

function polar(radius: number, angle: number) {
	const radians = (angle * Math.PI) / 180;
	return {
		x: CENTER + radius * Math.cos(radians),
		y: CENTER + radius * Math.sin(radians),
	};
}

function wedge(start: number, end: number): string {
	const a = polar(OUTER_RADIUS, start);
	const b = polar(OUTER_RADIUS, end);
	const c = polar(INNER_RADIUS, end);
	const d = polar(INNER_RADIUS, start);
	return [
		`M ${a.x.toFixed(2)} ${a.y.toFixed(2)}`,
		`A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
		`L ${c.x.toFixed(2)} ${c.y.toFixed(2)}`,
		`A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${d.x.toFixed(2)} ${d.y.toFixed(2)}`,
		"Z",
	].join(" ");
}

function percent(value: number, locale: "en" | "fr"): string {
	return new Intl.NumberFormat(locale, {
		style: "percent",
		maximumFractionDigits: 0,
	}).format(value);
}

type Props = Readonly<{
	copy: DsommAssessmentHeatmapCopy;
	locale: "en" | "fr";
}>;

export default function DsommAssessmentHeatmap({ copy, locale }: Props) {
	const data = buildDsommHeatmapData();
	const step =
		(360 - GROUP_GAP_DEGREES * data.dimensions.length) / data.modelActivities;
	const segments = data.dimensions.flatMap(
		({ dimension }, dimensionIndex, dimensions) => {
			const priorActivityCount = dimensions
				.slice(0, dimensionIndex)
				.reduce((count, item) => count + item.modelActivities, 0);
			const groupStart =
				-90 + priorActivityCount * step + dimensionIndex * GROUP_GAP_DEGREES;
			return data.activities
				.filter((activity) => activity.dimension === dimension)
				.map((activity, activityIndex) => {
					const angle = groupStart + activityIndex * step;
					const start = angle + SEGMENT_GAP_DEGREES / 2;
					const end = angle + step - SEGMENT_GAP_DEGREES / 2;
					return {
						uuid: activity.uuid,
						status: activity.status,
						path: wedge(start, end),
					};
				});
		},
	);

	return (
		<section
			className={styles.section}
			aria-labelledby="dsomm-assessment-heading"
		>
			<div className={styles.heading}>
				<h2 id="dsomm-assessment-heading">{copy.title}</h2>
				<p>{copy.lead}</p>
			</div>

			<div className={styles.layout}>
				<div className={styles.visual}>
					<div className={styles.chartFrame}>
						<svg
							className={styles.chart}
							viewBox="0 0 320 320"
							aria-hidden="true"
							focusable="false"
						>
							{segments.map((segment) => (
								<path
									key={segment.uuid}
									d={segment.path}
									className={STATUS_CLASS[segment.status]}
								/>
							))}
						</svg>
						<div className={styles.chartCenter}>
							<strong>{percent(data.coverage, locale)}</strong>
							<span>{copy.coverage}</span>
						</div>
					</div>
					<ul className={styles.legend} aria-label={copy.legendTitle}>
						{(Object.keys(STATUS_CLASS) as DsommHeatmapStatus[]).map(
							(status) => (
								<li key={status}>
									<span
										className={`${styles.swatch} ${STATUS_CLASS[status]}`}
										aria-hidden="true"
									/>
									{copy.status[status]}
								</li>
							),
						)}
					</ul>
				</div>

				<div className={styles.details}>
					<dl className={styles.metrics}>
						<div>
							<dt>{copy.assessed}</dt>
							<dd>{data.assessed}</dd>
						</div>
						<div>
							<dt>{copy.modelActivities}</dt>
							<dd>{data.modelActivities}</dd>
						</div>
						<div>
							<dt>{copy.notAssessed}</dt>
							<dd>{data.notAssessed}</dd>
						</div>
						<div>
							<dt>{copy.notApplicable}</dt>
							<dd>{data.notApplicable}</dd>
						</div>
					</dl>
					<div className={styles.tableScroll}>
						<table className={styles.table}>
							<thead>
								<tr>
									<th scope="col">{copy.dimension}</th>
									<th scope="col">{copy.assessed}</th>
									<th scope="col">{copy.notApplicable}</th>
									<th scope="col">{copy.coverage}</th>
									<th scope="col">{copy.meanAssessed}</th>
								</tr>
							</thead>
							<tbody>
								{data.dimensions.map((dimension) => (
									<tr key={dimension.dimension}>
										<th scope="row">{dimension.dimension}</th>
										<td>
											{dimension.assessed}/{dimension.modelActivities}
										</td>
										<td>{dimension.notApplicable}</td>
										<td>{percent(dimension.coverage, locale)}</td>
										<td>
											{dimension.averageProgress === null
												? copy.noScore
												: percent(dimension.averageProgress, locale)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<p className={styles.caveat}>{copy.caveat}</p>
					<a
						className={styles.dataLink}
						href="/.well-known/nabla/dsomm-assessment.json"
					>
						{copy.dataLink}
					</a>
				</div>
			</div>
		</section>
	);
}
