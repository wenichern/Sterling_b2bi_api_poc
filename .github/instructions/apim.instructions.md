---
applyTo: "apim/**"
---
- Policies must inject `x-correlation-id` if absent and forward it and `traceparent` to backends.
- Validate JWT (Entra ID) on every operation; validate content against the OpenAPI schema.
- Rate-limit per subscription; set backend timeouts explicitly.
- Never embed secrets; use named values backed by Key Vault.
