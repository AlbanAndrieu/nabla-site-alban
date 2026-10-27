"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { HomelabEnvironmentFilter } from "@/lib/homelabEnvironments";
import type { HomelabHealthState } from "@/lib/homelabHealth";
import {
	homelabServiceId,
	isHomelabCatalogPlaceholder,
} from "@/lib/homelabServices";
import type { ServicePresentationGroup } from "@/lib/servicePresentation";
import type { ServiceTopology } from "@/lib/serviceTopology";
import CriticalDependencyHierarchy, {
	CRITICAL_DEPENDENCY_HIERARCHY_ID,
} from "./CriticalDependencyHierarchy";
import HomelabObservationCoverage from "./HomelabObservationCoverage";
import HomelabProbeDiagnostics from "./HomelabProbeDiagnostics";
import HomelabServiceGrid from "./HomelabServiceGrid";
import styles from "./HomelabServicesBlock.module.css";
import HomelabStatusOverview from "./HomelabStatusOverview";
import {
	ALL_GROUPS,
	filterHierarchyGroups,
	GROUP_TITLE_KEY,
	METRICS_PROFILE_KEY,
} from "./homelabServiceHierarchy";
import {
	countHealthStates,
	effectiveState,
	healthIndex,
	useHomelabHealth,
} from "./useHomelabHealth";

// Reuse the existing ReactFlow explorer without requesting private data in public mode.
const HierarchicalArchitectureExplorer = dynamic(
	() => import("@/app/[locale]/architecture/HierarchicalArchitectureExplorer"),
	{ ssr: false },
);

const HEALTH_STATES: readonly HomelabHealthState[] = [
	"ok",
	"warn",
	"fail",
	"unknown",
];

const NO_HEALTH_INDEX = healthIndex(null);

type HealthFilter = "all" | HomelabHealthState;
type GroupFilter = "all" | ServicePresentationGroup;

