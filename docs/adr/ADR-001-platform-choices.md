# ADR-001: Platform choices
Status: Proposed (edit and approve before agents start)

- IaC: Bicep
- Functions runtime: .NET 8 isolated worker (alternative: Node 20; pick one and stay)
- Messaging: Service Bus (commands, DLQ) now; Event Grid/Event Hubs later for events/streams
- Gateway: Azure API Management
- Observability: OpenTelemetry -> Collector -> Azure Monitor / Application Insights
- EDI mapping: stays in Sterling translator for the POC; canonical JSON internally
- Sterling to Azure: JMS/AMQP to Service Bus Premium, or an Azure Functions HTTP bridge
