import assert from "node:assert/strict";
import test from "node:test";
import {
	catalogServiceSlug,
	hasUniqueCatalogServiceNames,
} from "../lib/homelabCatalogV2Names";

const entity = (kind: string, name: string, title?: string) => ({
	kind,
	metadata: { name, title },
});

test("unique names and titles are accepted", () => {
	assert.equal(
		hasUniqueCatalogServiceNames([
			entity("Component", "garage", "Garage Web UI"),
			entity("Resource", "postgresql", "PostgreSQL"),
			entity("API", "garage-admin", "Garage Admin API"),
		]),
		true,
	);
});

test("identical names in different kinds and namespaces cannot coexist", () => {
	assert.equal(
		hasUniqueCatalogServiceNames([
			entity("Component", "api"),
			entity("Resource", "api"),
		]),
		false,
	);
});

test("display titles must be unique, even across whitespace and case changes", () => {
	assert.equal(
		hasUniqueCatalogServiceNames([
			entity("Component", "api", "My Service"),
			entity("Resource", "postgres", " my  service "),
		]),
		false,
	);
});

test("names are compared case-insensitively", () => {
	assert.equal(
		hasUniqueCatalogServiceNames([
			entity("Component", "API"),
			entity("API", "api"),
		]),
		false,
	);
});

test("distinct source names cannot share the same generated card ID", () => {
	assert.equal(
		hasUniqueCatalogServiceNames([
			entity("Component", "s3.api"),
			entity("API", "s3_api"),
		]),
		false,
	);
	assert.equal(catalogServiceSlug("s3_api"), "s3-api");
});

test("blank names, titles and invalid title types fail closed", () => {
	assert.equal(hasUniqueCatalogServiceNames([entity("Component", "___")]), false);
	assert.equal(hasUniqueCatalogServiceNames([entity("Component", "valid", " ")]), false);
	assert.equal(
		hasUniqueCatalogServiceNames([
			entity("Component", "valid", 99 as unknown as string),
		]),
		false,
	);
});

test("organizational entities do not create false visible-service collisions", () => {
	assert.equal(
		hasUniqueCatalogServiceNames([
			entity("Component", "platform"),
			entity("System", "platform"),
		]),
		true,
	);
});
