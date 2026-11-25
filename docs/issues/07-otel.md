---
title: "OTel Collector config, Function instrumentation, propagation tests"
labels: agent-task, observability-agent
assignee-agent: observability-agent
depends-on: 6
---
## Context
Make one trace span APIM -> Service Bus -> Function -> ERP.

## Files in scope / out of scope
See the owning role in .github/agents/observability-agent.agent.md. Do not modify /contracts.

## Acceptance criteria
- [ ] Function emits spans/logs with partner.id, doc.type, po.number, correlation.id
- [ ] Trace context carried via Service Bus message properties and restored in the consumer
- [ ] Collector config validated; propagation test passes
- [ ] Tests added and passing
- [ ] PR description lists how it was tested

## How to verify
Run the propagation test and inspect the debug exporter output.
