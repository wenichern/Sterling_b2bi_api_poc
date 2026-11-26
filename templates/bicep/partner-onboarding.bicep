// Per-partner Service Bus resources. Reuse for every partner; do not copy per environment.
// Parameters come from the generated partner.parameters.json.
// NOTE: not compiled in CI yet. Run `az bicep build --file templates/bicep/partner-onboarding.bicep`
// before first use and move to infra/modules/ when approved.

@description('Name of the existing Service Bus namespace')
param serviceBusNamespaceName string

@description('Partner ID, e.g. ACME')
@minLength(2)
param partnerId string

@description('Outbound document types that need a queue, e.g. ["856"]')
param outboundDocTypes array = []

@description('Delivery attempts before dead-lettering')
@minValue(1)
param maxDeliveryCount int = 5

@description('ISO 8601 lock duration')
param lockDuration string = 'PT1M'

@description('ISO 8601 message time to live')
param messageTimeToLive string = 'P14D'

@description('ISO 8601 duplicate detection window')
param duplicateDetectionWindow string = 'PT10M'

resource namespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' existing = {
  name: serviceBusNamespaceName
}

resource outboundQueues 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = [for docType in outboundDocTypes: {
  parent: namespace
  name: toLower('${partnerId}-${docType}-out')
  properties: {
    maxDeliveryCount: maxDeliveryCount
    lockDuration: lockDuration
    defaultMessageTimeToLive: messageTimeToLive
    deadLetteringOnMessageExpiration: true
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: duplicateDetectionWindow
  }
}]

output queueNames array = [for (docType, i) in outboundDocTypes: outboundQueues[i].name]
