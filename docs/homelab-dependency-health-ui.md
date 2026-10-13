# Homelab dependency-aware health contract

Status: **implemented in the Site Alban consumer**. FastAPI remains authoritative
for propagated dependency evidence; the browser renders that evidence and must
not invent dependency failures.

## Health model

The site accepts the dependency-aware fields carried by the FastAPI health
snapshot:

- `local_state`: direct service evidence;
- `dependency_state`: aggregate required-dependency state;
- `effective_state`: state presented after propagation;
- `required_dependencies`: stable service IDs;
- `blocked_by`: required dependencies in failure;
- `degraded_by`: required dependencies in warning/degraded state;
- `unconfirmed_dependencies`: required dependencies without sufficient evidence;
- `dependency_evidence`: relation type, target state/name, timestamps and evidence;
- observation/probe freshness metadata.

`lib/homelabHealthResolver.ts` is the shared consumer resolver. Legacy rows that
only expose `state` remain fail-soft, but a declared required edge without
authoritative observation is **unconfirmed**, never implicitly healthy.

The `runtime_missing` conflict is handled explicitly: when fresh public/internal
origin evidence proves that a service responds despite a fresh runtime inventory
claiming it missing, a server `fail` is presented as `warn` rather than a false
hard failure. Stale evidence cannot override the failure.

## UI semantics

Service cards and architecture views use the same effective-state model:

- `ok`: healthy effective state;
- `warn`: degraded, stale, `runtime_missing` conflict or dependency uncertainty;
- `fail`: direct/authoritative functional failure;
- `unknown`: insufficient authoritative evidence.

The runtime/local indicator remains visible independently from effective health,
so a locally running application can still show dependency degradation.

Required dependency relations use four consumer states:

- `healthy`;
- `blocked`;
- `degraded`;
- `unconfirmed`.

Optional relations never downgrade a service by themselves.

Exposure/publish relations are separate from dependency health. In particular:

- TrueNAS direct public path: `Internet → pfSense:7000 → HAProxy → TrueNAS`;
- pfSense administration: `10443/tcp`, LAN/VPN only;
- TrueNAS SSH: `9922/tcp`, LAN only;
- Cloudflare Tunnel health is not evidence for the direct TrueNAS `:7000` path.

## Shared implementation

Current consumers reuse the shared resolver instead of maintaining
diagram-specific health logic, including service cards and architecture views.

Key sources:

- `lib/homelabHealthTypes.ts`;
- `lib/homelabHealthResolver.ts`;
- `app/components/homelab/HomelabServiceGrid.tsx`;
- `app/[locale]/architecture/ArchitectureTopologyView.tsx`;
- `app/[locale]/architecture/HierarchicalArchitectureExplorer.tsx`.

## Regression contract

`unit-tests/homelabDependencyHealth.test.ts` protects the important semantics:

- dependency-aware snapshot parsing;
- local versus effective state;
- blocked/degraded/unconfirmed relations;
- fail-soft compatibility for legacy rows;
- `runtime_missing` mismatch handling;
- TrueNAS public health isolation from unrelated dependency propagation;
- shared resolver use in service cards and architecture relations.

Browser/visual coverage must preserve readable health semantics on mobile and in
dark/light themes. Any additional implementation work belongs in
`docs/homelab-roadmap.md`, not in a second delivery checklist here.


## Garage S3 versus Garage Admin presentation (2026-10-12)

The `garage-webui` runtime component is retained in the authoritative topology, but the TrueNAS services grid prefers the `garage-admin` card when present. The user-confirmed browser UI currently appears at `https://garage-admin.albandrieu.com/`. The configured origins in `nabla-compose/apps/garage/compose.yml` are S3 API :3900, Admin API :3903, and a separate WebUI :3909. The *actual* public Cloudflare Tunnel origin for either hostname has not yet been verified. The XML S3 `AccessDenied` returned at `garage.albandrieu.com` is a suspected routing drift and must not be presented as evidence of a working UI.

`s3.int.albandrieu.com` is now declared internal-only in the authoritative catalogue and retained as an internal navigation route; the blue **Interne** badge denotes intended exposure, not verified isolation. LAN health must continue to be probed from trusted TrueNAS/workstation observers independent of `external=false`; Internet reachability must be separately assessed from outside-in, including public DNS, WAN ACL/HAProxy and Host/SNI bypass risks. Existing public DNS exceptions for S3 and legacy Vaultwarden have been removed from the *declaration* only; actual DNS/router cleanup requires a reviewed deployment and OpenTofu consumer validation.


## Garage naming and desired remote-access policy (2026-10-13)

Catalogue display names now distinguish the **Garage Web UI** (dedicated service on :3909), **Garage Admin API** (:3903) and **Garage S3 API** (:3900). These names refer to declared origins, not proof of actual Cloudflare routing. The user reports that `garage-admin.albandrieu.com` currently renders a browser UI while `garage.albandrieu.com` emits S3 XML `AccessDenied`; active tunnel route ownership must be audited, and the site should keep separate UI/API cards in the meantime.

The desired long-term state is **private Garage Web UI**, accessible on LAN or via an authenticated private overlay. **For now**, the owner intentionally needs the Web UI available remotely until an easy managed toggle/private remote access (for example Tailscale with least-privilege ACLs and MFA) is deployed. Do not equate this temporary UI exposure with permission to expose Garage S3 or administration APIs anonymously. Public/private exposure policy and operational health remain separate indicators.
