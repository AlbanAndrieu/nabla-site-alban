import {
	type Dispatch,
	type RefObject,
	type SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";
import { catalogEntitySlug } from "@/lib/homelabCatalogV2Names";
import {
	type ResourceSnapshot,
	snapshotAgeState,
} from "@/lib/homelabResourceEvidence";
import { homelabServiceId } from "@/lib/homelabServices";
import type { ServicePresentationGroup } from "@/lib/servicePresentation";
import type { filterHierarchyGroups } from "./homelabServiceHierarchy";

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

/**
 * Cards mount asynchronously only after owner access. The browser's initial
 * fragment jump happens before that mount, so restore historical deep links.
 */
export function useServiceDeepLink(
	hasCatalog: boolean,
	hierarchyGroups: ReturnType<typeof filterHierarchyGroups>,
	setExpandedGroups: Dispatch<SetStateAction<Set<ServicePresentationGroup>>>,
): void {
	const handledAnchor = useRef<string | null>(null);
	useEffect(() => {
		if (!hasCatalog) return;
		const hash = window.location.hash;
		const match = /^#(?:homelab-)?service-([a-z0-9-]+)$/.exec(hash);
		if (!match || handledAnchor.current === hash) return;
		const serviceId = match[1];
		const group = hierarchyGroups.find((item) =>
			item.catalog.services.some(
				(service) => catalogEntitySlug(homelabServiceId(service)) === serviceId,
			),
		);
		if (!group) return;
		handledAnchor.current = hash;
		let secondFrame = 0;
		const firstFrame = window.requestAnimationFrame(() => {
			setExpandedGroups((current) =>
				current.has(group.group) ? current : new Set([...current, group.group]),
			);
			secondFrame = window.requestAnimationFrame(() => {
				document
					.getElementById(hash.slice(1))
					?.scrollIntoView({ block: "center" });
			});
		});
		return () => {
			window.cancelAnimationFrame(firstFrame);
			window.cancelAnimationFrame(secondFrame);
		};
	}, [hasCatalog, hierarchyGroups, setExpandedGroups]);
}
