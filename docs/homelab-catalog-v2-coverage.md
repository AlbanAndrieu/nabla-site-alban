# Homelab catalog v2 compatibility coverage

This file records migration coverage between the historical Site Alban
presentation catalog and the canonical Nabla service catalog v2.

It is not an inventory source of truth. Canonical service identity remains
`nabla-compose` Compose + `x-nabla`.

## Current coverage

As of 20 September 2026:

- historical Site Alban cards: **72**;
- mapped directly/through canonical name: **31**;
- reviewed identity aliases: **4**;
- reviewed development deployments: **4**;
- canonicalized total: **39 / 72**;
- explicit legacy-only debt: **33 / 72**.

The compatibility policy is stored in
`config/homelab-catalog-v2-compatibility.json`.

## Identity aliases

Aliases represent the same logical service and therefore collapse to the
canonical v2 service ID.

| Legacy ID | Canonical v2 ID |
| --- | --- |
| `open-webui` | `openwebui` |
| `porttracker` | `portracker` |
| `language-tool` | `languagetool` |
| `hello` | `hello-nginx` |

## Development deployments

These entries are separate runtime/presentation instances of an existing
logical service. They retain their site instance ID but gain
`canonicalEntityId` and `environment: dev`.

| Site instance | Canonical entity |
| --- | --- |
| `prometheus-albandrieu` | `prometheus` |
| `porttracker-albandrieu` | `portracker` |
| `scrutiny-collector-albandrieu` | `scrutiny-collector` |
| `litellm-albandrieu` | `litellm` |

This avoids creating duplicate logical topology nodes merely because a
workstation/development instance exists.

## Legacy-only debt

The remaining 33 IDs are explicitly listed in the compatibility file. Each one
must eventually receive one reviewed outcome:

1. add/recover canonical `x-nabla` metadata;
2. model it as a deployment/environment of an existing canonical entity;
3. map a proven identity alias; or
4. remove the stale presentation entry after runtime intent is reviewed.

The unit contract `unit-tests/serviceCatalogV2.test.ts` compares the computed
unmapped set with that baseline. A new unclassified site-only service therefore
requires an explicit compatibility decision instead of silently increasing
inventory drift.

## Exit condition

The compatibility layer can be removed only when the legacy-only set reaches
zero and the site-owned configuration contains presentation/navigation data
only, not service identity.
