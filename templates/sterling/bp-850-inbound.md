# Sterling BP template: Inbound 850 (Patterns 2 and 4)

Design template. A Sterling admin builds this in the sandbox from this spec, exports the resources,
and commits the export under `integrations/sterling/`. Replace the `__PLACEHOLDERS__`.

| Placeholder | Example | Source |
|---|---|---|
| `__PARTNER_ID__` | ACME | manifest `partner.id` |
| `__MAP_NAME__` | ACME_850_to_CanonicalOrder | manifest `documents[].map` |
| `__QUEUE__` | orders-in | manifest `routing.queue` |
| `__SLA_MINUTES__` | 15 | manifest `observability.slaMinutes` |

## Steps
1. **Receive / consume** the document (AS2 receipt for AS2 partners; SFTP collection for file partners).
2. **Correlation:** read `x-correlation-id` if present, otherwise generate a GUID. Store it in process data as `CorrelationId`.
3. **Business event `received`** (see `templates/telemetry/business-event.schema.json`).
4. **Translate** 850 -> canonical JSON using `__MAP_NAME__`. Output must validate against `contracts/canonical/order.schema.json`.
5. **Business event `translated`.**
6. **Publish** `order.received.v1` to `__QUEUE__` with message properties: `correlationId`, `traceparent`,
   `partnerId`, `docType`, `controlNumber`. Use the JMS/AMQP adapter or the HTTP bridge Function.
7. **Business event `sent`** after the broker acknowledges.
8. **Functional acknowledgment:** generate/send the 997 (or 999) per the partner profile.

## Error handling
- Translation failure: emit `failed` with `errorCode`, send negative 997, route the original to the exception queue. Do not publish.
- Publish failure: retry with backoff, then mark the process failed and alert.
- Never log payload bodies or PII; log business keys only.

## Done when
- [ ] Exported BP, map, and partner profile are committed
- [ ] A test 850 produces one `order.received.v1` message and one trace
- [ ] A malformed 850 produces a negative 997 and a `failed` event
