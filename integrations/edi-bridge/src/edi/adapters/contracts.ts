import type { BaseEvent, ControlNumbers, InboundMeta, OutboundMeta } from "../../canonical/envelope";
import type { PartnerContext } from "../partners/partner-context";
import type { ValidationResult } from "../validation";

/**
 * Inbound: translated X12 JSON -> canonical event.
 * Adapters are PURE: no I/O, no clock, no random ids (everything arrives via ctx/meta).
 * Side effects (dedupe, publish, ack) live in /orchestration.
 */
export interface InboundAdapter<TX12, TEvent extends BaseEvent> {
  readonly transactionSet: string;
  /** Contract (JSON Schema) plus business-rule validation. Must not throw on bad input. */
  validate(input: unknown, ctx: PartnerContext): ValidationResult;
  controlNumbers(x12: TX12): ControlNumbers;
  /** Call only after validate() succeeded. */
  toEvent(x12: TX12, ctx: PartnerContext, meta: InboundMeta): TEvent;
  /** Non-sensitive business keys for telemetry (e.g. poNumber). */
  businessKeys(event: TEvent): Record<string, string>;
}

/** Outbound: canonical document -> X12 JSON for Sterling to serialize and send. */
export interface OutboundAdapter<TCanonical extends { correlationId: string }, TX12> {
  readonly transactionSet: string;
  validate(input: unknown, ctx: PartnerContext): ValidationResult;
  /** Stable business identifier used for duplicate suppression (e.g. shipmentId, invoiceNumber). */
  businessKey(canonical: TCanonical): string;
  businessKeys(canonical: TCanonical): Record<string, string>;
  /** Call only after validate() succeeded. Control numbers are allocated by the orchestration layer. */
  toX12(canonical: TCanonical, ctx: PartnerContext, meta: OutboundMeta): TX12;
}
