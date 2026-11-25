---
title: "Bicep: Function app, Key Vault, managed identity, Blob for claim-check"
labels: agent-task, infra-agent
assignee-agent: infra-agent
depends-on: 3
---
## Context
Compute, secrets, and claim-check storage.

## Files in scope / out of scope
See the owning role in .github/agents/infra-agent.agent.md. Do not modify /contracts.

## Acceptance criteria
- [ ] Modules for Function app, Key Vault, user-assigned identity, storage with a claim-check container
- [ ] RBAC role assignments, no shared keys
- [ ] Example parameters and what-if note
- [ ] Tests added and passing
- [ ] PR description lists how it was tested

## How to verify
`az bicep build` on each module.
