"use client";

import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
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

/** Owner-only TrueNAS services; visitors get an operations link, not private data. */
export default function HomelabPrivateServices() {
	const french = useLocale() === "fr";
	const access = useHomelabAccess();
	if (access === "pending") return null;
	if (access === "denied")
		return (
			<p data-homelab-private-denied>
				<a href="https://ops.albandrieu.com/" rel="nofollow noreferrer">
					{french ? "Espace opérations privé" : "Private operations"}
				</a>
			</p>
		);
	return (
		<div data-homelab-private-view>
			<div className={styles.serviceFirst} data-service-first-homelab-view>
				<HomelabServicesBlock />
			</div>
			<HomelabOperationsDisclosure />
		</div>
	);
}
