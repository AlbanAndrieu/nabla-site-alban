import assert from "node:assert/strict";
import test from "node:test";

import {
	homelabServiceMatchesEnvironment,
	resolveHomelabServiceEnvironments,
} from "../lib/homelabEnvironments";
import type { HomelabService } from "../lib/homelabServices";
import type { ServiceTopology } from "../lib/serviceTopology";

function topologyWithEnvironments(
	environments: NonNullable<ServiceTopology["nodes"][number]["environments"]>,
): ServiceTopology {
	return {
		version: 1,
		name: "test",
		nodes: [
			{
				id: "sample",
				name: "Sample",
				kind: "api",
				category: "development",
				environments,
			},
		],
		relations: [],
	};
}

test("topology deployment environments override legacy catalog metadata", () => {
	const service: HomelabService = {
		id: "sample",
		name: "Sample",
		environment: "dev",
	};
	const resolved = resolveHomelabServiceEnvironments(
		service,
		topologyWithEnvironments([
			{
				name: "production",
				url: "https://example.com",
				external: true,
				cloudflareTunnel: false,
			},
			{
				name: "staging",
				url: "https://staging.example.com",
				external: false,
				cloudflareTunnel: false,
			},
		]),
	);

	assert.equal(resolved.source, "topology");
	assert.deepEqual([...resolved.names], ["production", "staging"]);
	assert.equal(homelabServiceMatchesEnvironment(resolved, "production"), true);
	assert.equal(homelabServiceMatchesEnvironment(resolved, "staging"), true);
	assert.equal(homelabServiceMatchesEnvironment(resolved, "dev"), false);
	assert.equal(homelabServiceMatchesEnvironment(resolved, "non-dev"), true);
});

test("legacy environment remains a compatibility fallback", () => {
	const resolved = resolveHomelabServiceEnvironments(
		{ id: "sample", name: "Sample", environment: "dev" },
		null,
	);

	assert.equal(resolved.source, "catalog");
	assert.deepEqual([...resolved.names], ["dev"]);
	assert.equal(homelabServiceMatchesEnvironment(resolved, "non-dev"), false);
	assert.equal(homelabServiceMatchesEnvironment(resolved, "dev"), true);
});

test("missing environment metadata defaults to production and is reviewable", () => {
	const resolved = resolveHomelabServiceEnvironments(
		{ id: "sample", name: "Sample" },
		topologyWithEnvironments([]),
	);

	assert.equal(resolved.source, "default");
	assert.deepEqual([...resolved.names], ["production"]);
	assert.equal(homelabServiceMatchesEnvironment(resolved, "production"), true);
	assert.equal(homelabServiceMatchesEnvironment(resolved, "defaulted"), true);
});
