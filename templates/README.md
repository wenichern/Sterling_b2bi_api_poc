# Reusable Templates

| Template | Used by pattern | Notes |
|---|---|---|
| `bicep/partner-onboarding.bicep` | 5 (and any per-partner outbound queue) | Not compiled in CI yet; run `az bicep build` before first use |
| `apim/get-operation-policy.xml` | 1 | Replace `__PLACEHOLDERS__`; named values like `{{wms-base-url}}` are APIM named values |
| `sterling/bp-850-inbound.md` | 2, 4 | Sterling design template (human-built in the sandbox) |
| `sterling/bp-856-outbound.md` | 5 | Sterling design template |
| `sterling/partner-profile-checklist.md` | all | AS2/SFTP partner setup |
| `telemetry/business-event.schema.json` | all | Business-event contract Sterling emits |
| `telemetry/business-event.example.json` | all | Sample payload |

Rules: templates contain no secrets, use placeholders in `__DOUBLE_UNDERSCORES__`, and change only
through a reviewed PR. The generator (`scripts/onboard_partner.py`) fills them per partner.
