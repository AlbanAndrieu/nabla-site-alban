"use client";

import { useEffect, useState } from "react";
import ExternalLink from "@/components/ui/ExternalLink";
import styles from "./SecurityArfTree.module.css";

type ArfNode = {
	name?: string;
	type?: string;
	url?: string;
	description?: string;
	children?: ArfNode[];
};

type Props = Readonly<{ locale: string }>;

function ArfTreeNode({
	node,
	depth,
}: Readonly<{ node: ArfNode; depth: number }>) {
	const hasChildren = Boolean(node.children?.length);
	const label = node.name?.trim() || "Resource group";

	if (hasChildren) {
		return (
			<li className={styles.item}>
				<details className={styles.folder} open={depth === 0}>
					<summary>{label}</summary>
					<ul className={styles.children}>
						{node.children?.map((child, index) => (
							<ArfTreeNode
								node={child}
								depth={depth + 1}
								key={`${child.name ?? "resource"}-${index}`}
							/>
						))}
					</ul>
				</details>
			</li>
		);
	}

	return (
		<li className={styles.item}>
			{node.url ? (
				<ExternalLink className={styles.link} href={node.url}>
					<span>{label}</span>
					<i
						className="fa-solid fa-arrow-up-right-from-square"
						aria-hidden="true"
					/>
				</ExternalLink>
			) : (
				<span>{label}</span>
			)}
			{node.description ? (
				<span className={styles.description}>{node.description}</span>
			) : null}
		</li>
	);
}

export default function SecurityArfTree({ locale }: Props) {
	const isFrench = locale === "fr";
	const [data, setData] = useState<ArfNode | null>(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		const controller = new AbortController();

		void fetch("/arf.json", { signal: controller.signal })
			.then((response) => {
				if (!response.ok)
					throw new Error(`ARF request failed: ${response.status}`);
				return response.json() as Promise<ArfNode>;
			})
			.then(setData)
			.catch((cause: unknown) => {
				if (cause instanceof DOMException && cause.name === "AbortError")
					return;
				setError(true);
			});

		return () => controller.abort();
	}, []);

	if (error) {
		return (
			<p className={styles.status} role="status">
				{isFrench
					? "L’arbre des ressources de sécurité est temporairement indisponible."
					: "The security resources tree is temporarily unavailable."}
			</p>
		);
	}

	if (!data) {
		return (
			<p className={styles.status} role="status">
				{isFrench
					? "Chargement des ressources de sécurité…"
					: "Loading security resources…"}
			</p>
		);
	}

	const rootNodes = data.children?.length ? data.children : [data];
	return (
		<div
			className={styles.tree}
			aria-label={
				isFrench
					? "Arbre dépliable des ressources OSINT et sécurité"
					: "Expandable OSINT and security resources tree"
			}
		>
			<ul className={styles.list}>
				{rootNodes.map((node, index) => (
					<ArfTreeNode
						node={node}
						depth={0}
						key={`${node.name ?? "root"}-${index}`}
					/>
				))}
			</ul>
		</div>
	);
}
