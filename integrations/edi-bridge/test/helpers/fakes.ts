import type {
  Acknowledger, BusinessEvent, BusinessEventEmitter, Clock, ControlNumberAllocator, FunctionalAck,
  IdGenerator, IdempotencyStore, MessageProperties, Publisher,
} from "../../src/orchestration/ports";
import { createDefaultRegistry } from "../../src/edi/adapters/registry";
import { getPartnerContext } from "../../src/edi/partners/profiles";
import type { InboundDeps } from "../../src/orchestration/inbound-pipeline";
import type { OutboundDeps } from "../../src/orchestration/outbound-pipeline";

export class MemoryIdempotency implements IdempotencyStore {
  keys = new Set<string>();
  failPut = false;
  async has(key: string) { return this.keys.has(key); }
  async put(key: string) { if (this.failPut) throw new Error("store down"); this.keys.add(key); }
}

export class RecordingPublisher implements Publisher {
  published: { destination: string; body: unknown; props: MessageProperties }[] = [];
  fail = false;
  async publish(destination: string, body: unknown, props: MessageProperties) {
    if (this.fail) throw new Error("broker down");
    this.published.push({ destination, body, props });
  }
}

export class RecordingAck implements Acknowledger {
  acks: FunctionalAck[] = [];
  async acknowledge(ack: FunctionalAck) { this.acks.push(ack); }
}

export class RecordingEvents implements BusinessEventEmitter {
  events: BusinessEvent[] = [];
  fail = false;
  async emit(e: BusinessEvent) { if (this.fail) throw new Error("telemetry down"); this.events.push(e); }
  get names() { return this.events.map((e) => e.eventName); }
}

export const fixedClock: Clock = { now: () => "2026-11-25T14:00:00.000Z" };

export class SeqIds implements IdGenerator {
  n = 0;
  uuid() { this.n++; return `00000000-0000-4000-8000-${String(this.n).padStart(12, "0")}`; }
}

export class SeqAllocator implements ControlNumberAllocator {
  n = 0;
  async next() {
    this.n++;
    return { isa: String(this.n).padStart(9, "0"), gs: String(this.n), st: String(this.n).padStart(4, "0") };
  }
}

export function makeInbound() {
  const f = {
    idempotency: new MemoryIdempotency(), publisher: new RecordingPublisher(),
    acknowledger: new RecordingAck(), events: new RecordingEvents(), ids: new SeqIds(),
  };
  const deps: InboundDeps = {
    registry: createDefaultRegistry(), partners: getPartnerContext,
    destinations: { "850": "orders-in", "820": "remittances-in" },
    clock: fixedClock, ...f,
  };
  return { deps, ...f };
}

export function makeOutbound() {
  const f = {
    idempotency: new MemoryIdempotency(), publisher: new RecordingPublisher(),
    events: new RecordingEvents(), allocator: new SeqAllocator(),
  };
  const deps: OutboundDeps = {
    registry: createDefaultRegistry(), partners: getPartnerContext,
    destinationFor: (p, t) => `${p.toLowerCase()}-${t}-out`,
    clock: fixedClock, ...f,
  };
  return { deps, ...f };
}
