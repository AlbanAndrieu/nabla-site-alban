import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = (path: string) => new URL(`../${path}`, import.meta.url);
const read = (path: string) => readFile(projectUrl(path), "utf8");

test("retired local tooling and unused root dependencies stay absent", async () => {
	const packageJson = JSON.parse(await read("package.json")) as {scripts?: Record<string,string>; dependencies?: Record<string,string>; devDependencies?: Record<string,string>};
	for (const name of ["@datadog/browser-rum","@vercel/analytics","@vercel/speed-insights","@vercel/toolbar"]) assert.equal(packageJson.dependencies?.[name], undefined);
	for (const name of ["d3","next-devtools-mcp","opencommit","vercel"]) assert.equal(packageJson.devDependencies?.[name], undefined);
	for (const script of ["dev:v","oco","opencommit"]) assert.equal(packageJson.scripts?.[script], undefined);
	await assert.rejects(access(projectUrl("build.sh")));
	await assert.rejects(access(projectUrl(".opencommit-commitlint")));
	await assert.rejects(access(projectUrl("scripts/run-opencommit.mjs")));
	await assert.rejects(access(projectUrl("public/package.json")));
	await access(projectUrl("public/d3.v3.min.js"));
});

test("active Alban-specific runtime dependencies remain explicit", async () => {
	const packageJson = JSON.parse(await read("package.json")) as {dependencies?: Record<string,string>; devDependencies?: Record<string,string>};
	const [instrumentation, checkout, mcp, setup] = await Promise.all([read("instrumentation.ts"),read("app/components/checkout.tsx"),read(".mcp.json"),read(".github/workflows/copilot-setup-steps.yml")]);
	for (const name of ["@opentelemetry/api","@opentelemetry/api-logs","@opentelemetry/instrumentation","@opentelemetry/sdk-logs","@vercel/otel","@stripe/react-stripe-js","@stripe/stripe-js","stripe","@xyflow/react"]) assert.ok(packageJson.dependencies?.[name], `${name} must stay installed while consumed`);
	assert.ok(packageJson.devDependencies?.["lodash-es"]);
	assert.equal(packageJson.dependencies?.["lodash-es"], undefined);
	assert.match(instrumentation, /from "@vercel\/otel"/);
	assert.match(checkout, /from "@stripe\/react-stripe-js"/);
	assert.match(checkout, /from "@stripe\/stripe-js"/);
	assert.match(mcp, /next-devtools-mcp@latest/);
	assert.match(setup, /node-version:\s*"24"/);
	assert.doesNotMatch(setup, /node-version:\s*"25"/);
});
