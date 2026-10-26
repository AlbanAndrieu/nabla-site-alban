/** Private, browser-local snapshot of resource evidence from nabla-compose.
 * It is not health evidence and is never fetched from a public API.
 */
const REF = /^(component|resource):default\/[a-z0-9][a-z0-9-]*$/;
const MAX_SERVICES = 350;
const MAX_BYTES = 750_000;

export const RESOURCE_SNAPSHOT_KEY = "nabla:owner:service-resources:v1";

export type ResourceMeasurement = {
  status: "observed" | "unverified";
  working_set_bytes: number | null;
};
export type ResourceGpuMeasurement = {
  status: "observed_process_memory" | "unverified";
  process_memory_bytes: number | null;
};
export type ResourceStorageMeasurement = {
  writable_layer_status: "observed" | "unverified";
  writable_layer_bytes: number | null;
  datasets_status: "observed" | "unverified";
  datasets: { name: string; used_bytes_including_children: number; shared_by_services: boolean }[];
};
export type ServiceResourceMeasurement = {
  entityRef: string;
  memory: ResourceMeasurement;
  gpu: ResourceGpuMeasurement;
  storage: ResourceStorageMeasurement;
};
export type ResourceSnapshot = {
  schema: "nabla-service-resources/v1";
  observed_at_utc: string;
  catalog_revision: string;
  source_host: "truenas" | "workstation";
  services: ServiceResourceMeasurement[];
};

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function bytes(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value : null;
}
function observedBytes(value: unknown, status: unknown): number | null | undefined {
  if (status === "unverified") return null;
  if (status !== "observed" && status !== "observed_process_memory") return undefined;
  const amount = bytes(value);
  return amount === null ? undefined : amount;
}
export function parseResourceSnapshot(input: unknown): ResourceSnapshot | null {
  const root = object(input);
  if (root?.schema !== "nabla-service-resources/v1" ||
      !Array.isArray(root.services) || root.services.length > MAX_SERVICES ||
      (root.source_host !== "truenas" && root.source_host !== "workstation") ||
      typeof root.catalog_revision !== "string" ||
      root.catalog_revision.length > 150 ||
      typeof root.observed_at_utc !== "string") return null;
  const timestamp = Date.parse(root.observed_at_utc);
  if (!Number.isFinite(timestamp) || timestamp > Date.now() + 300_000) return null;
  const sanitized: ServiceResourceMeasurement[] = [];
  const seen = new Set<string>();
  for (const raw of root.services) {
    const item = object(raw);
    const mem = object(item?.memory);
    const gpu = object(item?.gpu);
    const storage = object(item?.storage);
    const ref = item?.entityRef;
    if (typeof ref !== "string" || !REF.test(ref) || seen.has(ref) ||
        !mem || !gpu || !storage) return null;
    const memBytes = observedBytes(mem.working_set_bytes, mem.status);
    const gpuBytes = observedBytes(gpu.process_memory_bytes, gpu.status);
    const layerBytes = observedBytes(storage.writable_layer_bytes, storage.writable_layer_status);
    if (memBytes === undefined || gpuBytes === undefined || layerBytes === undefined ||
        (storage.datasets_status !== "observed" && storage.datasets_status !== "unverified") ||
        !Array.isArray(storage.datasets) || storage.datasets.length > 40) return null;
    const datasets = [];
    for (const dataset of storage.datasets) {
      const d = object(dataset);
      const size = bytes(d?.used_bytes_including_children);
      if (typeof d?.name !== "string" ||
          !/^cpool\/[a-zA-Z0-9_./-]{1,120}$/.test(d.name) ||
          size === null || typeof d.shared_by_services !== "boolean") return null;
      datasets.push({name:d.name, used_bytes_including_children:size, shared_by_services:d.shared_by_services});
    }
    seen.add(ref);
    sanitized.push({
      entityRef: ref,
      memory: {status:mem.status as ResourceMeasurement["status"], working_set_bytes:memBytes},
      gpu: {status:gpu.status as ResourceGpuMeasurement["status"], process_memory_bytes:gpuBytes},
      storage: {
        writable_layer_status: storage.writable_layer_status as ResourceStorageMeasurement["writable_layer_status"],
        writable_layer_bytes: layerBytes,
        datasets_status: storage.datasets_status as ResourceStorageMeasurement["datasets_status"],
        datasets,
      },
    });
  }
  return {
    schema:"nabla-service-resources/v1",
    observed_at_utc:root.observed_at_utc,
    catalog_revision:root.catalog_revision,
    source_host:root.source_host,
    services:sanitized,
  };
}
export function parseResourceSnapshotFile(contents: string): ResourceSnapshot | null {
  if (contents.length > MAX_BYTES) return null;
  try {
    return parseResourceSnapshot(JSON.parse(contents));
  } catch {
    return null;
  }
}
export function snapshotAgeState(
  snapshot: ResourceSnapshot,
  now = Date.now(),
  catalogRevision?: string,
): "fresh" | "stale" | "revision-mismatch" {
  if (catalogRevision && snapshot.catalog_revision !== catalogRevision) return "revision-mismatch";
  if (now - Date.parse(snapshot.observed_at_utc) > 30 * 60_000) return "stale";
  return "fresh";
}
export function displayResourceBytes(value: number | null): string {
  if (value === null) return "—";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let amount = value;
  let index = 0;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index++;
  }
  return (index === 0 ? amount.toFixed(0) : amount.toFixed(1)) + " " + units[index];
}
