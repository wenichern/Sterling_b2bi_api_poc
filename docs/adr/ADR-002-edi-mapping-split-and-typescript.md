# ADR-002: EDI/business mapping split and TypeScript edi-bridge
Status: Proposed (needs architecture review and a Sterling admin's feasibility check before acceptance)
Supersedes: the "EDI mapping stays in Sterling translator" and "Functions runtime" lines of ADR-001 for EDI documents.

## Context
ADR-001 kept all EDI mapping in Sterling's translator. Business-level mapping inside Sterling maps is hard to
version, unit-test, review in a PR, or hand to Copilot agents. We want the logic in code with fast tests.

## Decision
1. **Sterling does syntax only:** parse inbound EDI to "X12 JSON" and serialize outbound "X12 JSON" to EDI
   (envelopes, HL numbering, delimiters, MDN/997 transport). Contract: `contracts/edi-json/*.schema.json`.
2. **Business mapping lives in `integrations/edi-bridge`** (TypeScript, Node 20): pure adapters convert X12 JSON
   to/from the canonical model. Side effects (dedupe, publish, ack, control numbers) live in `orchestration/`
   behind ports so adapters stay pure and testable.
3. **Types are generated from the JSON Schemas** (`npm run gen:types`). Schemas stay the single source of truth.
4. **Composite control number:** canonical `controlNumber` = `ISA-GS-ST` (e.g. `000000101-101-0001`).
   Inbound idempotency key = `partnerId|docType|ISA|GS|ST`. Outbound key = `partnerId|docType|out|<business key>`.
   No canonical schema change is needed (the field is a free string).
5. **Outbound control numbers:** exactly one owner per partner. Default here: the bridge (via the
   `ControlNumberAllocator` port). If Sterling assigns them, implement the port to return Sterling's numbers.
6. **Business events:** the bridge emits `translated`/`sent`/`failed` (inbound) and `translated`/`failed` (outbound).
   Sterling emits `received` and the outbound `sent` (after the MDN). `bpName` distinguishes the source.
7. **Partner definition stays in the manifest;** `edi/partners/profiles/*.json` holds only code-level quirks
   (ISA/GS identifiers, SKU qualifier order, UOM map, defaults).

## Consequences
- One more hop (Sterling -> bridge -> broker). Re-validate latency against SLOs.
- Sterling must emit/consume the X12 JSON shape. **Feasibility is unverified**: confirm with the Sterling admin
  how to produce it (custom map, XML-to-JSON step, or a service), and its performance.
- Follow-up edits (not done here): `templates/sterling/bp-850-inbound.md` and `bp-856-outbound.md`
  (map to X12 JSON; deliver to the bridge), `patterns/02` and `05` diagrams, and the outbound queue payload
  (X12 JSON instead of canonical).
- Contract changes needing human approval: `manifests/schema/partner.schema.json` (adds `820`);
  consider updating the `order.schema.json` description and `order.example.json` to the composite control number.
- 855 (PO acknowledgment) and 997/999 are not implemented here; 997 stays with Sterling.

## Open questions
- Does Sterling or the bridge own outbound ISA/GS/ST numbering? Do partners accept gaps?
- Do any partners reuse interchange numbers? (affects the key; the composite handles it if ST/GS differ)
- Runtime host: Azure Functions (Node 20) vs container. Keep the ports host-agnostic.
