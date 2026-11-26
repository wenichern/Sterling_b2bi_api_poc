# Test plan: ACME

| # | Test | Expected |
|---|---|---|
| 1 | inbound 850: Happy path | One document processed, one trace, success business event |
| 2 | inbound 850: Duplicate (same control number) | No second backend call |
| 3 | inbound 850: Malformed document | Rejected, `failed` event, nothing published |
| 4 | inbound 850: Backend 503 | Retries, then dead-letter with correlationId |
| 5 | inbound 850: DLQ replay (human-approved) | Reprocessed once, no duplicate |
| 6 | outbound 856: Valid ASN/document | EDI produced, partner receipt confirmed, `sent` event |
| 7 | outbound 856: Invalid payload | Dead-letter, `failed` event, nothing sent |
| 8 | outbound 856: Receipt timeout | Retry then alert |
| 9 | outbound 856: Duplicate message | One outbound document |
| 10 | SLA breach drill (15 min) | Alert fires |

Sample payloads: `contracts/examples/`. Run mocks first, then DEVL.
