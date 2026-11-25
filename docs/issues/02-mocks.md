---
title: "Mocks for ERP order API and WMS status API"
labels: agent-task, test-agent
assignee-agent: test-agent
depends-on: contracts
---
## Context
Generate mocks from contracts/openapi/erp-orders.v1.yaml and wms-status.v1.yaml.

## Files in scope / out of scope
See the owning role in .github/agents/test-agent.agent.md. Do not modify /contracts.

## Acceptance criteria
- [ ] Prism (or WireMock) mock servers start with one command (docker compose or npm script)
- [ ] Mock returns 201/200 for POST /orders and 200/404 for GET status
- [ ] Smoke test hits both mocks
- [ ] Tests added and passing
- [ ] PR description lists how it was tested

## How to verify
Run the start command and the smoke test.
