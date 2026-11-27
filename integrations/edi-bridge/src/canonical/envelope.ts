/** Cross-cutting types shared by adapters and orchestration. No EDI knowledge beyond control numbers. */

export interface ControlNumbers {
  /** ISA13 interchange control number. */
  isa: string;
  /** GS06 group control number. */
  gs: string;
  /** ST02 transaction set control number. */
  st: string;
}

/** Fields every published event carries (see contracts/events/*.schema.json). */
export interface BaseEvent {
  eventType: string;
  eventTime: string;
  correlationId: string;
  partnerId: string;
  docType: string;
  /** Composite ISA-GS-ST control number. */
  controlNumber: string;
}

export interface InboundMeta {
  correlationId: string;
  traceparent?: string;
  /** ISO 8601 timestamp when the document was received. */
  receivedAt: string;
}

export interface OutboundMeta {
  controlNumbers: ControlNumbers;
  /** Defaults to "T" (test) so nothing is sent as production by accident. */
  usageIndicator?: "P" | "T" | "I";
}

/** One control number string for the canonical `controlNumber` field. */
export const composeControlNumber = (c: ControlNumbers): string => `${c.isa}-${c.gs}-${c.st}`;

/**
 * Inbound idempotency key. Uses all three levels: one interchange can hold many
 * transactions, and partners may reuse small ST numbers across interchanges.
 */
export const inboundKey = (partnerId: string, transactionSet: string, c: ControlNumbers): string =>
  [partnerId, transactionSet, c.isa, c.gs, c.st].join("|");

/** Outbound idempotency key: the business identifier of the document (e.g. shipmentId). */
export const outboundKey = (partnerId: string, transactionSet: string, businessKey: string): string =>
  [partnerId, transactionSet, "out", businessKey].join("|");
