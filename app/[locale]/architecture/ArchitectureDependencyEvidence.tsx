import type { CSSProperties } from "react";
import { homelabHealthColor } from "@/lib/homelabHealthPresentation";
import styles from "./HierarchicalArchitectureExplorer.module.css";

export type DependencyEvidenceState =
	| "blocked"
	| "degraded"
	| "unconfirmed";

type Props = {
	blockedBy?: string[];
	degradedBy?: string[];
	unconfirmed?: string[];
	french: boolean;
	mobile?: boolean;
};

const STATE_COLOR: Record<DependencyEvidenceState, string> = {
	blocked: homelabHealthColor("fail"),
	degraded: homelabHealthColor("warn"),
	unconfirmed: homelabHealthColor("unknown"),
};

function label(state: DependencyEvidenceState, french: boolean): string {
	if (state === "blocked") return french ? "Bloqué par" : "Blocked by";
	if (state === "degraded") return french ? "Dégradé par" : "Degraded by";
	return french ? "Non confirmé" : "Unconfirmed";
}

function glyph(state: DependencyEvidenceState): string {
	if (state === "blocked") return "⛔";
	if (state === "degraded") return "⚠";
	return "?";
}

function evidenceStyle(state: DependencyEvidenceState): CSSProperties {
	const color = STATE_COLOR[state];
	return {
		color,
		borderColor: color,
		borderStyle: state === "unconfirmed" ? "dashed" : undefined,
	};
}

export function ArchitectureDependencyBadges({
	blockedBy = [],
	degradedBy = [],
	unconfirmed = [],
	french,
	mobile = false,
}: Readonly<Props>) {
	const rows: Array<[DependencyEvidenceState, string[]]> = [
		["blocked", blockedBy],
		["degraded", degradedBy],
		["unconfirmed", unconfirmed],
	];
	return rows.map(([state, names]) =>
		names.length > 0 ? (
			<span
				key={state}
				className={mobile ? styles.mobileBlockedBy : styles.runtimeBadge}
				data-dependency-health={state}
				style={evidenceStyle(state)}
			>
				{glyph(state)} {label(state, french)} · {names.join(", ")}
			</span>
		) : null,
	);
}

export function ArchitectureDependencyEvidenceLegend({
	french,
}: Readonly<{ french: boolean }>) {
	return (
		<div className={styles.relationLegend} data-dependency-evidence-legend>
			<strong>
				{french ? "Évidence des dépendances requises" : "Required dependency evidence"}
			</strong>
			<div className={styles.relationLegendItems}>
				{(["blocked", "degraded", "unconfirmed"] as const).map((state) => (
					<span key={state} data-dependency-evidence-state={state}>
						<i
							className={styles.relationSwatch}
							style={{ color: STATE_COLOR[state], borderTopStyle: state === "unconfirmed" ? "dashed" : undefined }}
							aria-hidden="true"
						/>
						{label(state, french)}
					</span>
				))}
			</div>
			<small>
				{french
					? "Déclaré ≠ observé ≠ sain. Sans preuve FastAPI côté consommateur, une relation requise reste non confirmée et n’est jamais promue implicitement en saine."
					: "Declared ≠ observed ≠ healthy. Without consumer-side FastAPI evidence, a required relation stays unconfirmed and is never implicitly promoted to healthy."}
			</small>
		</div>
	);
}
