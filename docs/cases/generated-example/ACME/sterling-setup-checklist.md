# Sterling setup checklist: ACME

Human-led in the sandbox. Use `templates/sterling/` as the specification.

## Partner profile
- [ ] Create trading partner `ACME` (ACME Retail Inc.)
- [ ] Contact: edi@acme.example.com
- [ ] AS2 profile, partner AS2 id `ACME-AS2`
- [ ] Import partner certificate (Key Vault secret `acme-as2-cert`)
- [ ] Exchange our certificate; agree and test MDN mode

## Documents
- [ ] inbound 850: map `ACME_850_to_CanonicalOrder`; BP per `templates/sterling/bp-850-inbound.md`
- [ ] outbound 856: map `CanonicalASN_to_ACME_856`; BP per `templates/sterling/bp-856-outbound.md`

## Routing
- [ ] Publish to queue `orders-in` with properties correlationId, traceparent, partnerId, docType, controlNumber
- [ ] Consume outbound queue `acme-856-out` (Sterling pulls)

## Telemetry
- [ ] Business events (received, translated, sent, failed) emitted per `templates/telemetry/business-event.schema.json`
- [ ] Exported BP/map/profile committed under `integrations/sterling/`
