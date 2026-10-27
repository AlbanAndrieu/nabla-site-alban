"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  RESOURCE_SNAPSHOT_KEY,
  parseResourceSnapshotFile,
  snapshotAgeState,
  type ResourceSnapshot,
} from "@/lib/homelabResourceEvidence";

type Props = {
  french: boolean;
  ownerAllowed: boolean;
  catalogRevision: string | undefined;
  onSnapshot: (snapshot: ResourceSnapshot | null) => void;
};

/** Owner-only local import; never uploads a resource inventory to Vercel. */
export default function HomelabResourceSnapshotImport({
  french, ownerAllowed, catalogRevision, onSnapshot,
}: Props) {
  const [snapshot, setSnapshot] = useState<ResourceSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // Mutable values are accessed only in effects and event handlers, never in JSX.
  const ownerSession = useRef(false);
  const importSequence = useRef(0);
  useEffect(() => {
    ownerSession.current = ownerAllowed;
    // Invalidate all pending file reads when OWNER access changes.
    importSequence.current += 1;
    let cancelled = false;
    let restored: ResourceSnapshot | null = null;
    if (!ownerAllowed) {
      // Revoke persisted OWNER evidence immediately, without delaying storage removal.
      try { window.localStorage.removeItem(RESOURCE_SNAPSHOT_KEY); } catch { /* blocked */ }
    } else {
      try {
        const stored = window.localStorage.getItem(RESOURCE_SNAPSHOT_KEY);
        restored = stored ? parseResourceSnapshotFile(stored) : null;
        if (stored && !restored) window.localStorage.removeItem(RESOURCE_SNAPSHOT_KEY);
      } catch {
        restored = null;
      }
    }
    // State updates run after effect setup; StrictMode cleanup cancels stale work.
    queueMicrotask(() => {
      if (cancelled) return;
      setSnapshot(restored);
      onSnapshot(restored);
    });
    return () => {
      cancelled = true;
      ownerSession.current = false;
      importSequence.current += 1;
    };
  }, [ownerAllowed, onSnapshot]);

  useEffect(() => {
    if (!ownerAllowed) return;
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, [ownerAllowed]);

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !ownerAllowed || !ownerSession.current) return;
    const sequence = ++importSequence.current;
    if (file.size > 750_000) { setError(true); return; }
    try {
      const contents = await file.text();
      // A revoked OWNER session, unmount, or later import cancels this result.
      if (!ownerSession.current || sequence !== importSequence.current) return;
      const candidate = parseResourceSnapshotFile(contents);
      if (!candidate) { setError(true); return; }
      window.localStorage.setItem(RESOURCE_SNAPSHOT_KEY, JSON.stringify(candidate));
      setNow(Date.now());
      setError(false);
      setSnapshot(candidate);
      onSnapshot(candidate);
    } catch {
      if (ownerSession.current && sequence === importSequence.current) setError(true);
    }
  }

  function clear() {
    importSequence.current += 1;
    try { window.localStorage.removeItem(RESOURCE_SNAPSHOT_KEY); } catch { /* blocked */ }
    setSnapshot(null);
    onSnapshot(null);
    setError(false);
  }

  if (!ownerAllowed) return null;
  const freshness = snapshot ? snapshotAgeState(snapshot, now, catalogRevision) : null;
  return (
    <section className="border rounded p-3 mb-3" data-owner-resource-snapshot>
      <h3 className="h6">
        {french ? "Ressources par service · RAM / GPU / stockage" : "Per-service resources · RAM / GPU / storage"}
      </h3>
      <p className="small text-muted mb-2">
        {french
          ? "Importer le JSON produit sur TrueNAS ou la workstation. Stockage local au navigateur ; aucun envoi au serveur. Les mesures ne prouvent pas la santé des services."
          : "Import JSON collected on TrueNAS or the workstation. Browser-local only; no server upload. Resources are not health evidence."}
      </p>
      <label htmlFor="owner-resource-snapshot-file" className="form-label small fw-semibold">
        {french ? "Fichier de mesures JSON" : "Resource evidence JSON file"}
      </label>
      <input
        id="owner-resource-snapshot-file"
        className="form-control form-control-sm"
        type="file"
        accept=".json,application/json"
        onChange={importFile}
        aria-describedby="owner-resource-evidence-status"
      />
      <div id="owner-resource-evidence-status" className="small mt-2" role="status">
        {error ? (french ? "Fichier invalide ou trop volumineux (750 Ko maximum)." : "Invalid or oversized file (750 KB limit).") : null}
        {snapshot ? (
          <span data-resource-snapshot-freshness={freshness}>
            {french ? "Mesure" : "Observed"}: <time dateTime={snapshot.observed_at_utc}>{snapshot.observed_at_utc}</time>
            {" · "}{snapshot.source_host}
            {" · "}{snapshot.services.length} {french ? "entités" : "entities"}
            {" · "}{freshness === "fresh"
              ? (french ? "récent" : "fresh")
              : freshness === "stale"
                ? (french ? "historique (>30 min)" : "historical (>30 min)")
                : (french ? "révision différente du catalogue" : "catalog revision mismatch")}
          </span>
        ) : (!error ? (french ? "Aucune mesure disponible." : "No resource measurement available.") : null)}
      </div>
      {snapshot ? (
        <button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={clear}>
          {french ? "Effacer le cache local" : "Clear local snapshot"}
        </button>
      ) : null}
    </section>
  );
}
