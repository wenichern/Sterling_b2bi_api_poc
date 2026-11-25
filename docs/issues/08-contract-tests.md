---
title: "Contract tests: APIM to WMS mock, Function to ERP mock"
labels: agent-task, test-agent
assignee-agent: test-agent
depends-on: 5, 6
---
## Context
Fail the build when spec and implementation disagree.

## Files in scope / out of scope
See the owning role in .github/agents/test-agent.agent.md. Do not modify /contracts.

## Acceptance criteria
- [ ] Tests derived from OpenAPI specs
- [ ] End-to-end test asserts a single correlationId across hops
- [ ] Tests added and passing
- [ ] PR description lists how it was tested

## How to verify
Run the test suite locally and in CI.
