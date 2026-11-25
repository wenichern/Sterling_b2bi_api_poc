---
applyTo: "integrations/**"
---
- Consumers are idempotent on (partnerId, docType, controlNumber).
- Retry with exponential backoff; dead-letter after the configured max deliveries.
- Preserve `correlationId` and `traceparent` from message properties into outgoing calls.
- Claim-check pattern for payloads over 200 KB.
- Validate inbound/outbound payloads against /contracts schemas.
