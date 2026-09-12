"use client";

import { useLocale } from "next-intl";
import type { WheelEvent } from "react";
import HierarchicalHomeLabNetworkFlow from "./HierarchicalHomeLabNetworkFlow";
import styles from "./HomeLabNetworkFlow.module.css";

function keepPageScrollUnlessZooming(event: WheelEvent<HTMLDivElement>) {
	if (!event.ctrlKey && !event.metaKey) event.stopPropagation();
}

export default function HomeLabNetworkFlow() {
	const french = useLocale() === "fr";

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
				<HierarchicalHomeLabNetworkFlow />
			</div>
		</div>
	);
}
