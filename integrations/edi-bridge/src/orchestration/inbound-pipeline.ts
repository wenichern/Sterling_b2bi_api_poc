import { inboundKey } from "../canonical/envelope";
import type { AdapterRegistry } from "../edi/adapters/registry";
import type { PartnerContext } from "../edi/partners/partner-context";
import type { ValidationIssue } from "../edi/validation";
import type {
  Acknowledger, BusinessEvent, BusinessEventEmitter, Clock, IdGenerator, IdempotencyStore, Publisher,
} from "./ports";

export interface InboundDeps {
  registry: AdapterRegistry;
  partners: (partnerId: string) => PartnerContext;
  /** transaction set -> destination queue, e.g. { "850": "orders-in", "820": "remittances-in" } */
  destinations: Record<string, string>;
  idempotency: IdempotencyStore;
  publisher: Publisher;
  acknowledger: Acknowledger;
  events: BusinessEventEmitter;
  clock: Clock;
  ids: IdGenerator;
}

export interface InboundInput {
  partnerId: string;
  transactionSet: string;
  /** Translated X12 JSON from Sterling. */
  x12: unknown;
  correlationId?: string;
  traceparent?: string;
}

export type InboundResult =
  | { status: "published"; correlationId: string; key: string; destination: string; warnings: string[] }
  | { status: "duplicate"; correlationId: string; key: string }
  | { status: "rejected"; correlationId: string; issues: ValidationIssue[] }
  | { status: "failed"; correlationId: string; retryable: true; error: string };

const BP_NAME = "edi-bridge.inbound";
const summarize = (issues: ValidationIssue[]): string => issues.map((i) => `${i.code}@${i.path}`).join(",").slice(0, 500);

/**
 * validate -> dedupe -> translate -> publish -> mark seen -> acknowledge.
 * Delivery is at-least-once: if the process dies after publish but before the idempotency write,
 * a retransmission publishes again, so downstream consumers MUST also be idempotent.
 * The functional ack (997) is sent only after a durable publish, so we never acknowledge what we could lose.
 */
export async function processInbound(deps: InboundDeps, input: InboundInput): Promise<InboundResult> {
  const ctx = deps.partners(input.partnerId);
  const adapter = deps.registry.getInbound(input.transactionSet);
  const destination = deps.destinations[input.transactionSet];
  if (!destination) throw new Error(`No destination configured for transaction set '${input.transactionSet}'`);

  const correlationId = input.correlationId ?? deps.ids.uuid();
  const base = {
    partnerId: input.partnerId,
    docType: input.transactionSet,
    correlationId,
    ...(input.traceparent ? { traceparent: input.traceparent } : {}),
  };
  const emit = (e: Omit<BusinessEvent, "eventTime" | "bpName">) =>
    safely(() => deps.events.emit({ ...e, eventTime: deps.clock.now(), bpName: BP_NAME }));

  const validation = adapter.validate(input.x12, ctx);
  if (!validation.valid) {
    await safely(() => deps.acknowledger.acknowledge({
      partnerId: input.partnerId, transactionSet: input.transactionSet, correlationId,
      status: "rejected", errors: validation.errors,
    }));
    await emit({ ...base, eventName: "failed", errorCode: "VALIDATION", errorSummary: summarize(validation.errors) });
    return { status: "rejected", correlationId, issues: validation.errors };
  }

  const controlNumbers = adapter.controlNumbers(input.x12);
  const key = inboundKey(input.partnerId, input.transactionSet, controlNumbers);

  if (await deps.idempotency.has(key)) {
    // Retransmission: acknowledge again so the partner stops resending, but do nothing else.
    await safely(() => deps.acknowledger.acknowledge({
      partnerId: input.partnerId, transactionSet: input.transactionSet, correlationId,
      controlNumbers, status: "accepted", errors: [],
    }));
    return { status: "duplicate", correlationId, key };
  }

  const event = adapter.toEvent(input.x12, ctx, {
    correlationId,
    receivedAt: deps.clock.now(),
    ...(input.traceparent ? { traceparent: input.traceparent } : {}),
  });
  const keys = adapter.businessKeys(event);
  const poNumber = keys["po.number"];
  const common = { ...base, controlNumber: event.controlNumber, ...(poNumber ? { poNumber } : {}) };
  await emit({ ...common, eventName: "translated" });

  try {
    await deps.publisher.publish(destination, event, {
      correlationId,
      partnerId: input.partnerId,
      docType: input.transactionSet,
      controlNumber: event.controlNumber,
      ...(input.traceparent ? { traceparent: input.traceparent } : {}),
    });
  } catch (err) {
    await emit({ ...common, eventName: "failed", errorCode: "PUBLISH", errorSummary: "publish to broker failed" });
    return { status: "failed", correlationId, retryable: true, error: err instanceof Error ? err.message : "publish failed" };
  }

  const warnings: string[] = [];
  try {
    await deps.idempotency.put(key);
  } catch {
    warnings.push("IDEMPOTENCY_STORE_WRITE_FAILED");
  }
  await safely(() => deps.acknowledger.acknowledge({
    partnerId: input.partnerId, transactionSet: input.transactionSet, correlationId,
    controlNumbers, status: "accepted", errors: [],
  }));
  await emit({ ...common, eventName: "sent" });
  return { status: "published", correlationId, key, destination, warnings };
}

/** Telemetry and acks must never break document processing. */
async function safely(fn: () => Promise<void>): Promise<void> {
  try { await fn(); } catch { /* swallow: observability/ack failures are reported by their own channels */ }
}
