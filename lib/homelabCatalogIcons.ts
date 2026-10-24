/** Canonical icon filenames come from nabla-compose, not FastAPI DTOs. */
import { HOMELAB_CATALOG_ICON_FILES } from "./homelabCatalogIcons.generated.ts";
export { HOMELAB_CATALOG_ICON_FILES } from "./homelabCatalogIcons.generated.ts";

const SORTED_PARENTS = Object.keys(HOMELAB_CATALOG_ICON_FILES).sort(
  (left, right) => right.length - left.length,
);

/** Cards and ReactFlow use exactly the same locally bundled icon. */
export function homelabCatalogIconSrc(serviceId: string): string {
  const id = serviceId.trim().toLowerCase().replace(/[._]/g, "-");
  const exact = HOMELAB_CATALOG_ICON_FILES[id];
  if (exact) return `assets/selfh-icons/${exact}`;
  // Parent lookup runs only for unknown subcomponent IDs.
  const parent = SORTED_PARENTS.find((key) => id.startsWith(key + "-"));
  return `assets/selfh-icons/${parent ? HOMELAB_CATALOG_ICON_FILES[parent] : "generic-app.svg"}`;
}

/** Ignore upstream image URLs. They cannot introduce a second icon authority. */
export function homelabServiceIconSrc(
  serviceId: string,
  declaredIconSrc?: string,
): string {
  void declaredIconSrc;
  return homelabCatalogIconSrc(serviceId);
}
