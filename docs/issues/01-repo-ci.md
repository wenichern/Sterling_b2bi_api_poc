---
title: "Harden CI: Spectral, bicep build, secret scan, schema validation"
labels: agent-task, devops-agent
assignee-agent: devops-agent
depends-on: none
---
## Context
CI skeleton exists in .github/workflows/ci.yml. Extend it so every PR gets fast objective feedback.

## Files in scope / out of scope
See the owning role in .github/agents/devops-agent.agent.md. Do not modify /contracts.

## Acceptance criteria
- [ ] CI runs scripts/validate_contracts.py, Spectral, bicep build, gitleaks
- [ ] Add a what-if/plan job template (disabled until Azure OIDC is configured)
- [ ] Add a CODEOWNERS check and PR template reminder
- [ ] Tests added and passing
- [ ] PR description lists how it was tested

## How to verify
`python scripts/validate_contracts.py` and open a test PR.
