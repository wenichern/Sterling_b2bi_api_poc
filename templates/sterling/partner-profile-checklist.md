# Sterling partner profile checklist

## Common
- [ ] Trading partner created with ID matching manifest `partner.id`
- [ ] Contacts and escalation e-mail recorded
- [ ] Document envelopes/maps assigned for each manifest document
- [ ] Business process bound to the partner (see BP templates)
- [ ] Test (not production) identifiers and certificates used in SBOX/DEVL

## AS2
- [ ] Partner AS2 identifier and URL captured
- [ ] Partner certificate imported (stored/referenced via Key Vault secret named in the manifest)
- [ ] Our signing/encryption certificate shared with the partner
- [ ] MDN mode agreed (sync or async) and tested
- [ ] Inbound AS2 endpoint reachable by the partner (not by Azure; see network notes)

## SFTP
- [ ] Service account and key/credential created (secret in Key Vault, not in the manifest)
- [ ] Inbound and outbound paths created and permissioned
- [ ] File-name pattern, size limit, and archive location agreed
- [ ] Stale-file alert configured

## Verification
- [ ] Test document received and mapped
- [ ] Functional acknowledgment sent
- [ ] Partner-specific test sign-off recorded in the onboarding issue
