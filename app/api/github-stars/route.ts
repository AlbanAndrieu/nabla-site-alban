import React from "react";
import { fetchGithubStars } from "../../fetchGithubStars";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
	const stars = await fetchGithubStars();
	return Response.json({ stars });
}
