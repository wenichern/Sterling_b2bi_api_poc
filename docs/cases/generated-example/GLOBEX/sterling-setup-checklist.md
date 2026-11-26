# Sterling setup checklist: GLOBEX

Human-led in the sandbox. Use `templates/sterling/` as the specification.

## Partner profile
- [ ] Create trading partner `GLOBEX` (Globex Distribution)
- [ ] Contact: edi@globex.example.com
- [ ] SFTP user `globex`; inbound `/in`, outbound `/out`
- [ ] Credential in Key Vault, never in the manifest; configure stale-file alert

## Documents
- [ ] inbound 850: map `GLOBEX_850_to_CanonicalOrder`; BP per `templates/sterling/bp-850-inbound.md`

## Routing
- [ ] Publish to queue `orders-in` with properties correlationId, traceparent, partnerId, docType, controlNumber

## Telemetry
- [ ] Business events (received, translated, sent, failed) emitted per `templates/telemetry/business-event.schema.json`
- [ ] Exported BP/map/profile committed under `integrations/sterling/`
