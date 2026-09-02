"use client";

import { useEffect, useMemo, useState } from "react";
import type { HomelabHealthEntry, HomelabHealthSnapshot } from "@/lib/homelabHealth";
import {
	affectedDependents,
	explainHealth,
	incidentDependencyPath,
	type HealthCause,
} from "@/lib/homelabImpact";
import {
	fetchHomelabHealthOnce,
	fetchServiceTopologyOnce,
} from "@/lib/homelabTroubleshootingClient";
import type { ServiceTopology } from "@/lib/serviceTopology";

function stateClass(state?: string): string {
	if (state === "ok") return "text-success";
	if (state === "fail") return "text-danger";
	if (state === "warn") return "text-warning";
	return "text-muted";
}

function causeLabel(cause: HealthCause, french: boolean): string {
	switch (cause.code) {
		case "application_error":
			return french ? "Erreur applicative observée" : "Observed application error";
		case "local_failure":
			return french ? "Le service échoue localement" : "The service is failing locally";
		case "dependency_failure":
			return french
				? `Dépendance requise en échec : ${(cause.targets ?? []).join(" · ")}`
				: `Failed required dependency: ${(cause.targets ?? []).join(" · ")}`;
		case "dependency_unknown":
			return french
				? `Dépendance requise dégradée/inconnue : ${(cause.targets ?? []).join(" · ")}`
				: `Degraded/unknown required dependency: ${(cause.targets ?? []).join(" · ")}`;
		case "stale_observation":
			return french ? "Preuve d’observation obsolète" : "Stale observation evidence";
		case "runtime_degraded":
			return french ? "Runtime TrueNAS dégradé ou transitionnel" : "TrueNAS runtime degraded or transitional";
		case "healthy":
			return french ? "Preuves locales et dépendances saines" : "Healthy local and dependency evidence";
		case "unknown":
			return french ? "Preuves insuffisantes" : "Insufficient evidence";
	}
}

function initialHashService(): string {
	if (typeof window === "undefined") return "";
	return window.location.hash.startsWith("#service-")
		? window.location.hash.slice("#service-".length)
		: "";
}

