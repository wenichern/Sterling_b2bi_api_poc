# edi-bridge

Pure TypeScript adapters between **X12 JSON** (what Sterling parses/serializes) and the **canonical model**,
plus orchestration for the side effects. See `docs/adr/ADR-002-edi-mapping-split-and-typescript.md`.

```
src/
  canonical/        envelope + event types (no EDI knowledge beyond control numbers)
  generated/        types generated from /contracts schemas (npm run gen:types) - do not edit
  edi/
    adapters/       contracts.ts (2 interfaces), registry.ts, inbound/, outbound/, common.ts
    partners/       PartnerContext + profiles/*.json (code-level quirks only)
    schemas.ts      Ajv validation against /contracts (single source of truth)
    validation.ts   ValidationResult
  orchestration/    ports.ts, inbound-pipeline.ts, outbound-pipeline.ts
test/               63 unit tests with in-memory fakes
```

## Commands
```bash
npm ci
npm run gen:types   # regenerate src/generated from /contracts (commit the result)
npm run check       # typecheck + tests
```

## Implemented
| Direction | Transaction set | Adapter |
|---|---|---|
| Inbound | 850 purchase order | `po-850.adapter.ts` |
| Inbound | 820 remittance | `remittance-820.adapter.ts` |
| Outbound | 856 ship notice | `asn-856.adapter.ts` |
| Outbound | 810 invoice | `invoice-810.adapter.ts` |

## Design rules
- Adapters are pure: no I/O, clock, or random ids. They receive `PartnerContext` and `meta`.
- `validate()` never throws on bad input and never echoes field values (codes and JSON pointers only).
- Pipelines send the functional ack only after a durable publish, and never let telemetry failures break processing.
- Delivery is at-least-once; consumers must also be idempotent.

## Add a document type
1. Add the canonical schema (and event schema if inbound) under `/contracts` (human-approved PR).
2. Add `contracts/edi-json/x12-<n>.schema.json`, fixtures under `contracts/examples/`, then `npm run gen:types`.
3. Register the schema ids in `src/edi/schemas.ts`.
4. Write the adapter implementing `InboundAdapter` or `OutboundAdapter`; register it in `registry.ts`.
5. Add the destination (inbound) in the host's `destinations` config; add the docType to the manifest schema if needed.
6. Tests: happy path, overlay, each business rule, fixtures validate.

## Not implemented yet
- Azure SDK implementations of the ports (Service Bus publisher, idempotency store, Key Vault, OTel emitter).
- A Functions/container host that calls `processInbound` / `processOutbound`.
- Sterling-side X12 JSON map and delivery to this bridge (human-led; see ADR-002).
- 855 and other document types. The ISA/GS identifiers in `profiles/ACME.json` are placeholders.
