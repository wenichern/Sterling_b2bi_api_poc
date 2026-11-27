## EDI bridge (TypeScript adapters)
| Path | Purpose |
|---|---|
| `integrations/edi-bridge/` | Pure adapters X12 JSON <-> canonical (850, 820 in; 856, 810 out) and orchestration with ports; 63 tests |
| `contracts/edi-json/` | The X12 JSON contract between Sterling and the bridge |
| `docs/adr/ADR-002-*.md` | Decision: Sterling does syntax only; business mapping in TypeScript |
