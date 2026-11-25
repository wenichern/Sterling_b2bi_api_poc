---
title: "Bicep: Service Bus namespace, queues orders-in and asn-out, DLQ policy"
labels: agent-task, infra-agent
assignee-agent: infra-agent
depends-on: 1
---
## Context
Async backbone for the POC.

## Files in scope / out of scope
See the owning role in .github/agents/infra-agent.agent.md. Do not modify /contracts.

## Acceptance criteria
- [ ] Module in infra/modules/servicebus.bicep, parameterized
- [ ] Queues orders-in and asn-out with explicit maxDeliveryCount and DLQ
- [ ] Example parameters file and what-if note
- [ ] Tests added and passing
- [ ] PR description lists how it was tested

## How to verify
`az bicep build --file infra/modules/servicebus.bicep`
