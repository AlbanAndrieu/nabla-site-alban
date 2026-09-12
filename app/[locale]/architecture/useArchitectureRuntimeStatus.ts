"use client";

import { useEffect, useState } from "react";
import {
	type HomelabStatusSnapshot,
	parseHomelabStatusSnapshot,
} from "@/lib/homelabStatus";

export type ArchitectureRuntimeSource = "loading" | "fastapi" | "unavailable";

const RUNTIME_POLL_MS = 30_000;

export default function useArchitectureRuntimeStatus() {
	const [runtimeStatus, setRuntimeStatus] =
		useState<HomelabStatusSnapshot | null>(null);
	const [runtimeSource, setRuntimeSource] =
		useState<ArchitectureRuntimeSource>("loading");

	useEffect(() => {
		let active = true;
		let controller: AbortController | null = null;

		const loadRuntime = async () => {
			if (document.hidden) return;
			controller?.abort();
			const requestController = new AbortController();
			controller = requestController;
			try {
				const response = await fetch("/api/homelab-status", {
					cache: "no-store",
					signal: requestController.signal,
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const snapshot = parseHomelabStatusSnapshot(await response.json());
				if (!snapshot) throw new Error("Invalid homelab status payload");
				if (active) {
					setRuntimeStatus(snapshot);
					setRuntimeSource("fastapi");
				}
			} catch {
				if (active && !requestController.signal.aborted) {
					setRuntimeSource("unavailable");
				}
			}
		};

		void loadRuntime();
		const timer = window.setInterval(() => void loadRuntime(), RUNTIME_POLL_MS);
		const onVisibilityChange = () => {
			if (!document.hidden) void loadRuntime();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			active = false;
			controller?.abort();
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	return { runtimeStatus, runtimeSource } as const;
}
