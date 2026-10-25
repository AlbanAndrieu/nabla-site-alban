import { isSafePublicServiceId, isSafePublicText } from "../../../lib/homelabPublicTextSafety.ts";

/** Bounded C4 projection from the canonical Backstage v2 topology; never a health verdict. */
export type C4Level = "context" | "containers";
export type C4Role = "person" | "system" | "external" | "container";
export type C4Item = { id: string; label: string; description: string; role: C4Role };
export type C4Link = { id: string; source: string; target: string; label: string };
export type C4Projection = {
  level: C4Level;
  nodes: C4Item[];
  links: C4Link[];
  omitted: number;
  revision: string | null;
};
export type C4TopologyInput = {
  catalogRevision?: string;
  nodes: ReadonlyArray<{ id: string; name: string; kind: string; category: string }>;
  relations: ReadonlyArray<{ source: string; target: string; type: string }>;
};

// L1 is an architectural context model, not a live inventory or a service probe.
const CONTEXT_NODES: C4Item[] = [
  { id: "operator", label: "Homelab owner", description: "Person / OWNER", role: "person" },
  { id: "visitor", label: "Visitor", description: "Person / PUBLIC", role: "person" },
  { id: "nabla", label: "Nabla platform", description: "Software system", role: "system" },
  { id: "github", label: "GitHub", description: "Source repository", role: "external" },
  { id: "vercel", label: "Vercel", description: "Site hosting", role: "external" },
  { id: "cloudflare", label: "Cloudflare", description: "Edge and access", role: "external" },
];
const CONTEXT_LINKS: C4Link[] = [
  { id: "owner-nabla", source: "operator", target: "nabla", label: "operates" },
  { id: "visitor-nabla", source: "visitor", target: "nabla", label: "reads public content" },
  { id: "nabla-github", source: "nabla", target: "github", label: "source" },
  { id: "nabla-vercel", source: "nabla", target: "vercel", label: "site delivery" },
  { id: "nabla-cloudflare", source: "nabla", target: "cloudflare", label: "edge access" },
];

const MAX_CONTAINER_NODES = 16;
const RELATION_TYPES = new Set([
  "dependsOn", "consumesApi", "providesApi", "partOf", "hostedBy",
  "routesTo", "observedBy", "storesIn", "authenticatesVia", "exposedBy", "automates",
]);

export function projectC4Topology(topology: C4TopologyInput, level: C4Level): C4Projection {
  const revision = topology.catalogRevision ?? null;
  if (level === "context") {
    return { level, nodes: CONTEXT_NODES, links: CONTEXT_LINKS, omitted: 0, revision };
  }
  // No URLs, hostnames, LAN IPs, probe evidence or arbitrary descriptions in this projection.
  const unique = new Map<string, C4Item>();
  for (const node of topology.nodes) {
    if (!isSafePublicServiceId(node.id) || !isSafePublicText(node.name, 150) || unique.has(node.id)) continue;
    const description = isSafePublicText(node.kind, 80) ? node.kind :
      isSafePublicText(node.category, 80) ? node.category : "Service";
    unique.set(node.id, {
      id: node.id,
      label: node.name.slice(0, 80),
      description: description.slice(0, 48),
      role: "container",
    });
  }
  const degree = new Map<string, number>();
  for (const link of topology.relations) {
    if (!unique.has(link.source) || !unique.has(link.target) || !RELATION_TYPES.has(link.type)) continue;
    degree.set(link.source, (degree.get(link.source) ?? 0) + 1);
    degree.set(link.target, (degree.get(link.target) ?? 0) + 1);
  }
  const sorted = [...unique.values()].sort((a, b) =>
    (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.id.localeCompare(b.id),
  );
  const nodes = sorted.slice(0, MAX_CONTAINER_NODES);
  const visible = new Set(nodes.map((node) => node.id));
  const links: C4Link[] = [];
  for (const link of topology.relations) {
    if (visible.has(link.source) && visible.has(link.target) && link.source !== link.target && RELATION_TYPES.has(link.type)) {
      links.push({
        id: [link.source, link.type, link.target, String(links.length)].join(":"),
        source: link.source,
        target: link.target,
        label: link.type,
      });
    }
  }
  return { level, nodes, links: links.slice(0, 48), omitted: sorted.length - nodes.length, revision };
}

/** Discover declared inbound/outbound relationships without consulting runtime health. */
export function c4NodeRelations(view: C4Projection, id: string): C4Link[] {
  if (!view.nodes.some((node) => node.id === id)) return [];
  return view.links.filter((link) => link.source === id || link.target === id);
}
