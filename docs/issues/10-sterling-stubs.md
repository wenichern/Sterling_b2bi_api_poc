---
title: "Sterling: BP/map export stubs and business-event callback template"
labels: agent-task, integration-agent
assignee-agent: integration-agent
depends-on: Sterling sandbox (human-led)
---
## Context
Sterling BP/map config is not natively code-friendly. Agent drafts docs and the callback service; a human builds in the sandbox.

## Files in scope / out of scope
See the owning role in .github/agents/integration-agent.agent.md. Do not modify /contracts.

## Acceptance criteria
- [ ] Documented BP template: receive AS2 850 -> map -> publish to orders-in
- [ ] Small HTTP callback service or Java service adapter spec that emits business events (received, translated, sent, failed)
- [ ] Export/import runbook for BP, map, and partner profile
- [ ] Tests added and passing
- [ ] PR description lists how it was tested

## How to verify
Review docs with the Sterling admin.
