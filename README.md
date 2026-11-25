# Sterling B2Bi API Modernization POC

Bridge IBM Sterling B2Bi (AS2/SFTP/EDI) to modern APIs using Azure API Management,
Service Bus, and Azure Functions, with end-to-end OpenTelemetry tracing. Built with
the GitHub Copilot coding agent working from issues, with humans reviewing every PR.

## POC slice (definition of done)
1. Inbound EDI 850 via AS2 -> canonical JSON -> ERP API (async via Service Bus)
2. Sync `GET /orders/{id}/status` through APIM -> WMS status API
3. Outbound 856/ASN
4. One trace (one `x-correlation-id`) visible end to end
5. A second fake partner onboarded purely from a manifest in minutes

## Layout
| Path | Purpose |
|---|---|
| `contracts/` | OpenAPI, canonical JSON schemas, event schemas (human-approved changes only) |
| `manifests/` | Partner onboarding YAML + schema |
| `infra/` | Bicep modules |
| `apim/` | APIM API definitions and policies |
| `integrations/` | Functions/bridges, Sterling BP and map exports |
| `observability/` | OTel Collector config, dashboards, alerts |
| `tests/` | Mocks, contract and end-to-end tests |
| `docs/` | ADRs, runbooks, issue backlog |
| `.github/` | Copilot instructions, custom agents, workflows |

## Getting started
1. Create a GitHub repo and push this folder.
2. Edit `.github/CODEOWNERS` with your handles; enable branch protection on `main`
   (require PR review, passing CI, and CODEOWNERS review).
3. Repo Settings -> Copilot -> Coding agent: enable it and allowlist registries in the
   firewall (registry.npmjs.org, api.nuget.org, pypi.org, files.pythonhosted.org).
4. Review and adjust the contracts in `contracts/`. They drive every agent.
5. Create the issues: `gh auth login`, then `./scripts/create-issues.sh` (see `docs/issues/`).
6. Assign issues 1 and 2 to Copilot first as a pilot. Read the PRs closely and tighten
   `.github/copilot-instructions.md` from what the agent got wrong.

## Local validation
```bash
pip install jsonschema pyyaml
python scripts/validate_contracts.py
```

## Notes
- The coding agent cannot reach Azure or the Sterling sandbox. It builds against mocks;
  deployment happens only through a human-approved pipeline (OIDC to Azure).
- Sterling config-as-code is the hardest part. Expect human-led work on issue 10.
