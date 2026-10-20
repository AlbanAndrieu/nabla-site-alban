"use client";

import { useLocale } from "next-intl";
import { useEffect, useState, type WheelEvent } from "react";
import HierarchicalHomeLabNetworkFlow from "./HierarchicalHomeLabNetworkFlow";
import styles from "./HomeLabNetworkFlow.module.css";
import { parseNetworkGraph } from "./homelabNetworkFlowGraph";
import type { NetworkGraph } from "./homelabNetworkFlowTypes";

function keepPageScrollUnlessZooming(event: WheelEvent<HTMLDivElement>) {
	if (!event.ctrlKey && !event.metaKey) event.stopPropagation();
}

type GraphState = NetworkGraph | "loading" | "unavailable";

/** Loads the private graph from the gated route; no topology is bundled. */
function useNetworkGraph(): GraphState {
	const [graph, setGraph] = useState<GraphState>("loading");
	useEffect(() => {
		const controller = new AbortController();
		fetch("/api/homelab-network-flow", {
			cache: "no-store",
			signal: controller.signal,
			headers: { Accept: "application/json" },
		})
			.then(async (response) => {
				const parsed = response.ok
					? parseNetworkGraph(await response.json())
					: null;
				setGraph(parsed ?? "unavailable");
			})
			.catch(() => {
				if (!controller.signal.aborted) setGraph("unavailable");
			});
		return () => controller.abort();
	}, []);
	return graph;
}

export default function HomeLabNetworkFlow() {
	const french = useLocale() === "fr";
	const graph = useNetworkGraph();

	if (graph === "loading" || graph === "unavailable") {
		const status = {
			loading: french
				? "Chargement de la topologie réseau privée…"
				: "Loading the private network topology…",
			unavailable: french
				? "Topologie réseau privée indisponible."
				: "Private network topology unavailable.",
		};
		return (
			<p className={styles.interactionHint} role="status">
				{status[graph]}
			</p>
		);
	}

	return (
		<div className={styles.wrapper}>
			<p id="homelab-flow-interaction-hint" className={styles.interactionHint}>
				<i className="fas fa-computer-mouse" aria-hidden="true" />{" "}
				{french
					? "La molette fait défiler la page. Utilisez Ctrl/Cmd + molette pour zoomer dans le diagramme."
					: "The wheel scrolls the page. Use Ctrl/Cmd + wheel to zoom the diagram."}
			</p>
			<div
				className={styles.flowGuard}
				onWheelCapture={keepPageScrollUnlessZooming}
				data-react-flow-scroll-policy="modifier-to-zoom"
				aria-describedby="homelab-flow-interaction-hint"
			>
				<HierarchicalHomeLabNetworkFlow graph={graph} />
			</div>
		</div>
	);
}
