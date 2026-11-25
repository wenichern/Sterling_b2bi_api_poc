---
title: "Function: consume orders-in, call ERP API, idempotent, DLQ on failure"
labels: agent-task, integration-agent
assignee-agent: integration-agent
depends-on: 2, 4
---
## Context
Async consumer bridging Service Bus to the ERP API (mock in POC).

## Files in scope / out of scope
See the owning role in .github/agents/integration-agent.agent.md. Do not modify /contracts.

## Acceptance criteria
- [ ] Validates message against contracts/events/order-received.v1.schema.json
- [ ] Idempotent on (partnerId, docType, controlNumber)
- [ ] Retries with backoff; dead-letters after max deliveries
- [ ] Propagates correlationId and traceparent to the ERP call
- [ ] Claim-check support for large payloads
- [ ] Tests added and passing
- [ ] PR description lists how it was tested

## How to verify
Unit tests plus run against the ERP mock.