export default function HomelabServicesBlock({
	readOnly = false,
}: Readonly<{ readOnly?: boolean }>) {
	const t = useTranslations("homelab");
	const locale = useLocale();
	const french = locale === "fr";
	const state = useHomelabHealth(readOnly);
	const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
	const [environmentFilter, setEnvironmentFilter] =
		useState<HomelabEnvironmentFilter>("all");
	const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedGroups, setExpandedGroups] = useState<
		Set<ServicePresentationGroup>
	>(() => new Set(["services", "core-critical", "security-controls"]));
	const [criticalityOpen, setCriticalityOpen] = useState(false);
	const handledAnchor = useRef<string | null>(null);

	// If FastAPI provides cards but no matching relation graph, still show the
	// declared services. Never invent relations or assert dependency health.
	const graphTopology = useMemo<ServiceTopology | null>(() => {
		if (!state.catalog) return null;
		return (
			state.topology ?? {
				version: 2,
				catalogRevision: state.catalog.catalogRevision,
				name: "Backstage v2 — declared services only",
				nodes: state.catalog.services.map((service) => ({
					id: homelabServiceId(service),
					name: service.name,
					kind: service.kind ?? "service",
					category: service.category ?? "other",
					criticality: service.criticality,
				})),
				relations: [],
			}
		);
	}, [state.catalog, state.topology]);
  // Service cards render first; the expensive ReactFlow bundle mounts near viewport.
  const [graphInView, setGraphInView] = useState(false);
  const graphRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!graphTopology || graphInView) return;
    const target = graphRef.current;
    if (!target) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setGraphInView(true), 0);
      return () => window.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setGraphInView(true);
        observer.disconnect();
      }
    }, { rootMargin: "360px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [graphTopology, graphInView]);


	const indexedHealth = useMemo(
		() =>
			healthIndex(
				state.snapshot,
				state.siteHealth,
				state.catalog?.catalogRevision,
			),
		[state.snapshot, state.siteHealth, state.catalog?.catalogRevision],
	);
	const healthCounts = useMemo(
		() =>
			countHealthStates(
				state.catalog?.services ?? [],
				indexedHealth,
				state.healthUnavailable,
			),
		[indexedHealth, state.catalog?.services, state.healthUnavailable],
	);

	// Health only matters under a health filter; otherwise keep the grouping
	// stable across polls. Typing stays responsive while regrouping lags.
	const filterHealth = healthFilter === "all" ? NO_HEALTH_INDEX : indexedHealth;
	const filterHealthUnavailable =
		healthFilter !== "all" && state.healthUnavailable;
	const deferredSearchQuery = useDeferredValue(searchQuery);
	const hierarchyGroups = useMemo(
		() =>
			filterHierarchyGroups(
				state.catalog,
				state.topology,
				filterHealth,
				filterHealthUnavailable,
				{ healthFilter, environmentFilter, searchQuery: deferredSearchQuery },
			),
		[
			deferredSearchQuery,
			environmentFilter,
			filterHealth,
			filterHealthUnavailable,
			healthFilter,
			state.catalog,
			state.topology,
		],
	);

	const visibleHierarchyGroups = useMemo(
		() =>
			groupFilter === "all"
				? hierarchyGroups
				: hierarchyGroups.filter((group) => group.group === groupFilter),
		[groupFilter, hierarchyGroups],
	);
	const visibleCount = visibleHierarchyGroups.reduce(
		(total, group) => total + group.catalog.services.length,
		0,
	);

	// Cards mount asynchronously only after owner access. The browser's initial
	// fragment jump happens before that mount, so restore historical deep links.
	useEffect(() => {
		if (!state.catalog) return;
		const hash = window.location.hash;
		const match = /^#(?:homelab-)?service-([a-z0-9-]+)$/.exec(hash);
		if (!match || handledAnchor.current === hash) return;
		const serviceId = match[1];
		const group = hierarchyGroups.find((item) =>
			item.catalog.services.some(
				(service) => homelabServiceId(service) === serviceId,
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
	}, [state.catalog, hierarchyGroups]);

	const setGroupExpanded = (group: ServicePresentationGroup, open: boolean) => {
		setExpandedGroups((current) => {
			const next = new Set(current);
			if (open) next.add(group);
			else next.delete(group);
			return next;
		});
	};

	const openCriticality = () => {
		setCriticalityOpen(true);
		window.requestAnimationFrame(() => {
			document
				.getElementById(CRITICAL_DEPENDENCY_HIERARCHY_ID)
				?.scrollIntoView({ block: "start" });
		});
	};

	if (!state.catalog) {
		const catalogError = state.catalogFailure;
		return (
			<div
				className="text-center py-4"
				role={state.error ? "alert" : "status"}
				data-homelab-inventory-unavailable={state.error ? true : undefined}
			>
				{!state.error
					? t("loading")
					: catalogError === "access-denied"
						? french
							? "Clé de diagnostic refusée par FastAPI : le catalogue Backstage v2 reste privé."
							: "FastAPI rejected the diagnostics key: the Backstage v2 catalog remains private."
						: catalogError === "key-missing"
							? french
								? "Clé serveur manquante : catalogue Backstage v2 indisponible."
								: "Missing server key: Backstage v2 catalog unavailable."
							: t("unavailable")}
				{!readOnly && state.error && state.catalogIncident && (
					<p className="small text-muted mt-2" data-catalog-failure-stage={state.catalogIncident.stage}>
						{french ? "Phase du diagnostic" : "Diagnostic stage"}: <code>{state.catalogIncident.stage}</code>
						{" · "}
						{french ? "Référence support" : "Support reference"}: <code>{state.catalogIncident.requestId}</code>
					</p>
				)}
			</div>
		);
	}

	if (isHomelabCatalogPlaceholder(state.catalog)) {
		return (
			<section
				data-homelab-inventory-unavailable
				role="status"
				className="alert alert-warning"
			>
				<strong>
					{french
						? "Catalogue privé indisponible"
						: "Private catalog unavailable"}
				</strong>
				<p>
					{french
						? state.catalog.privateInventoryStatus === "access-denied"
							? "FastAPI a refusé l’accès au catalogue privé (HTTP 401/403). Vérifier DIAGNOSTICS_ACCESS_KEY dans Vercel et la valeur attendue côté fastapi-sample."
							: state.catalog.privateInventoryStatus === "key-missing"
								? "La clé DIAGNOSTICS_ACCESS_KEY est absente de l’environnement serveur Vercel. Le catalogue privé ne peut pas être récupéré."
								: "Le catalogue privé n’a pas été récupéré depuis l’API FastAPI (réseau, délai, erreur HTTP ou réponse invalide). Vérifier l’API et la clé DIAGNOSTICS_ACCESS_KEY."
						: state.catalog.privateInventoryStatus === "access-denied"
							? "FastAPI denied the private catalog (HTTP 401/403). Check DIAGNOSTICS_ACCESS_KEY in Vercel and the FastAPI server configuration."
							: state.catalog.privateInventoryStatus === "key-missing"
								? "DIAGNOSTICS_ACCESS_KEY is missing from the Vercel server environment. The private catalog cannot be retrieved."
								: "The private catalog could not be retrieved from FastAPI (network, timeout, HTTP error or invalid response). Verify the API and DIAGNOSTICS_ACCESS_KEY."}
				</p>
			</section>
		);
	}

	return (
		<>
			{readOnly && state.catalogStale && (
				<p data-homelab-catalog-stale role="status" className="small text-warning my-2">
					{french ? "Catalogue public en cache · santé non vérifiée" : "Saved public catalog · health unverified"}
				</p>
			)}
			{!state.healthRefreshing && state.healthUnavailable && !state.catalogStale && (
				<p data-homelab-api-degraded role="status" className="small text-warning my-2">
					{french
						? "Sondes indisponibles ou lentes · état non confirmé"
						: "Probes unavailable or slow · health unconfirmed"}
				</p>
			)}
      {!readOnly && !state.healthRefreshing && !state.snapshot && (
        <div className="alert alert-warning" role="status" data-owner-diagnostics-unavailable>
          <strong>{french ? "Diagnostics OWNER indisponibles" : "OWNER diagnostics unavailable"}</strong>
          <p className="mb-1">
            {state.ownerBoundary
              ? (french ? "Le serveur refuse l'accès aux sondes privées (owner-boundary). Vérifiez le canal OWNER, HOMELAB_OWNER_RAW_UPSTREAM_ENABLED et DIAGNOSTICS_ACCESS_KEY côté serveur."
                  : "The server denies private probes (owner-boundary). Check the OWNER channel, HOMELAB_OWNER_RAW_UPSTREAM_ENABLED and server-side DIAGNOSTICS_ACCESS_KEY.")
              : (french ? `FastAPI ne fournit pas de preuve détaillée (${state.healthStatus === null ? "réseau ou délai" : `HTTP ${state.healthStatus}`}). Le catalogue et les statuts publics ne confirment pas le fonctionnement de Docker, TLS ou Prometheus.`
                  : `FastAPI has no detailed evidence (${state.healthStatus === null ? "network or timeout" : `HTTP ${state.healthStatus}`}). Public catalog and health cannot confirm Docker, TLS or Prometheus.`)}
          </p>
          <small>{french
            ? "Consultez /api/homelab-access?diagnose=1 puis /api/homelab-health depuis le réseau autorisé. Aucun lien LAN ne sera inventé."
            : "Check /api/homelab-access?diagnose=1 and /api/homelab-health from an authorized network. LAN links will not be guessed."}</small>
        </div>
      )}
			{!readOnly && (
				<HomelabStatusOverview
					snapshot={state.snapshot}
					healthUnavailable={state.healthUnavailable}
					ownerBoundary={state.ownerBoundary === true}
					healthHttpStatus={state.healthStatus}
					healthRefreshing={state.healthRefreshing}
					onOpenCriticality={openCriticality}
				/>
			)}

			{!readOnly && (
				<>
					<HomelabObservationCoverage
						snapshot={state.snapshot}
						catalogServiceCount={state.catalog.services.length}
						topologyNodeCount={state.topology?.nodes.length ?? 0}
						topologyRelationCount={state.topology?.relations.length ?? 0}
					/>
					{state.siteHealthTraceId ? (
						<details data-owner-site-trace className="small my-3">
							<summary>{french ? "Référence du diagnostic Site → FastAPI" : "Site → FastAPI diagnostic reference"}</summary>
							<p>{state.siteHealthTraceConfirmed
								? (french ? "ID confirmé par l’en-tête FastAPI. Rechercher la trace correspondante dans les logs FastAPI."
									: "ID confirmed by the FastAPI response header. Find the matching FastAPI log entry.")
								: (french ? "ID envoyé à FastAPI ; réception non encore confirmée."
									: "ID sent to FastAPI; downstream receipt not yet confirmed.")}</p>
							<code data-owner-trace-id>{state.siteHealthTraceId}</code>
						</details>
					) : null}
					<HomelabProbeDiagnostics snapshot={state.snapshot} />
				</>
			)}


			<section
				id="truenas-health-dashboard"
				className={styles.healthDashboard}
				aria-labelledby="truenas-health-dashboard-title"
			>
				<div className={styles.healthDashboardHeader}>
					<div>
						<h3
							id="truenas-health-dashboard-title"
							className={styles.healthDashboardTitle}
						>
							{french
								? "Santé et filtres des services"
								: "Service health and filters"}
						</h3>
					</div>
					<span
						className={styles.refreshStatus}
						role="status"
						aria-live="polite"
					>
						{state.healthRefreshing
							? french
								? "Actualisation…"
								: "Refreshing…"
							: state.healthUnavailable
								? french
									? "Sondes non vérifiées"
									: "Probes unverified"
								: french
									? "Snapshot courant"
									: "Current snapshot"}
					</span>
				</div>

				<div
					className={styles.healthSummary}
					aria-label={french ? "Résumé santé" : "Health summary"}
				>
					{HEALTH_STATES.map((healthState) => (
						<button
							type="button"
							key={healthState}
							className={styles.healthChip}
							aria-pressed={healthFilter === healthState}
							data-homelab-health-filter={healthState}
							onClick={() =>
								setHealthFilter((current) =>
									current === healthState ? "all" : healthState,
								)
							}
						>
							<strong>{healthCounts[healthState]}</strong>{" "}
							{healthState === "ok"
								? french
									? "sains"
									: "healthy"
								: healthState === "warn"
									? french
										? "dégradés"
										: "degraded"
									: healthState === "fail"
										? french
											? "en échec"
											: "failed"
										: french
											? "inconnus"
											: "unknown"}
						</button>
					))}
				</div>

				<div className={styles.controls} data-homelab-hierarchy-controls>
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>
							{french ? "Santé" : "Health"}
						</span>
						<select
							className={styles.filterSelect}
							value={healthFilter}
							onChange={(event) =>
								setHealthFilter(event.currentTarget.value as HealthFilter)
							}
							data-homelab-health-select
						>
							<option value="all">
								{french ? "Tous les états" : "All health states"}
							</option>
							<option value="ok">{french ? "Sain" : "Healthy"}</option>
							<option value="warn">{french ? "Dégradé" : "Degraded"}</option>
							<option value="fail">{french ? "En échec" : "Failed"}</option>
							<option value="unknown">{french ? "Inconnu" : "Unknown"}</option>
						</select>
					</label>
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>
							{t("presentation.searchLabel")}
						</span>
						<input
							type="search"
							className={styles.filterSelect}
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.currentTarget.value)}
							placeholder={t("presentation.searchPlaceholder")}
							data-homelab-service-search
						/>
					</label>
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>
							{french ? "Environnement" : "Environment"}
						</span>
						<select
							className={styles.filterSelect}
							value={environmentFilter}
							onChange={(event) =>
								setEnvironmentFilter(
									event.currentTarget.value as HomelabEnvironmentFilter,
								)
							}
							data-homelab-environment-filter
						>
							<option value="all">
								{french ? "Tous les environnements" : "All environments"}
							</option>
							<option value="non-dev">
								{french
									? "Production + Staging (sans Dev)"
									: "Production + Staging (exclude Dev)"}
							</option>
							<option value="production">Production</option>
							<option value="staging">Staging</option>
							<option value="dev">Dev</option>
							<option value="defaulted">
								{french
									? "Production par défaut (métadonnées à revoir)"
									: "Default production (review metadata)"}
							</option>
						</select>
					</label>
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>
							{t("presentation.filterLabel")}
						</span>
						<select
							className={styles.filterSelect}
							value={groupFilter}
							onChange={(event) => {
								const next = event.currentTarget.value as GroupFilter;
								setGroupFilter(next);
								if (next !== "all") setGroupExpanded(next, true);
							}}
							data-homelab-presentation-filter
						>
							<option value="all">{t("presentation.allGroups")}</option>
							{ALL_GROUPS.map((group) => (
								<option value={group} key={group}>
									{t(GROUP_TITLE_KEY[group])}
								</option>
							))}
						</select>
					</label>
					<div className={styles.controlButtons}>
						<button
							type="button"
							className={styles.controlButton}
							onClick={() => {
								setHealthFilter("all");
								setEnvironmentFilter("all");
								setGroupFilter("all");
								setSearchQuery("");
							}}
						>
							{french ? "Réinitialiser" : "Reset filters"}
						</button>
						<button
							type="button"
							className={styles.controlButton}
							onClick={() => setExpandedGroups(new Set(ALL_GROUPS))}
							aria-controls="homelab-service-hierarchy"
						>
							{t("criticality.expandAll")}
						</button>
						<button
							type="button"
							className={styles.controlButton}
							onClick={() => setExpandedGroups(new Set())}
							aria-controls="homelab-service-hierarchy"
						>
							{t("criticality.collapseAll")}
						</button>
					</div>
				</div>
				<p className={styles.matchCount}>
					{french
						? `${visibleCount} services affichés sur ${state.catalog.services.length}`
						: `${visibleCount} services shown of ${state.catalog.services.length}`}
				</p>
			</section>

			<div id="homelab-service-hierarchy" data-homelab-service-hierarchy>
				{visibleHierarchyGroups.map((group) => {
					const issueCount = group.catalog.services.filter(
						(service) =>
							effectiveState(
								service,
								indexedHealth,
								state.healthUnavailable,
							) !== "ok",
					).length;
					return (
						<details
							className={styles.groupDetails}
							key={group.group}
							open={expandedGroups.has(group.group)}
							onToggle={(event) =>
								setGroupExpanded(group.group, event.currentTarget.open)
							}
							data-service-presentation-group={group.group}
							data-needs-attention={issueCount > 0 ? "true" : "false"}
							data-metrics-profile={group.metricsProfile}
						>
							<summary className={styles.groupSummary}>
								<span className={styles.groupTitle}>
									<strong>{t(GROUP_TITLE_KEY[group.group])}</strong>
								</span>
								<span className={styles.groupMeta}>
									<span className={styles.metricsProfileBadge}>
										{t(METRICS_PROFILE_KEY[group.metricsProfile])}
									</span>
									<span>
										{t("presentation.componentCount", {
											count: group.catalog.services.length,
										})}
									</span>
									<span data-group-issue-count={issueCount}>
										{t("presentation.issueCount", { count: issueCount })}
									</span>
								</span>
							</summary>
							<div className={`${styles.groupBody} homelab-service-subgrid`}>
								<HomelabServiceGrid
									catalog={group.catalog}
									siteHealth={state.siteHealth}
									snapshot={state.snapshot}
									healthUnavailable={readOnly ? false : state.healthUnavailable}
									ownerBoundary={state.ownerBoundary === true}
									healthHttpStatus={readOnly ? null : state.healthStatus}
									readOnly={readOnly}
								/>
							</div>
						</details>
					);
				})}
			</div>

			{graphTopology ? (
				<section
					data-homelab-service-reactflow
                    ref={graphRef}
					aria-labelledby="truenas-service-graph-title"
				>
					<h3 id="truenas-service-graph-title">
						{french
							? "Graphe interactif des services"
							: "Interactive service graph"}
					</h3>
					{!state.topology ? (
						<p role="status">
							{french
								? "Relations indisponibles : seuls les services déclarés sont affichés."
								: "Relations unavailable: showing declared services only."}
						</p>
					) : null}
					{graphInView ? (
						<HierarchicalArchitectureExplorer
						locale={locale}
						catalog={state.catalog}
						catalogSource="backstage-v2"
						topology={graphTopology}
						topologySource={state.topology ? "fastapi" : "local-fallback"}
						healthStatus={readOnly ? null : state.snapshot}
						healthSource={
							readOnly ? "site-v2" : state.snapshot ? "fastapi" : "unavailable"
						}
						readOnly={readOnly}
						initialMode="services"
						/>
					) : (
						<p role="status" data-homelab-graph-deferred>
							{french ? "Graphe chargé à l’approche de la section." : "Graph loads near the viewport."}
						</p>
					)}
				</section>
			) : null}

			{state.topology ? (
				<CriticalDependencyHierarchy
					topology={state.topology}
					open={criticalityOpen}
					onOpenChange={setCriticalityOpen}
				/>
			) : null}

			<style jsx global>{`
				.homelab-service-subgrid > .alert,
				.homelab-service-subgrid > [data-truenas-runtime-legend],
				.homelab-service-subgrid > [data-dependency-health-legend] {
					display: none !important;
				}
			`}</style>
		</>
	);
}
