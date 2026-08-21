---
name: stripe-projects
description: >-
  Provision or inspect third-party services through Stripe Projects. Use only
  when the user explicitly asks for Stripe Projects/projects.dev, or asks to
  provision a service through Stripe. Do not trigger for generic requests for
  databases, hosting, auth, caching, monitoring, API keys, or cloud services.
allowed-tools:
  - Bash(stripe *)
  - Bash(which stripe)
---

# Stripe Projects

Use Stripe Projects only when Stripe Projects is the requested provisioning mechanism. Generic infrastructure work should use the project's normal provider/tooling instead of routing through Stripe implicitly.

## Workflow

1. Check the CLI: `which stripe && stripe --version`.
2. Inspect available commands with CLI help rather than relying on a large static command reference.
3. Search/inspect the Projects catalog before naming a provider or service.
4. Run preflight/status before initialization or provisioning.
5. Treat CLI output as authoritative; never fabricate providers, plans, commands, credentials, or environment values.
6. Before any action with cost, terms acceptance, account linking, or external side effects, show what will happen and obtain the user's explicit approval.
7. Report environment variable names only, never secret values.

If Stripe Projects installs a tool-specific skill such as `.claude/skills/stripe-projects-cli`, do not copy it into repository-wide agent configuration. Prefer its CLI-backed instructions for that provisioning session and keep `.agents/skills/` as this repository's canonical shared skill source.