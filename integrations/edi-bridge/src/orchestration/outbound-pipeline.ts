import type { ControlNumbers } from "../canonical/envelope";
import { outboundKey } from "../canonical/envelope";
import type { AdapterRegistry } from "../edi/adapters/registry";
import type { PartnerContext } from "../edi/partners/partner-context";
import type { ValidationIssue } from "../edi/validation";
import type {
  BusinessEvent, BusinessEventEmitter, Clock, ControlNumberAllocator, IdempotencyStore, Publisher,
} from "./ports";

export interface OutboundDeps {
  registry: AdapterRegistry;
  partners: (partnerId: string) => PartnerContext;
  /** (partnerId, transactionSet) -> queue Sterling consumes, e.g. acme-856-out */
  destinationFor: (partnerId: string, transactionSet: string) => string;
  idempotency: IdempotencyStore;
  allocator: ControlNumberAllocator;
  /** Hands the X12 JSON to Sterling (queue). */
  publisher: Publisher;
  events: BusinessEventEmitter;
  clock: Clock;
}

export interface OutboundInput {
  partnerId: string;
  transactionSet: string;
  /** Canonical document (ASN, invoice, ...). */
  canonical: unknown;
  traceparent?: string;
  usageIndicator?: "P" | "T" | "I";
}

export type OutboundResult =
  | { status: "submitted"; correlationId: string; key: string; destination: string; controlNumbers: ControlNumbers }
  | { status: "duplicate"; correlationId: string; key: string }
  | { status: "rejected"; correlationId: string; issues: ValidationIssue[] }
  | { status: "failed"; correlationId: string; retryable: true; error: string };

const BP_NAME = "edi-bridge.outbound";
const summarize = (issues: ValidationIssue[]): string => issues.map((i) => `${i.code}@${i.path}`).join(",").slice(0, 500);

/**
 * validate -> dedupe -> allocate control numbers -> translate -> hand to Sterling -> mark seen.
 * This bridge emits `translated` or `failed`; Sterling emits `sent` after the partner's MDN.
 * Control-number gaps after a failed handoff are possible and normal in X12.
 */
export async function processOutbound(deps: OutboundDeps, input: OutboundInput): Promise<OutboundResult> {
  const ctx = deps.partners(input.partnerId);
  const adapter = deps.registry.getOutbound(input.transactionSet);
  const correlationId =
    (input.canonical as { correlationId?: string } | null)?.correlationId ?? "unknown";
  const base = {
    partnerId: input.partnerId,
    docType: input.transactionSet,
    correlationId,
    ...(input.traceparent ? { traceparent: input.traceparent } : {}),
  };
  const emit = (e: Omit<BusinessEvent, "eventTime" | "bpName">) =>
    safely(() => deps.events.emit({ ...e, eventTime: deps.clock.now(), bpName: BP_NAME }));

  const validation = adapter.validate(input.canonical, ctx);
  if (!validation.valid) {
    await emit({ ...base, eventName: "failed", errorCode: "VALIDATION", errorSummary: summarize(validation.errors) });
    return { status: "rejected", correlationId, issues: validation.errors };
  }

  const key = outboundKey(input.partnerId, input.transactionSet, adapter.businessKey(input.canonical));
  if (await deps.idempotency.has(key)) return { status: "duplicate", correlationId, key };

  const poNumber = adapter.businessKeys(input.canonical)["po.number"];
  try {
    const controlNumbers = await deps.allocator.next(input.partnerId, input.transactionSet);
    const x12 = adapter.toX12(input.canonical, ctx, {
      controlNumbers,
      ...(input.usageIndicator ? { usageIndicator: input.usageIndicator } : {}),
    });
    const destination = deps.destinationFor(input.partnerId, input.transactionSet);
    const common = { ...base, ...(poNumber ? { poNumber } : {}), controlNumber: controlNumbers.isa };

    await deps.publisher.publish(destination, x12, {
      correlationId,
      partnerId: input.partnerId,
      docType: input.transactionSet,
      controlNumber: controlNumbers.isa,
      ...(input.traceparent ? { traceparent: input.traceparent } : {}),
    });
    await emit({ ...common, eventName: "translated" });
    try { await deps.idempotency.put(key); } catch { /* downstream duplicate detection still applies */ }
    return { status: "submitted", correlationId, key, destination, controlNumbers };
  } catch (err) {
    await emit({ ...base, ...(poNumber ? { poNumber } : {}), eventName: "failed", errorCode: "HANDOFF", errorSummary: "translation or handoff to Sterling failed" });
    return { status: "failed", correlationId, retryable: true, error: err instanceof Error ? err.message : "handoff failed" };
  }
}

async function safely(fn: () => Promise<void>): Promise<void> {
  try { await fn(); } catch { /* telemetry must never break processing */ }
}
