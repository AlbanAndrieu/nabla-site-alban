import assert from "node:assert/strict";
import test from "node:test";
import { EDGES } from "../app/components/truenas/homelabNetworkFlowEdges";
import {
	buildEdges,
	buildNodes,
	COLUMN_GAP,
	DOMAIN_ORDER,
	GROUP_HEADER,
	GROUP_PADDING,
	LINK_STYLES,
	MAX_COLUMNS,
	NODE_WIDTH,
	PATH_NODE_IDS,
	parseNetworkGraph,
	visibleNodeIds,
} from "../app/components/truenas/homelabNetworkFlowGraph";
import { NODES } from "../app/components/truenas/homelabNetworkFlowNodes";

const ALL = visibleNodeIds(NODES, "all");

test("static topology has unique node and edge ids with resolvable endpoints", () => {
	const nodeIds = NODES.map((node) => node.id);
	assert.equal(new Set(nodeIds).size, nodeIds.length);
	const edgeIds = EDGES.map((edge) => edge.id);
	assert.equal(new Set(edgeIds).size, edgeIds.length);
	for (const edge of EDGES) {
		assert.ok(nodeIds.includes(edge.source), edge.id);
		assert.ok(nodeIds.includes(edge.target), edge.id);
	}
	for (const ids of Object.values(PATH_NODE_IDS)) {
		for (const id of ids) assert.ok(nodeIds.includes(id), id);
	}
});

test("all paths build one group per failure domain plus every network node", () => {
	const nodes = buildNodes(NODES, ALL, false);
	assert.equal(NODES.length, 22);
	assert.equal(nodes.length, NODES.length + DOMAIN_ORDER.length);
	const groups = nodes.filter((node) => node.type === "networkGroup");
	assert.deepEqual(
		groups.map((node) => node.id),
		[
			"network-group-external",
			"network-group-gateway",
			"network-group-lan",
			"network-group-truenas",
		],
	);
	assert.deepEqual(
		groups.map((node) => node.data.count),
		[5, 3, 4, 10],
	);
	assert.equal(groups[3]?.data.label, "4 · TrueNAS failure domain");
	assert.equal(
		buildNodes(NODES, ALL, true)[0]?.data.label,
		"1 · Externe / WAN",
	);
	for (const group of groups) {
		assert.equal(group.selectable, false);
		assert.equal(group.draggable, false);
		assert.equal(group.zIndex, -1);
	}
});

test("network nodes are parented to their failure-domain group and laid out on a grid", () => {
	const nodes = buildNodes(NODES, ALL, false);
	const byId = new Map(nodes.map((node) => [node.id, node]));
	for (const spec of NODES) {
		const node = byId.get(spec.id);
		assert.ok(node, spec.id);
		assert.equal(node.type, "network");
		assert.equal(node.parentId, `network-group-${spec.domain}`);
		assert.equal(node.extent, "parent");
		assert.equal(node.data, spec.data);
	}
	const truenasChildren = nodes.filter(
		(node) => node.parentId === "network-group-truenas",
	);
	assert.deepEqual(truenasChildren[0]?.position, {
		x: GROUP_PADDING,
		y: GROUP_HEADER + 12,
	});
	assert.equal(
		truenasChildren[MAX_COLUMNS]?.position.x,
		GROUP_PADDING,
		"fifth node wraps to a new row",
	);
	assert.equal(
		truenasChildren[1]?.position.x,
		GROUP_PADDING + NODE_WIDTH + COLUMN_GAP,
	);
	const groupYs = nodes
		.filter((node) => node.type === "networkGroup")
		.map((node) => node.position.y);
	assert.equal(groupYs[0], 0);
	assert.ok(groupYs.every((y, index) => index === 0 || y > groupYs[index - 1]));
});

test("path filters drop hidden domains and edges with hidden endpoints", () => {
	const tunnelNodes = buildNodes(NODES, PATH_NODE_IDS.tunnel, false);
	assert.equal(
		tunnelNodes.filter((node) => node.type === "network").length,
		PATH_NODE_IDS.tunnel.size,
	);
	const lanNodes = buildNodes(NODES, PATH_NODE_IDS.lan, false);
	assert.equal(
		lanNodes.some((node) => node.id === "network-group-external"),
		false,
	);
	assert.equal(buildEdges(EDGES, ALL).length, EDGES.length);
	const tunnelEdges = buildEdges(EDGES, PATH_NODE_IDS.tunnel);
	for (const edge of tunnelEdges) {
		assert.ok(PATH_NODE_IDS.tunnel.has(edge.source), edge.id);
		assert.ok(PATH_NODE_IDS.tunnel.has(edge.target), edge.id);
	}
	assert.ok(tunnelEdges.some((edge) => edge.id === "cloudflared-openwebui"));
	assert.equal(
		tunnelEdges.some((edge) => edge.id === "pfsense-unbound"),
		false,
	);
});

test("link kinds map to stroke colour, dash pattern and animation", () => {
	const edges = new Map(buildEdges(EDGES, ALL).map((edge) => [edge.id, edge]));
	const tunnel = edges.get("cloudflared-openwebui");
	assert.equal(tunnel?.animated, true);
	assert.deepEqual(tunnel?.style, {
		stroke: LINK_STYLES.tunnel.color,
		strokeWidth: 2.3,
		strokeDasharray: "8 6",
	});
	assert.deepEqual(tunnel?.markerEnd, {
		type: "arrowclosed",
		color: "#fb923c",
	});
	const lan = edges.get("switch-truenas");
	assert.equal(lan?.animated, undefined);
	assert.equal(lan?.style?.stroke, "#4ade80");
	assert.equal(lan?.style?.strokeDasharray, undefined);
	assert.equal(lan?.label, "Ethernet");
	assert.equal(edges.get("pfsense-unbound")?.style?.strokeDasharray, "4 6");
});

test("focused paths reuse fixed ids while all follows the fetched graph", () => {
	assert.equal(ALL.size, NODES.length);
	assert.equal(visibleNodeIds(NODES, "dns"), PATH_NODE_IDS.dns);
	assert.equal(visibleNodeIds([], "all").size, 0);
});

test("gated API payload is validated before rendering", () => {
	assert.deepEqual(parseNetworkGraph({ nodes: NODES, edges: EDGES }), {
		nodes: NODES,
		edges: EDGES,
	});
	assert.equal(parseNetworkGraph(null), null);
	assert.equal(parseNetworkGraph({ error: "private" }), null);
	assert.equal(parseNetworkGraph({ nodes: [{ id: 1 }], edges: [] }), null);
	assert.equal(
		parseNetworkGraph({
			nodes: NODES,
			edges: [{ ...EDGES[0], kind: "unknown" }],
		}),
		null,
	);
});
