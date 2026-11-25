---
applyTo: "infra/**"
---
- Parameterize env, region, and SKU. No hard-coded names.
- Use managed identity and RBAC; no shared keys.
- Service Bus: every queue gets a dead-letter policy and an explicit maxDeliveryCount.
- Output only non-secret values. Add a `what-if` note to the PR description.
- Add a parameters example under /infra/examples.
