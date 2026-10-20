"use client";

import dynamic from "next/dynamic";
import styles from "./HomelabServicesSection.module.css";
import useHomelabAccess from "./useHomelabAccess";

// Loaded only after the server confirmed owner access, so anonymous visitors
// never download nor render the operational views.
const HomelabServicesBlock = dynamic(() => import("./HomelabServicesBlock"), {
	ssr: false,
});
const HomelabOperationsDisclosure = dynamic(
	() => import("./HomelabOperationsDisclosure"),
	{ ssr: false },
);

/** Owner-only TrueNAS service catalog, health and troubleshooting. */
export default function HomelabPrivateServices() {
	if (useHomelabAccess() !== "trusted") return null;
	return (
		<div data-homelab-private-view>
			<div className={styles.serviceFirst} data-service-first-homelab-view>
				<HomelabServicesBlock />
			</div>
			<HomelabOperationsDisclosure />
		</div>
	);
}
