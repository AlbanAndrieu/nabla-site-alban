import {
	argument,
	Container,
	Directory,
	dag,
	func,
	object,
} from "@dagger.io/dagger";

const NODE_DEVELOPMENT = "24.22.1";
const NODE_VERCEL = "24.22.1";
const SOURCE_IGNORE = [
	".git",
	".git/**",
	".next",
	".next/**",
	".vercel",
	".vercel/**",
	"node_modules",
	"node_modules/**",
	"playwright-report",
	"playwright-report/**",
	"test-results",
	"test-results/**",
	"reports",
	"reports/**",
	".env",
	".env.*",
];

@object()
export class NablaSiteAlbanCi {
	private environment(source: Directory, nodeVersion: string): Container {
		return (
			dag
				.container()
				.from(`node:${nodeVersion}-bookworm-slim`)
				.withExec([
					"sh",
					"-c",
					"apt-get update && apt-get install --yes --no-install-recommends bash ca-certificates curl git jq python3 && rm -rf /var/lib/apt/lists/*",
				])
				.withMountedCache(
					"/root/.npm",
					dag.cacheVolume(`nabla-site-alban-npm-${nodeVersion}`),
				)
				.withDirectory("/src", source)
				.withWorkdir("/src")
				.withEnvVariable("CI", "true")
				.withExec([
					"sh",
					"-c",
					[
						"git init --quiet --initial-branch=dagger-source",
						"git config user.email dagger@example.invalid",
						"git config user.name 'Dagger Source Snapshot'",
						"git add --all",
						"GIT_AUTHOR_DATE='2000-01-01T00:00:00Z' GIT_COMMITTER_DATE='2000-01-01T00:00:00Z' git commit --quiet --no-gpg-sign -m 'Dagger source snapshot'",
					].join(" && "),
				])
				// mise.toml is the single source of truth for the npm version.
				.withExec([
					"bash",
					"-c",
					`npm install --global "npm@$(sed -n 's/^npm = "\\([^"]*\\)"/\\1/p' mise.toml | head -n1)" --no-audit --no-fund`,
				])
				.withExec(["bash", "scripts/verify-mise-npm.sh"])
				.withExec(["npm", "ci", "--no-audit", "--no-fund"])
		);
	}

	private buildEnvironment(source: Directory, nodeVersion: string): Container {
		return this.environment(source, nodeVersion).withMountedCache(
			"/src/.next/cache",
			dag.cacheVolume(`nabla-site-alban-next-${nodeVersion}`),
		);
	}

	private async runNodeLts(source: Directory): Promise<void> {
		const environment = this.environment(source, NODE_DEVELOPMENT);
		const typedEnvironment = environment.withExec(["npx", "next", "typegen"]);
		await Promise.all([
			environment.withExec(["npm", "run", "lint"]).stdout(),
			environment.withExec(["npm", "run", "lint:css"]).stdout(),
			typedEnvironment.withExec(["npm", "run", "typecheck"]).stdout(),
			environment.withExec(["npm", "run", "test:unit"]).stdout(),
			this.buildEnvironment(source, NODE_DEVELOPMENT)
				.withExec(["npx", "next", "build"])
				.stdout(),
		]);
	}

	private async runNode24(source: Directory): Promise<void> {
		await this.buildEnvironment(source, NODE_VERCEL)
			.withExec(["npx", "next", "build"])
			.stdout();
	}

	@func()
	async checkNodeLts(
		@argument({ defaultPath: "/", ignore: SOURCE_IGNORE })
		source: Directory,
	): Promise<string> {
		await this.runNodeLts(source);
		return `Node ${NODE_DEVELOPMENT}: lint, stylelint, typecheck, unit and build passed`;
	}

	@func()
	async checkNode24(
		@argument({ defaultPath: "/", ignore: SOURCE_IGNORE })
		source: Directory,
	): Promise<string> {
		await this.runNode24(source);
		return `Node ${NODE_VERCEL}: production build passed`;
	}

	@func()
	async check(
		@argument({ defaultPath: "/", ignore: SOURCE_IGNORE })
		source: Directory,
	): Promise<string> {
		await this.runNodeLts(source);
		return [
			"Dagger PoC passed",
			`Node ${NODE_DEVELOPMENT}: lint + stylelint + typecheck + unit + build`,
		].join("\n");
	}
}
