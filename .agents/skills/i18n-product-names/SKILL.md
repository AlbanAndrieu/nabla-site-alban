---
name: i18n-product-names
description: Preserve canonical product, project, protocol, command, API, company, repository and model names when localizing site content.
---

# Preserve product and project names during translation

Use this skill whenever editing translated content, locale files, localized HTML, React copy, metadata, documentation, or automated translation scripts.

## Core rule

Translate prose. **Do not translate identifiers or proper product/project names.**

Keep the official spelling, casing, punctuation and word order used by the upstream project/vendor unless the upstream project itself publishes an official localized product name.

Examples:

- `AnythingLLM` stays `AnythingLLM`, never `N'importe quoiLLM`.
- `Paperless-ngx` stays `Paperless-ngx`, never `Sans papier-ngx`.
- `Paperless-AI` stays `Paperless-AI`, never `IA sans papier`.
- `Open WebUI` stays `Open WebUI`, never `Ouvrir l'interface Web`.
- `Open Terminal` stays `Open Terminal`, never `Terminal ouvert`.
- `OpenCommit` stays `OpenCommit`, never `OuvrirCommit`.
- `OpenRAG` stays `OpenRAG`, never `OuvrirRAG`.
- `Context7`, `GitHub Copilot`, `Cursor`, `Amazon Q Developer`, `Dust`, `Azure Machine Learning`, `Hugging Face`, `LangChain`, `pgvector`, `Elasticsearch`, `CrewAI`, `Traefik`, `Dockge`, `Watchtower`, `LiteLLM`, `Langfuse`, `Temporal`, `TrueNAS`, `Docker`, `Kubernetes`, `Sentry`, `Supabase`, `Grafana`, `Prometheus`, `Cloudflare`, etc. must retain their canonical names.

The surrounding sentence or action **should** be localized. For example:

- `Open Grafana` → `Ouvrir Grafana` is correct because only the action is translated.
- `Open WebUI` → `Ouvrir l'interface Web` is incorrect because the product name itself was translated.

## Also preserve

Do not translate:

- CLI commands, flags and environment variables;
- package names and import paths;
- repository names and GitHub owner/repository identifiers;
- protocols and standards (`MCP`, `HTTP`, `OAuth`, `OIDC`, `OpenTelemetry`);
- model names (`Qwen 3`, `Llama 3`, `Gemma 3`, etc.);
- API/product acronyms and branded service tiers;
- file names, paths, Docker image names and hostnames.

## Verification workflow

Before accepting a translated technical name:

1. Compare it with the English source and the linked upstream URL/repository.
2. If it identifies a product/project/vendor/model rather than a generic concept, preserve the source name verbatim.
3. Translate only descriptive nouns around it (`workflow`, `dashboard`, `documentation`, `gateway`, etc.).
4. Search the repository for machine-translated variants before finishing the change.
5. Run the i18n/product-name regression tests.

## Scope note

The automated repository guard currently audits localized site pages outside the legacy CV corpus. CV translation cleanup is tracked separately and must not be silently rewritten as part of unrelated site localization work.
