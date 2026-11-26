# Onboarding package: ACME

Generated from `manifests/partners/` by `scripts/onboard_partner.py`. Do not edit by hand; edit the manifest and regenerate.

| Item | Value |
|---|---|
| Partner | ACME Retail Inc. (ACME) |
| Protocols | AS2 |
| Documents | inbound 850, outbound 856 |
| Pattern | `async-command` -> [patterns/02-async-command.md](../../../../patterns/02-async-command.md) |
| Inbound queue (shared) | `orders-in` |
| Outbound queues (per partner) | `acme-856-out` |
| Backend | ERP |
| SLA | 15 minutes |

## Files
- `partner.parameters.json`: parameters for `templates/bicep/partner-onboarding.bicep`
- `apim-named-values.json`: APIM named values (secrets are Key Vault references)
- `observability.yaml`: alerts and dashboard tiles
- `sterling-setup-checklist.md`: human steps in Sterling
- `test-plan.md`: tests to run before sign-off

## Deploy (after review)
```bash
az deployment group create -g <RG> \
  --template-file templates/bicep/partner-onboarding.bicep \
  --parameters @partner.parameters.json serviceBusNamespaceName=<NAMESPACE>
```
