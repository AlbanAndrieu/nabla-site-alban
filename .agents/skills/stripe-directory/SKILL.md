---
name: stripe-directory
description: >-
  Search Stripe Directory for vendors, partners, or MPP-supported services. Use
  only when the user explicitly asks for Stripe Directory, Stripe-listed
  providers/partners, or an MPP-purchasable service. Do not trigger for generic
  vendor, software, product, or local-business discovery.
metadata:
  short-description: Search Stripe Directory vendors and partners
allowed-tools:
  - Bash(stripe directory *)
---

# Stripe Directory

Use `stripe directory` only for explicit Stripe Directory discovery. Keep ordinary vendor/product/service discovery on the agent's normal search tooling so this specialized skill does not hijack unrelated requests.

## Workflow

1. Clarify only missing hard constraints (job-to-be-done, capability, geography when relevant).
2. Run 1–3 focused searches: `stripe directory search "<query>" --format json`.
3. Dedupe and rank using returned evidence and Stripe trust signals.
4. Return a short list (normally 5–10), not the raw catalog; report the exact queries and filters used.
5. Never invent a provider, capability, command, price, or endpoint.

For programmatic purchasing, use only MPP-supported results. Resolve the actual endpoint and price from the returned result/challenge, show the price, and obtain explicit user approval before any payment action. Prefer a no-charge/test path when available. Never expose credentials or payment secrets.

Use the installed Stripe CLI help/output as the source of truth for command details instead of loading additional static instructions into context.