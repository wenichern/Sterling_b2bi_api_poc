---
title: "Deploy the slice from a partner manifest (partner-acme.yaml)"
labels: agent-task, devops-agent
assignee-agent: devops-agent
depends-on: 3, 4, 5, 6
---
## Context
Manifest -> Service Bus entities, APIM config, monitoring, Sterling setup checklist.

## Files in scope / out of scope
See the owning role in .github/agents/devops-agent.agent.md. Do not modify /contracts.

## Acceptance criteria
- [ ] Pipeline validates manifest against manifests/schema/partner.schema.json
- [ ] Deploys infra and APIM config using OIDC; production requires human approval
- [ ] Onboarding partner-globex.yaml requires no code changes
- [ ] Tests added and passing
- [ ] PR description lists how it was tested

## How to verify
Dry-run against both manifests.
