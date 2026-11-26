# Onboarding package: GLOBEX

Generated from `manifests/partners/` by `scripts/onboard_partner.py`. Do not edit by hand; edit the manifest and regenerate.

| Item | Value |
|---|---|
| Partner | Globex Distribution (GLOBEX) |
| Protocols | SFTP |
| Documents | inbound 850 |
| Pattern | `file-to-api` -> [patterns/04-file-to-api.md](../../../../patterns/04-file-to-api.md) |
| Inbound queue (shared) | `orders-in` |
| Outbound queues (per partner) | none |
| Backend | ERP |
| SLA | 30 minutes |

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
