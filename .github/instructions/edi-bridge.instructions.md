---
applyTo: "integrations/edi-bridge/**"
---
- TypeScript strict mode; Node 20. Do not hand-edit `src/generated/` - run `npm run gen:types`.
- Adapters are pure functions: no I/O, no `Date.now()`, no random ids. Inject via ctx/meta/ports.
- `validate()` must not throw and must not include field values in messages (log codes and JSON pointers).
- Never change `/contracts` here. If a schema must change, stop and comment on the issue.
- Every adapter change needs tests: happy path, partner overlay, each business rule, schema violation.
- Inbound idempotency key is partnerId|docType|ISA|GS|ST. Do not shorten it.
- Run `npm run check` before opening a PR.
