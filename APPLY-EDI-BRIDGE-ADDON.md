# Applying the edi-bridge add-on to your existing repo

1. Unzip at your repo root. It only adds new files, plus `package-lock.json` for the bridge.
2. **Contract edit (needs your architecture review):** in `manifests/schema/partner.schema.json`, add `"820"` to the
   `documents[].docType` enum: `["850", "855", "856", "810", "820"]`.
3. Optional: append `README-EDI-SNIPPET.md` to your `README.md`.
4. Install and test:
   ```bash
   cd integrations/edi-bridge
   npm ci
   npm run gen:types && git diff --stat src/generated   # should show no changes
   npm run check                                       # typecheck + 63 tests
   ```
5. Commit on a branch and open a PR. The new `edi-bridge.yml` workflow runs on it.
6. Read `docs/adr/ADR-002-*.md` and decide: it supersedes parts of ADR-001, and the Sterling BP templates and
   patterns 02/05 need follow-up edits before it is accepted.

Known limits: the Sterling-side X12 JSON map is unverified; ISA/GS ids in `profiles/ACME.json` are placeholders;
the Azure implementations of the ports are not written.
