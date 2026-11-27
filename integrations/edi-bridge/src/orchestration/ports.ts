import type { ControlNumbers } from "../canonical/envelope";
import type { ValidationIssue } from "../edi/validation";

/** Ports = the side effects. Implement them with Azure SDKs; tests use in-memory fakes. */

export interface MessageProperties {
  correlationId: string;
  traceparent?: string;
  partnerId: string;
  docType: string;
  controlNumber?: string;
}

export interface Publisher {
  /** Publish to a queue/topic. Must reject on failure so the pipeline can report it. */
  publish(destination: string, body: unknown, props: MessageProperties): Promise<void>;
}

export interface IdempotencyStore {
  has(key: string): Promise<boolean>;
  put(key: string): Promise<void>;
}

export interface FunctionalAck {
  partnerId: string;
  transactionSet: string;
  correlationId: string;
  controlNumbers?: ControlNumbers;
  status: "accepted" | "rejected";
  errors: ValidationIssue[];
}

/** Asks Sterling to send the 997/999 for an inbound document. */
export interface Acknowledger {
  acknowledge(ack: FunctionalAck): Promise<void>;
}

/** Matches templates/telemetry/business-event.schema.json. Never include payload content or PII. */
export interface BusinessEvent {
  eventName: "received" | "translated" | "sent" | "failed";
  eventTime: string;
  correlationId: string;
  traceparent?: string;
  partnerId: string;
  docType: string;
  controlNumber?: string;
  poNumber?: string;
  bpName: string;
  errorCode?: string;
  errorSummary?: string;
}

export interface BusinessEventEmitter {
  emit(event: BusinessEvent): Promise<void>;
}

/**
 * Allocates ISA/GS/ST control numbers for outbound documents. Exactly ONE system may own
 * allocation per partner (either this bridge or Sterling) or numbers will collide.
 */
export interface ControlNumberAllocator {
  next(partnerId: string, transactionSet: string): Promise<ControlNumbers>;
}

export interface Clock { now(): string }
export interface IdGenerator { uuid(): string }
