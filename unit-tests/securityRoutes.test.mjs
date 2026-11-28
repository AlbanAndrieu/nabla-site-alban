import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
	HTML_ROUTE_SLUGS,
	SECURITY_ROUTE_REDIRECTS,
	SEO_HTML_MIGRATION_SLUGS,
} from "../lib/htmlRoutes.config.mjs";

test("old CISO and CTID URLs redirect permanently to the canonical security section", () => {
	assert.equal(SECURITY_ROUTE_REDIRECTS.length, 12);
	assert.equal(
		new Set(SECURITY_ROUTE_REDIRECTS.map(({ source }) => source)).size,
		12,
	);
	for (const slug of ["ciso", "ctid"]) {
		assert.ok(!HTML_ROUTE_SLUGS.includes(slug));
		assert.ok(!SEO_HTML_MIGRATION_SLUGS.includes(slug));
		for (const prefix of ["", "/fr", "/en"]) {
			for (const suffix of ["", ".html"]) {
				assert.deepEqual(
					SECURITY_ROUTE_REDIRECTS.find(
						({ source }) => source === `${prefix}/${slug}${suffix}`,
					),
					{
						source: `${prefix}/${slug}${suffix}`,
						destination: `${prefix === "/fr" ? "/fr" : ""}/security/${slug}`,
						permanent: true,
					},
				);
			}
		}
		assert.ok(existsSync(`app/[locale]/security/${slug}/page.tsx`));
		assert.ok(!existsSync(`app/[locale]/${slug}/page.tsx`));
	}
});

test("security navigation and config consume the migrated routes", () => {
	const config = readFileSync("next.config.mjs", "utf8");
	const nav = readFileSync("components/security/SecurityNav.tsx", "utf8");
	const ctid = readFileSync("app/[locale]/security/ctid/page.tsx", "utf8");
	assert.match(config, /\.\.\.SECURITY_ROUTE_REDIRECTS/);
	assert.match(nav, /"\/security\/ciso"/);
	assert.match(nav, /"\/security\/ctid"/);
	assert.match(ctid, /robots: NON_INDEXABLE_ROBOTS/);
});
