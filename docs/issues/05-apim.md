---
title: "APIM: GET /orders/{id}/status with JWT validation and correlation ID injection"
labels: agent-task, api-agent
assignee-agent: api-agent
depends-on: 3
---
## Context
Sync path through the gateway, based on contracts/openapi/gateway-orders.v1.yaml.

## Files in scope / out of scope
See the owning role in .github/agents/api-agent.agent.md. Do not modify /contracts.

## Acceptance criteria
- [ ] API definition imported from OpenAPI, backend = WMS (mock URL via named value)
- [ ] Policy: validate-jwt, inject/forward x-correlation-id and traceparent, rate limit, backend timeout
- [ ] Response returns x-correlation-id
- [ ] Tests added and passing
- [ ] PR description lists how it was tested

## How to verify
Policy XML lint plus contract test (issue 8).
