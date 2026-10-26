"use client";

import {
  displayResourceBytes,
  type ServiceResourceMeasurement,
} from "@/lib/homelabResourceEvidence";

type Props = { resource: ServiceResourceMeasurement; french: boolean; stale: boolean };

export default function HomelabServiceResources({ resource, french, stale }: Props) {
  const memory = displayResourceBytes(resource.memory.working_set_bytes);
  const gpu = displayResourceBytes(resource.gpu.process_memory_bytes);
  const writable = displayResourceBytes(resource.storage.writable_layer_bytes);
  const datasets = resource.storage.datasets;
  return (
    <details className="border rounded p-2 mt-2 text-start small" data-service-resource-evidence>
      <summary>
        <strong>{french ? "Ressources observées" : "Observed resources"}</strong>
        {" · RAM "}{memory}
        {" · GPU "}{gpu}
        {" · "}{french ? "écriture" : "writable"}{" "}{writable}
        {stale ? (french ? " · ancien relevé" : " · stale snapshot") : ""}
      </summary>
      <dl className="row mb-0 mt-2">
        <dt className="col-6">RAM</dt><dd className="col-6">{memory}</dd>
        <dt className="col-6">GPU</dt><dd className="col-6">
          {gpu}{resource.gpu.status !== "observed_process_memory"
            ? (french ? " · non vérifié" : " · unverified") : ""}
        </dd>
        <dt className="col-6">{french ? "Couche Docker" : "Docker writable layer"}</dt>
        <dd className="col-6">{writable}</dd>
      </dl>
      {datasets.length > 0 && (
        <>
          <p className="mb-1 fw-semibold">{french ? "Datasets ZFS montés" : "Mounted ZFS datasets"}</p>
          <ul className="mb-2">
            {datasets.map((d) => (
              <li key={d.name}>
                <code>{d.name}</code>
                {" · "}{displayResourceBytes(d.used_bytes_including_children)}
                {d.shared_by_services && (
                  <span> {french ? "(partagé, ne pas additionner)" : "(shared, do not sum)"}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="text-muted mb-0">
        {french
          ? "Échantillon ponctuel, pas un pic. Le stockage ZFS inclut des enfants ; les volumes partagés ne sont pas attribuables entièrement à ce service. Aucune valeur absente n'est comptée à zéro."
          : "One-time sample, not a peak. ZFS usage includes descendants; shared storage cannot be fully attributed to this service. Missing values are not zero."}
      </p>
    </details>
  );
}
