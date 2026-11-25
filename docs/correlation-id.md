# Correlation ID rules
- Header: `x-correlation-id` (GUID). Generated at APIM or at the first inbound document if absent.
- Service Bus message property: `correlationId`. W3C `traceparent` travels alongside.
- Stored in Sterling process data as `CorrelationId` at BP start; included in every business event.
- Business keys tied to it: partnerId, docType, controlNumber, poNumber.
- Never drop or regenerate downstream.
