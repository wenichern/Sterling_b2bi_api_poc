---
applyTo: "observability/**"
---
- OpenTelemetry only. The Collector config is the single export path (Azure Monitor / OTLP).
- Required attributes: partner.id, doc.type, po.number, correlation.id.
- Business-event spans: received, translated, sent, failed.
- Do not log payload bodies or PII.
