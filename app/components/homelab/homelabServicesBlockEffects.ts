import { type RefObject, useEffect, useRef, useState } from "react";
import {
	type ResourceSnapshot,
	snapshotAgeState,
} from "@/lib/homelabResourceEvidence";

/**
 * A single clock feeds all service groups. Hidden tabs do not tick until
 * visible again, and stale/foreign-revision resources are never "fresh".
 * `active` is false in SERVICE mode or behind the OWNER boundary.
 */
export function useResourceStale(
	resourceSnapshot: ResourceSnapshot | null,
	active: boolean,
	catalogRevision: string | undefined,
): boolean {
	const [resourceClock, setResourceClock] = useState<number | null>(null);
	useEffect(() => {
		if (!resourceSnapshot || !active) return;
		let interval: number | null = null;
		const refresh = () => {
			if (!document.hidden) setResourceClock(Date.now());
		};
		const syncVisibility = () => {
			if (document.hidden) {
				if (interval !== null) window.clearInterval(interval);
				interval = null;
				return;
			}
			refresh();
			if (interval === null) interval = window.setInterval(refresh, 60_000);
		};
		const initial = window.setTimeout(syncVisibility, 0);
		document.addEventListener("visibilitychange", syncVisibility);
		return () => {
			window.clearTimeout(initial);
			if (interval !== null) window.clearInterval(interval);
			document.removeEventListener("visibilitychange", syncVisibility);
		};
	}, [resourceSnapshot, active]);
	return Boolean(
		resourceSnapshot &&
			(resourceClock === null ||
				snapshotAgeState(resourceSnapshot, resourceClock, catalogRevision) !==
					"fresh"),
	);
}

/** Service cards render first; the expensive ReactFlow bundle mounts near viewport. */
export function useGraphNearViewport(
	hasGraph: boolean,
): [RefObject<HTMLElement | null>, boolean] {
	const [graphInView, setGraphInView] = useState(false);
	const graphRef = useRef<HTMLElement | null>(null);
	useEffect(() => {
		if (!hasGraph || graphInView) return;
		const target = graphRef.current;
		if (!target) return;
		if (typeof IntersectionObserver === "undefined") {
			const timer = window.setTimeout(() => setGraphInView(true), 0);
			return () => window.clearTimeout(timer);
		}
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setGraphInView(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "360px" },
		);
		observer.observe(target);
		return () => observer.disconnect();
	}, [hasGraph, graphInView]);
	return [graphRef, graphInView];
}
