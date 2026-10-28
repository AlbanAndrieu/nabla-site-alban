"use client";

import { useMemo, useState } from "react";
import { Background, Controls, ReactFlow, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GuideCopy } from "./content";
import { YUBIKEY_GRAPH_EDGES, YUBIKEY_GRAPH_NODES } from "./model";
import styles from "./page.module.css";

export default function YubiKeyGraph({ copy }: Readonly<{ copy: GuideCopy }>) {
  const [selected, setSelected] = useState<string | null>(null);
  const nodes = useMemo<Node[]>(() => YUBIKEY_GRAPH_NODES.map((item) => ({
    id: item.id,
    position: { x: item.x, y: item.y },
    data: { label: <strong className={styles.graphNodeLabel}>{copy.graphRoles[item.id]}</strong> },
    draggable: false,
    style: {
      width: 190,
      color: "#f8fafc",
      borderRadius: 12,
      border: item.id === selected ? "3px solid #fbbf24" : "1px solid #94a3b8",
      background: item.kind === "key" ? "#155e75" : item.kind === "recovery" ? "#4c1d95" : "#172b4d",
      padding: "12px 8px",
      textAlign: "center",
    },
  })), [copy, selected]);
  const edges = useMemo<Edge[]>(() => YUBIKEY_GRAPH_EDGES.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    label: copy.graphEdges[edge.id],
    style: { stroke: edge.source === selected || edge.target === selected ? "#fbbf24" : "#7dd3fc", strokeWidth: 2 },
    labelStyle: { fill: "#e2e8f0", fontSize: 12 },
    labelBgStyle: { fill: "#0f172a", fillOpacity: 0.96 },
    labelBgPadding: [4, 3],
    labelBgBorderRadius: 4,
  })), [copy, selected]);
  const related = selected
    ? YUBIKEY_GRAPH_EDGES.filter((edge) => edge.source === selected || edge.target === selected)
    : [];
  return (
    <section aria-labelledby="yubikey-graph-title" className={styles.graphSection}>
      <h2 id="yubikey-graph-title">{copy.diagramTitle}</h2>
      <p>{copy.diagramLead}</p>
      <div
        className={styles.graphCanvas}
        role="region"
        aria-label={copy.diagramTitle}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.05 }}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, node) => setSelected(node.id)}
          zoomOnScroll={false}
          panOnScroll={false}
          preventScrolling={false}
          minZoom={0.3}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#334155" bgColor="#020617" gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className={styles.graphSelector} role="group" aria-label={copy.accessibleGraph}>
        {YUBIKEY_GRAPH_NODES.map((item) => (
          <button
            type="button"
            key={item.id}
            className={styles.graphSelectButton}
            aria-pressed={selected === item.id}
            onClick={() => setSelected(item.id)}
          >
            {copy.graphRoles[item.id]}
          </button>
        ))}
      </div>
      <div className={styles.graphDetail} aria-live="polite">
        <strong>{selected ? copy.graphRoles[selected] : copy.keyLegend}</strong>
        {selected && related.length > 0 ? (
          <ul>{related.map((edge) => (
            <li key={edge.id}>
              {copy.graphRoles[edge.source]} → {copy.graphRoles[edge.target]}
              {" — "}{copy.graphEdges[edge.id]}
            </li>
          ))}</ul>
        ) : null}
      </div>
      <details className={styles.graphAlternative}>
        <summary>{copy.accessibleGraph}</summary>
        <ul>{YUBIKEY_GRAPH_EDGES.map((edge) => (
          <li key={edge.id}>
            {copy.graphRoles[edge.source]} → {copy.graphRoles[edge.target]}
            {" — "}{copy.graphEdges[edge.id]}
          </li>
        ))}</ul>
      </details>
      <p className={styles.disclaimer}>{copy.keyLegend}</p>
    </section>
  );
}
