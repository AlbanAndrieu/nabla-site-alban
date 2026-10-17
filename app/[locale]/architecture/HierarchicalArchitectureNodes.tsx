"use client";

import {
	Handle,
	type NodeProps,
	type NodeTypes,
	Position,
} from "@xyflow/react";
import {
	homelabHealthColor,
	isHttpsEndpoint,
	tlsIndicatorColor,
} from "@/lib/homelabHealthPresentation";
import { ArchitectureDependencyBadges } from "./ArchitectureDependencyEvidence";
import styles from "./HierarchicalArchitectureExplorer.module.css";
import type {
	ArchitectureNodeData,
	GroupNodeData,
} from "./hierarchicalArchitectureModel";

function ArchitectureGroupNode({ data }: NodeProps) {
	const item = data as GroupNodeData;
	return (
		<div className={styles.groupNode} data-architecture-group={item.groupKey}>
			<div className={styles.groupHeading}>
				<div>
					<strong>{item.label}</strong>
					<span>{item.description}</span>
				</div>
				<div className={styles.groupMeta}>
					<span>{item.count} nodes</span>
					<span>{item.flowHint}</span>
				</div>
			</div>
		</div>
	);
}

function ArchitectureNode({ data, selected }: NodeProps) {
	const item = data as ArchitectureNodeData;
	const fallback = item.name.trim().slice(0, 2).toUpperCase();
	const healthColor = item.healthState
		? homelabHealthColor(item.healthState)
		: undefined;
	const https = isHttpsEndpoint(item.url);
	const targetPosition =
		item.flowDirection === "up" ? Position.Bottom : Position.Top;
	const sourcePosition =
		item.flowDirection === "up" ? Position.Top : Position.Bottom;
	const healthLabel = item.healthState
		? `Health: ${item.healthState}${item.localHealthState && item.localHealthState !== item.healthState ? ` (local ${item.localHealthState})` : ""}`
		: "Health unavailable";

	return (
		<div
			className={`${styles.node} ${selected ? styles.nodeSelected : ""}`}
			data-reconciliation={item.reconciliation}
			data-health-state={item.healthState}
			data-criticality-tier={item.criticalityTier}
			data-blast-radius-level={item.blastRadiusLevel}
			style={
				healthColor
					? {
							borderColor: healthColor,
							boxShadow: `0 0 0 1px ${healthColor}55`,
						}
					: undefined
			}
		>
			<Handle
				type="target"
				position={targetPosition}
				className={styles.handle}
			/>
			<div className={styles.nodeMeta}>
				<span>{item.category}</span>
				<span style={healthColor ? { color: healthColor } : undefined}>
					{item.healthState ?? item.kind}
				</span>
			</div>
			<div className={styles.nodeHeading}>
				<span className={styles.nodeIconFrame} aria-hidden="true">
					{item.iconSrc ? (
						<img
							className={styles.nodeIconImage}
							src={item.iconSrc}
							alt=""
							loading="lazy"
						/>
					) : item.icon ? (
						<span className={styles.nodeIcon}>{item.icon}</span>
					) : (
						<span className={styles.nodeIconFallback}>{fallback}</span>
					)}
				</span>
				<strong
					className={styles.nodeTitle}
					style={healthColor ? { color: healthColor } : undefined}
				>
					{item.name}
				</strong>
				{https ? (
					<i
						className="fas fa-lock"
						style={{ color: tlsIndicatorColor(item.tlsTrusted), marginLeft: 6 }}
						title={
							item.tlsTrusted === true
								? "TLS trusted"
								: item.tlsTrusted === false
									? "TLS invalid"
									: "TLS not verified"
						}
						role="img"
						aria-label="TLS status"
					/>
				) : null}
				{item.cloudflareObserved ? (
					<i
						className="fas fa-cloud"
						style={{ color: item.cloudflareColor, marginLeft: 6 }}
						title={`Cloudflare${item.cloudflareStatus ? `: ${item.cloudflareStatus}` : " observed"}`}
						role="img"
						aria-label="Cloudflare evidence"
					/>
				) : null}
				{item.applicationError ? (
					<i
						className="fas fa-skull-crossbones"
						style={{ color: homelabHealthColor("fail"), marginLeft: 6 }}
						title={item.applicationError}
						role="img"
						aria-label={item.applicationError}
					/>
				) : null}
			</div>
			{item.criticalityTier ? (
				<span className={styles.criticalityBadge}>
					{item.criticalityTier.replaceAll("-", " ")}
					{typeof item.blastRadius === "number"
						? ` · blast radius ${item.blastRadius}`
						: ""}
				</span>
			) : null}
			{item.reconciliation ? (
				<span className={styles.runtimeBadge}>
					{item.reconciliation.replaceAll("_", " ")}
					{item.runtimeState ? ` · ${item.runtimeState}` : ""}
				</span>
			) : null}
			<ArchitectureDependencyBadges
				blockedBy={item.blockedBy}
				degradedBy={item.degradedBy}
				unconfirmed={item.unconfirmedDependencies}
				french={item.french}
			/>
			{item.detail ? (
				<small className={styles.nodeDetail}>{item.detail}</small>
			) : null}
			{item.url ? (
				<a
					className={`${styles.openLink} nodrag nopan`}
					href={item.url}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(event) => event.stopPropagation()}
					style={
						healthColor
							? { color: healthColor, borderColor: healthColor }
							: undefined
					}
					title={healthLabel}
				>
					{item.openLabel} ↗
				</a>
			) : null}
			<Handle
				type="source"
				position={sourcePosition}
				className={styles.handle}
			/>
		</div>
	);
}

export const NODE_TYPES: NodeTypes = {
	architecture: ArchitectureNode,
	architectureGroup: ArchitectureGroupNode,
};
