import { trace } from "@opentelemetry/api";

export async function fetchGithubStars() {
	return await trace
		.getTracer("nextjs-example")
		.startActiveSpan("fetchGithubStars", async (span) => {
			try {
				// fetch actual GitHub stars for the repo
				const res = await fetch(
					"https://api.github.com/repos/AlbanAndrieu/nabla-site-alban",
				);
				const data = await res.json();
				return data.stargazers_count;
			} finally {
				span.end();
			}
		});
}
