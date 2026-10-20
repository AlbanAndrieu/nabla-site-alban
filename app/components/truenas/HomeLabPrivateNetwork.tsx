"use client";

import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import useHomelabAccess from "@/app/components/homelab/useHomelabAccess";
import styles from "./HomeLabSection.module.css";

// Loaded only after the server confirmed owner access. The graph itself is
// fetched from the gated /api/homelab-network-flow route.
const CloudflareStatusWarning = dynamic(
	() => import("@/app/components/homelab/CloudflareStatusWarning"),
	{ ssr: false },
);
const HomeLabNetworkFlow = dynamic(() => import("./HomeLabNetworkFlow"), {
	ssr: false,
});

/** Owner-only Cloudflare status and network topology of the TrueNAS page. */
export default function HomeLabPrivateNetwork() {
	const french = useLocale() === "fr";
	if (useHomelabAccess() !== "trusted") return null;
	return (
		<div data-homelab-private-view>
			<CloudflareStatusWarning />
			<aside
				className={styles.networkCard}
				aria-label={
					french
						? "Topologie réseau et exposition du homelab"
						: "Homelab network and exposure topology"
				}
			>
				<div className={styles.header}>
					<span className={styles.eyebrow}>
						{french ? "Vue propriétaire" : "Owner view"}
					</span>
					<strong>
						{french
							? "Chemins réseau, ingress et DNS"
							: "Network, ingress and DNS paths"}
					</strong>
				</div>
				<HomeLabNetworkFlow />
			</aside>
		</div>
	);
}
