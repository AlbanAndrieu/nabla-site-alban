import { SiteCatalogV2Error } from "./homelabSiteCatalog";
import { parseSiteHealthV2, type SiteHealthV2 } from "./siteHealthV2";

/** Bound to the same SERVICE machine identity as Backstage v2 catalog. */
const URL = "https://fastapi-sample.fastapicloud.dev/api/site/health/v2";
const TIMEOUT_MS = 5000;

export async function loadSiteHealthV2(): Promise<SiteHealthV2> {
	const key = process.env.DIAGNOSTICS_ACCESS_KEY?.trim();
	if (!key) throw new SiteCatalogV2Error("key-missing");
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const response = await fetch(URL, {
			headers: { Accept: "application/json", "X-Diagnostics-Key": key },
			method: "GET",
			cache: "no-store",
			redirect: "error",
			signal: controller.signal,
		});
		if (response.status === 401 || response.status === 403) {
			throw new SiteCatalogV2Error("access-denied");
		}
		if (!response.ok) throw new SiteCatalogV2Error("unavailable");
		const data = parseSiteHealthV2(await response.json());
		if (!data) throw new SiteCatalogV2Error("unavailable");
		return data;
	} catch (error) {
		if (error instanceof SiteCatalogV2Error) throw error;
		throw new SiteCatalogV2Error("unavailable");
	} finally {
		clearTimeout(timeout);
	}
}
