# Test plan: GLOBEX

| # | Test | Expected |
|---|---|---|
| 1 | inbound 850: Happy path | One document processed, one trace, success business event |
| 2 | inbound 850: Duplicate (same control number) | No second backend call |
| 3 | inbound 850: Malformed document | Rejected, `failed` event, nothing published |
| 4 | inbound 850: Backend 503 | Retries, then dead-letter with correlationId |
| 5 | inbound 850: DLQ replay (human-approved) | Reprocessed once, no duplicate |
| 6 | SLA breach drill (30 min) | Alert fires |

Sample payloads: `contracts/examples/`. Run mocks first, then DEVL.
