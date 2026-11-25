# Project: Sterling B2Bi API modernization POC

## Goal
Bridge Sterling B2Bi (AS2/SFTP/EDI) to modern APIs via Azure APIM, Service Bus,
and Azure Functions, with end-to-end OpenTelemetry tracing.

## Hard rules
- NEVER modify /contracts or /manifests/schema without an issue that explicitly says so.
- NEVER commit secrets. Reference Azure Key Vault only. No connection strings in code.
- Every change needs tests. A PR without tests will be rejected.
- Only touch the folders your agent role owns (see .github/agents/).
- Keep PRs small: one issue, one PR, under ~400 changed lines.
- If requirements conflict with /contracts or these instructions, stop and comment on the issue.

## Conventions
- IaC: Bicep only. Modules in /infra/modules, one resource family per module.
- Naming: {org}-{env}-{region}-{service}-{purpose}. Tag every resource with env, owner, poc=true.
- Canonical order format: /contracts/canonical/order.schema.json (JSON Schema 2020-12).
- Correlation: header `x-correlation-id` (GUID). Generated at APIM or at the first inbound
  document if absent; copied to Service Bus message property `correlationId`; W3C
  `traceparent` is propagated alongside it. Never drop or regenerate it downstream.
- Idempotency: every consumer must be idempotent on (partnerId, docType, controlNumber).
- Telemetry: OpenTelemetry only. Spans/logs carry partner.id, doc.type, po.number, correlation.id.
- Large payloads (>200 KB): claim-check pattern (Blob + reference in message).
- Functions: .NET 8 isolated (see docs/adr/ADR-001-platform-choices.md).

## Definition of done
Lint passes, `bicep build` passes, contract tests pass, docs updated,
and the PR description links the issue and lists how it was tested.
