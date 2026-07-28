import { fetchGithubStars } from "../../fetchGithubStars";

export const revalidate = 3600;

export async function GET() {
	try {
		const stars = await fetchGithubStars();
		return Response.json({ stars });
	} catch {
		return Response.json(
			{ error: "GitHub stars are temporarily unavailable." },
			{ status: 502 },
		);
	}
}
