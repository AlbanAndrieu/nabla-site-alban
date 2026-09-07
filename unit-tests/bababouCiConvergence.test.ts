import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import githubActionsFormatter from "../scripts/eslint-github-formatter.mjs";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("GitHub lint is primary while GitLab remains available", async () => {
	const packageJson = JSON.parse(await read("package.json")) as {
		scripts?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	assert.equal(
		packageJson.scripts?.lint,
		"eslint --format ./scripts/eslint-github-formatter.mjs .",
	);
	assert.equal(packageJson.devDependencies?.["eslint-formatter-gitlab"], "^7.2.0");
	await access(new URL("../.gitlab-ci.yml", import.meta.url));
	assert.match(await read(".gitlab-ci.yml"), /eslint --format gitlab/);
});

test("GitHub Actions formatter escapes workflow commands", () => {
	const previous = process.env.GITHUB_ACTIONS;
	const previousWorkspace = process.env.GITHUB_WORKSPACE;
	process.env.GITHUB_ACTIONS = "true";
	process.env.GITHUB_WORKSPACE = "/workspace";
	try {
		const output = githubActionsFormatter([
			{
				filePath: "/workspace/app/example.ts",
				messages: [{
					ruleId: "no-console",
					severity: 2,
					message: "bad, value: 100%\nnext",
					line: 4,
					column: 2,
					endLine: 4,
					endColumn: 9,
				}],
			},
		] as never);
		assert.equal(
			output,
			"::error file=app/example.ts,line=4,col=2,endLine=4,endColumn=9,title=ESLint no-console::bad, value: 100%25%0Anext\n",
		);
	} finally {
		if (previous === undefined) delete process.env.GITHUB_ACTIONS;
		else process.env.GITHUB_ACTIONS = previous;
		if (previousWorkspace === undefined) delete process.env.GITHUB_WORKSPACE;
		else process.env.GITHUB_WORKSPACE = previousWorkspace;
	}
});

test("Node workflows cache npm only after selecting the reviewed runtime", async () => {
	const [quality, copilot, playwright] = await Promise.all([
		read(".github/workflows/ci.yml"),
		read(".github/workflows/copilot-setup-steps.yml"),
		read(".github/workflows/playwright.yml"),
	]);
	for (const workflow of [quality, copilot, playwright]) {
		assert.match(workflow, /node-version-file:\s*"\.nvmrc"/);
		assert.match(workflow, /- name: Cache npm downloads/);
		assert.match(workflow, /actions\/cache@v5/);
		assert.match(workflow, /path: ~\/\.npm/);
		assert.match(
			workflow,
			/npm-\$\{\{ runner\.os \}\}-\$\{\{ runner\.arch \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/,
		);
		assert.doesNotMatch(workflow, /cache:\s*"?npm"?/);
		assert.match(workflow, /cd "\$\{RUNNER_TEMP\}"/);
		assert.match(workflow, /npm install --global npm@11\.17\.0 --no-audit --no-fund/);
	}
	assert.match(quality, /\.github\/workflows\/copilot-setup-steps\.yml/);
	assert.match(quality, /\.github\/workflows\/docker-build\.yml/);
});

test("semantic release authenticates before freshness and avoids npm ci", async () => {
	const release = await read(".github/workflows/release.yml");
	const auth = release.indexOf("- name: Configure release Git authentication");
	const freshness = release.indexOf("- name: Verify validated revision is still current master");
	const node = release.indexOf("- name: Set up Node.js");
	const baseline = release.indexOf("- name: Bootstrap semantic-release baseline");
	assert.ok(auth >= 0 && freshness > auth, "Git auth must precede the freshness fetch");
	assert.ok(node > freshness, "Node setup should happen only after freshness passes");
	assert.ok(baseline > node, "release tooling must be ready before baseline checks");
	assert.match(release, /GH_TOKEN: \$\{\{ steps\.release_app_token\.outputs\.token \}\}/);
	assert.match(release, /gh auth setup-git/);
	assert.match(release, /git fetch --force origin master:refs\/remotes\/origin\/master --tags/);
	assert.doesNotMatch(release, /Install application dependencies/);
	assert.doesNotMatch(release, /npm ci/);
	assert.doesNotMatch(release, /cache:\s*npm/);
	assert.match(release, /cd "\$\{RUNNER_TEMP\}"/);
	assert.match(release, /npm exec --yes --ignore-scripts/);
	assert.doesNotMatch(
		release,
		/steps\.release_app_token\.outputs\.token \|\| secrets\.GITHUB_TOKEN/,
	);
});

test("theme and Docker hardening from Bababou 159-160 are already converged", async () => {
	const [layout, bootstrap, theme, dockerfile, dockerWorkflow, dockerignore] =
		await Promise.all([
			read("app/[locale]/layout.tsx"),
			read("components/ThemeBootstrap.tsx"),
			read("public/theme.css"),
			read("Dockerfile"),
			read(".github/workflows/docker-build.yml"),
			read(".dockerignore"),
		]);
	assert.match(layout, /<ThemeBootstrap \/>/);
	assert.match(bootstrap, /site-theme-preference/);
	assert.match(theme, /--link-color:\s*#0b5ed7/);
	assert.match(theme, /--toggle-segment-muted:\s*#495057/);
	assert.match(dockerfile, /nginxinc\/nginx-unprivileged:1\.30\.4-alpine-slim/);
	assert.match(dockerfile, /USER 101/);
	assert.match(dockerWorkflow, /aquasecurity\/trivy-action@v0\.36\.0/);
	assert.match(dockerWorkflow, /GHCR_IMAGE: ghcr\.io\/albanandrieu\/nabla-site-alban/);
	assert.equal(dockerignore, "**\n!public/\n!public/**\n");
});
