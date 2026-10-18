"use client";

import styles from "./HierarchicalArchitectureExplorer.module.css";
import type { GraphMode, GraphScope } from "./hierarchicalArchitectureModel";

type Props = {
	french: boolean;
	mode: GraphMode;
	onModeChange: (mode: GraphMode) => void;
	scope: GraphScope;
	onScopeChange: (scope: GraphScope) => void;
	showOptional: boolean;
	onShowOptionalChange: (showOptional: boolean) => void;
	query: string;
	onQueryChange: (query: string) => void;
};

export default function HierarchicalArchitectureToolbar({
	french,
	mode,
	onModeChange,
	scope,
	onScopeChange,
	showOptional,
	onShowOptionalChange,
	query,
	onQueryChange,
}: Readonly<Props>) {
	return (
		<div className={styles.toolbar}>
			<div className={styles.controlCluster}>
				<div className={styles.tabs} role="group" aria-label="Diagram view">
					<button
						type="button"
						aria-pressed={mode === "ai"}
						onClick={() => onModeChange("ai")}
					>
						AI Platform
					</button>
					<button
						type="button"
						aria-pressed={mode === "services"}
						onClick={() => onModeChange("services")}
					>
						Nabla / TrueNAS
					</button>
				</div>
				{mode === "services" ? (
					<div className={styles.tabs} role="group" aria-label="Topology scope">
						<button
							type="button"
							aria-pressed={scope === "critical"}
							onClick={() => onScopeChange("critical")}
						>
							{french ? "Chemin critique" : "Critical path"}
						</button>
						<button
							type="button"
							aria-pressed={scope === "all"}
							onClick={() => onScopeChange("all")}
						>
							{french ? "Tous les composants" : "All components"}
						</button>
					</div>
				) : null}
				<label className={styles.toggle}>
					<input
						type="checkbox"
						checked={showOptional}
						onChange={(event) => onShowOptionalChange(event.target.checked)}
					/>
					<span>
						{french ? "Relations optionnelles" : "Optional relations"}
					</span>
				</label>
			</div>
			<label className={styles.search}>
				<span>{french ? "Filtrer" : "Filter"}</span>
				<input
					type="search"
					value={query}
					onChange={(event) => onQueryChange(event.target.value)}
					placeholder={french ? "service, catégorie…" : "service, category…"}
				/>
			</label>
		</div>
	);
}