export default function ArchitectureImpactInspector({
	locale,
}: Readonly<{ locale: string }>) {
	const french = locale === "fr";
	const [topology, setTopology] = useState<ServiceTopology | null>(null);
	const [health, setHealth] = useState<HomelabHealthSnapshot | null>(null);
	const [selectedId, setSelectedId] = useState("");
	const [showImpact, setShowImpact] = useState(false);

	useEffect(() => {
		setSelectedId(initialHashService());
		let active = true;
		void Promise.all([fetchServiceTopologyOnce(), fetchHomelabHealthOnce()]).then(
			([nextTopology, nextHealth]) => {
				if (!active) return;
				setTopology(nextTopology);
				setHealth(nextHealth);
			},
		);
		const onHashChange = () => setSelectedId(initialHashService());
		window.addEventListener("hashchange", onHashChange);
		return () => {
			active = false;
			window.removeEventListener("hashchange", onHashChange);
		};
	}, []);

	const nodes = useMemo(
		() => [...(topology?.nodes ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
		[topology],
	);
	const entry = useMemo(
		() => health?.services.find((item) => item.id === selectedId),
		[health, selectedId],
	);
	const impacts = useMemo(
		() => (topology && selectedId ? affectedDependents(topology, selectedId) : []),
		[topology, selectedId],
	);
	const causes = useMemo(() => (entry ? explainHealth(entry) : []), [entry]);
	const incidentPath = useMemo(
		() => (entry ? incidentDependencyPath(entry, health?.services ?? []) : []),
		[entry, health],
	);
	const names = useMemo(
		() => new Map(nodes.map((node) => [node.id, node.name])),
		[nodes],
	);

	const selectService = (id: string) => {
		setSelectedId(id);
		setShowImpact(false);
		if (id) window.history.replaceState(null, "", `#service-${id}`);
		else window.history.replaceState(null, "", "#service-impact-inspector");
	};

	return (
		<section
			id="service-impact-inspector"
			className="content-section"
			aria-labelledby="service-impact-inspector-title"
			data-architecture-impact-inspector
		>
			<div className="container py-4">
				<div className="card bg-dark border-secondary p-3">
					<h2 id="service-impact-inspector-title" className="h4">
						<i className="fas fa-stethoscope" aria-hidden="true" />{" "}
						{french ? "Diagnostic d’impact et de cause racine" : "Impact and root-cause inspector"}
					</h2>
					<p className="text-muted">
						{french
							? "Sélectionne un service pour séparer sa santé locale, les causes observées via blocked_by et son rayon d’impact structurel dans la topologie requise."
							: "Select a service to separate local health, observed blocked_by causes, and structural blast radius across required topology relations."}
					</p>
					<label className="form-label" htmlFor="architecture-service-inspector">
						{french ? "Service" : "Service"}
					</label>
					<select
						id="architecture-service-inspector"
						className="form-select"
						value={selectedId}
						onChange={(event) => selectService(event.target.value)}
					>
						<option value="">{french ? "Choisir un service…" : "Choose a service…"}</option>
						{nodes.map((node) => (
							<option key={node.id} value={node.id}>{node.name}</option>
						))}
					</select>

					{selectedId ? (
						<div className="mt-3" data-selected-service-impact>
							<div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
								<strong>{names.get(selectedId) ?? selectedId}</strong>
								<a href={`/${locale}/truenas#service-${selectedId}`}>
									{french ? "Ouvrir la carte TrueNAS" : "Open TrueNAS service card"}
								</a>
							</div>
							{entry ? (
								<>
									<p className="mb-1 mt-2">
										{french ? "État local / effectif" : "Local / effective state"}: {" "}
										<span className={stateClass(entry.local_state ?? entry.state)}>{entry.local_state ?? entry.state}</span>
										{" → "}
										<span className={stateClass(entry.effective_state ?? entry.state)}>{entry.effective_state ?? entry.state}</span>
									</p>
									<ul className="ps-3 mb-2" data-architecture-root-cause>
										{causes.map((cause, index) => (
											<li key={`${cause.code}:${index}`} className={stateClass(cause.state)}>
												{causeLabel(cause, french)}
											</li>
										))}
									</ul>
								</>
							) : (
								<p className="text-muted mt-2">{french ? "Aucune preuve de santé courante pour ce nœud." : "No current health evidence for this node."}</p>
							)}

							{incidentPath.length > 1 ? (
								<p data-architecture-incident-path>
									<strong>{french ? "Chemin probable" : "Probable path"}:</strong>{" "}
									{incidentPath.map((id) => names.get(id) ?? id).join(" → ")}
								</p>
							) : null}

							<button
								type="button"
								className="btn btn-outline-primary btn-sm"
								onClick={() => setShowImpact((value) => !value)}
								aria-expanded={showImpact}
							>
								{showImpact
									? french ? "Masquer le rayon d’impact" : "Hide affected dependents"
									: french ? "Afficher les dépendants impactables" : "Show affected dependents"} ({impacts.length})
							</button>

							{showImpact ? (
								<div className="mt-2" data-architecture-blast-radius>
									<ul className="mb-1 ps-3">
										{impacts.map((impact) => (
											<li key={impact.id}>
												<a href={`#service-${impact.id}`} onClick={() => selectService(impact.id)}>{impact.name}</a>
												{" · "}{impact.distance === 1 ? (french ? "direct" : "direct") : `${impact.distance} hops`}
											</li>
										))}
									</ul>
									<p className="text-muted mb-0">
										{french ? "Rayon d’impact structurel : ces services dépendent du nœud sélectionné, mais ils ne sont pas nécessairement en panne maintenant." : "Structural blast radius: these services depend on the selected node, but they are not necessarily failing now."}
									</p>
								</div>
							) : null}
						</div>
					) : null}
				</div>
			</div>
		</section>
	);
}
