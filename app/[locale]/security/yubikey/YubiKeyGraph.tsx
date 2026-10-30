"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { GuideCopy } from "./content";
import { YUBIKEY_GRAPH_EDGES, YUBIKEY_GRAPH_NODES } from "./model";
import styles from "./page.module.css";

// ReactFlow stays out of the initial bundle, as on Architecture and TrueNAS.
const YubiKeyGraphCanvas = dynamic(() => import("./YubiKeyGraphCanvas"), {
	ssr: false,
});

export default function YubiKeyGraph({ copy }: Readonly<{ copy: GuideCopy }>) {
	const [selected, setSelected] = useState<string | null>(null);
	const related = selected
		? YUBIKEY_GRAPH_EDGES.filter(
				(edge) => edge.source === selected || edge.target === selected,
			)
		: [];
	return (
		<section
			aria-labelledby="yubikey-graph-title"
			className={styles.graphSection}
		>
			<h2 id="yubikey-graph-title">{copy.diagramTitle}</h2>
			<p>{copy.diagramLead}</p>
			<div
				className={styles.graphCanvas}
				role="region"
				aria-label={copy.diagramTitle}
			>
				<YubiKeyGraphCanvas
					copy={copy}
					selected={selected}
					onSelect={setSelected}
				/>
			</div>
			<div
				className={styles.graphSelector}
				role="group"
				aria-label={copy.graphSelectorLabel}
			>
				{YUBIKEY_GRAPH_NODES.map((item) => (
					<button
						type="button"
						key={item.id}
						className={styles.graphSelectButton}
						aria-pressed={selected === item.id}
						onClick={() => setSelected(item.id)}
					>
						{copy.graphRoles[item.id]}
					</button>
				))}
			</div>
			<div className={styles.graphDetail} aria-live="polite">
				<strong>{selected ? copy.graphRoles[selected] : copy.keyLegend}</strong>
				{selected && related.length > 0 ? (
					<ul>
						{related.map((edge) => (
							<li key={edge.id}>
								{copy.graphRoles[edge.source]} → {copy.graphRoles[edge.target]}
								{" — "}
								{copy.graphEdges[edge.id]}
							</li>
						))}
					</ul>
				) : null}
			</div>
			<details className={styles.graphAlternative}>
				<summary>{copy.accessibleGraph}</summary>
				<ul>
					{YUBIKEY_GRAPH_EDGES.map((edge) => (
						<li key={edge.id}>
							{copy.graphRoles[edge.source]} → {copy.graphRoles[edge.target]}
							{" — "}
							{copy.graphEdges[edge.id]}
						</li>
					))}
				</ul>
			</details>
			<p className={styles.disclaimer}>{copy.keyLegend}</p>
		</section>
	);
}
