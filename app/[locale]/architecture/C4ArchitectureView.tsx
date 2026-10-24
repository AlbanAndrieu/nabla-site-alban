"use client";

import { useMemo, useState } from "react";
import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ServiceTopology } from "@/lib/serviceTopology";
import { projectC4Topology, type C4Level, type C4Item } from "./c4ArchitectureModel";
import styles from "./C4ArchitectureView.module.css";

type Props = { locale: string; topology: ServiceTopology; readOnly: boolean };

function position(item: C4Item, index: number, level: C4Level) {
  if (level === "context") {
    const coords: Record<string, { x: number; y: number }> = {
      operator: { x: 0, y: 50 }, visitor: { x: 0, y: 270 },
      nabla: { x: 360, y: 160 }, github: { x: 720, y: 20 },
      vercel: { x: 720, y: 180 }, cloudflare: { x: 720, y: 340 },
    };
    return coords[item.id] ?? { x: 0, y: 0 };
  }
  return { x: (index % 4) * 285, y: Math.floor(index / 4) * 185 };
}

export default function C4ArchitectureView({ locale, topology, readOnly }: Readonly<Props>) {
  const french = locale === "fr";
  const [level, setLevel] = useState<C4Level>("context");
  const projection = useMemo(() => projectC4Topology(topology, level), [topology, level]);
  const nodes = useMemo<Node[]>(() => projection.nodes.map((item, index) => ({
    id: item.id,
    position: position(item, index, level),
    draggable: false,
    selectable: false,
    data: { label: (
      <div className={styles.nodeContent}>
        <strong>{item.label}</strong>
        <small>{item.description}</small>
      </div>
    ) },
    style: {
      width: 225,
      minHeight: 85,
      borderRadius: 12,
      background: item.role === "person" ? "#164e63" : item.role === "system" ? "#1e40af" : "#172b4d",
      border: item.role === "system" ? "2px solid #7dd3fc" : "1px solid #64748b",
      color: "#f8fafc",
    },
  })), [projection.nodes, level]);
  const edges = useMemo<Edge[]>(() => projection.links.map((link) => ({
    id: link.id,
    source: link.source,
    target: link.target,
    type: "smoothstep",
    label: link.label,
    style: { stroke: "#7dd3fc", strokeWidth: 1.6 },
    labelStyle: { fill: "#e2e8f0", fontSize: 11 },
    labelBgStyle: { fill: "#0f172a", fillOpacity: 0.94 },
    labelBgPadding: [5, 3],
    labelBgBorderRadius: 4,
  })), [projection.links]);

  return (
    <section id="architecture-c4" className={styles.section} aria-labelledby="architecture-c4-title" data-c4-view={level}>
      <header className={styles.header}>
        <div>
          <h2 id="architecture-c4-title">{french ? "Architecture C4" : "C4 architecture"}</h2>
          <p>{french
            ? "Vues d'architecture déclarées, et non sondes en temps réel. Les données L2 proviennent du catalogue Backstage v2."
            : "Declared architecture, not live probes. L2 uses the Backstage v2 topology."}</p>
        </div>
        <div className={styles.switcher} role="group" aria-label={french ? "Niveau C4" : "C4 level"}>
          <button type="button" aria-pressed={level === "context"} onClick={() => setLevel("context")}>
            {french ? "L1 · Contexte" : "L1 · Context"}
          </button>
          <button type="button" aria-pressed={level === "containers"} onClick={() => setLevel("containers")}>
            {french ? "L2 · Conteneurs" : "L2 · Containers"}
          </button>
        </div>
      </header>
      <p className={styles.metadata} role="status">
        {projection.nodes.length} {french ? "éléments" : "elements"} · {projection.links.length} {french ? "relations" : "relations"}
        {projection.omitted ? " · " + projection.omitted + (french ? " autres services dans la topologie complète" : " other services in the full topology") : ""}
        {projection.revision ? " · " + (french ? "révision " : "revision ") + projection.revision.slice(0, 18) : ""}
        {readOnly ? " · " + (french ? "lecture publique" : "public view") : ""}
      </p>
      <div className={styles.canvas} role="img" aria-label={french ? "Diagramme d'architecture C4 interactif" : "Interactive C4 architecture diagram"}>
        <ReactFlow
          key={level}
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.17, maxZoom: 1.25 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnScroll={false}
          zoomActivationKeyCode={["Control", "Meta"]}
          preventScrolling={false}
          minZoom={0.2}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#334155" bgColor="#020617" gap={22} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <details className={styles.alternative}>
        <summary>{french ? "Version textuelle accessible des relations" : "Accessible text description of relationships"}</summary>
        <ul>{projection.links.map((link) => (
          <li key={link.id}>
            {projection.nodes.find((node) => node.id === link.source)?.label ?? link.source}
            {" → "}
            {projection.nodes.find((node) => node.id === link.target)?.label ?? link.target}
            {" ("}{link.label}{")"}
          </li>
        ))}</ul>
      </details>
      <p className={styles.footnote}>{level === "containers"
        ? (french
          ? "L2 affiche un sous-ensemble borné des services et relations déclarés. Un service du catalogue n'est pas nécessairement un conteneur C4 au sens strict. L3 attend un modèle de composants validé."
          : "L2 shows a bounded set of declared services and relationships. A catalog service is not necessarily a strict C4 container. L3 awaits a validated component model.")
        : (french
          ? "L1 exprime le contexte conceptuel (utilisateurs et systèmes externes), sans conclure à leur disponibilité."
          : "L1 shows conceptual actors and external systems, not operational availability.")}</p>
    </section>
  );
}
