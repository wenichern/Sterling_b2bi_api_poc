# Sterling BP template: Outbound 856 (Pattern 5)

| Placeholder | Example | Source |
|---|---|---|
| `__PARTNER_ID__` | ACME | manifest `partner.id` |
| `__MAP_NAME__` | CanonicalASN_to_ACME_856 | manifest `documents[].map` |
| `__OUT_QUEUE__` | acme-856-out | `{partnerId}-{docType}-out` (lowercase) |

## Steps
1. **Consume** from `__OUT_QUEUE__` (Sterling pulls; no inbound call from Azure).
2. **Restore correlation:** read `correlationId` and `traceparent` from message properties into process data.
3. **Validate** the payload against `contracts/canonical/asn.schema.json`. Invalid -> dead-letter and `failed` event.
4. **Translate** canonical ASN -> EDI 856 using `__MAP_NAME__`. Emit `translated`.
5. **Send** via the partner's AS2 profile.
6. **Await MDN.** On success emit `sent`; on timeout retry, then alert.
7. **Complete** the queue message only after the MDN (or after an explicit failure is recorded).

## Done when
- [ ] Test ASN -> valid 856 -> MDN -> `sent` event with the original order's `correlationId`
- [ ] Missing MDN raises an alert within the configured window
