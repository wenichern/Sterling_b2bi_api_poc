---
applyTo: "tests/**"
---
- Mocks are generated from /contracts/openapi (Prism or WireMock); do not diverge from the spec.
- Contract tests must fail when a spec and implementation disagree.
- End-to-end tests assert a single correlation ID across all hops.
