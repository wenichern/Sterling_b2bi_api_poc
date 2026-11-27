import type { BaseEvent } from "../../canonical/envelope";
import type { InboundAdapter, OutboundAdapter } from "./contracts";
import { Po850Adapter } from "./inbound/po-850.adapter";
import { Remittance820Adapter } from "./inbound/remittance-820.adapter";
import { Asn856Adapter } from "./outbound/asn-856.adapter";
import { Invoice810Adapter } from "./outbound/invoice-810.adapter";

export class UnsupportedTransactionSetError extends Error {
  constructor(direction: "inbound" | "outbound", transactionSet: string) {
    super(`No ${direction} adapter registered for transaction set '${transactionSet}'`);
    this.name = "UnsupportedTransactionSetError";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyInbound = InboundAdapter<any, BaseEvent>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOutbound = OutboundAdapter<any, unknown>;

/** Maps transaction set -> adapter. Adding a document type = write an adapter and register it here. */
export class AdapterRegistry {
  private readonly inbound = new Map<string, AnyInbound>();
  private readonly outbound = new Map<string, AnyOutbound>();

  registerInbound(adapter: AnyInbound): this {
    if (this.inbound.has(adapter.transactionSet)) throw new Error(`Inbound ${adapter.transactionSet} already registered`);
    this.inbound.set(adapter.transactionSet, adapter);
    return this;
  }

  registerOutbound(adapter: AnyOutbound): this {
    if (this.outbound.has(adapter.transactionSet)) throw new Error(`Outbound ${adapter.transactionSet} already registered`);
    this.outbound.set(adapter.transactionSet, adapter);
    return this;
  }

  getInbound(transactionSet: string): AnyInbound {
    const a = this.inbound.get(transactionSet);
    if (!a) throw new UnsupportedTransactionSetError("inbound", transactionSet);
    return a;
  }

  getOutbound(transactionSet: string): AnyOutbound {
    const a = this.outbound.get(transactionSet);
    if (!a) throw new UnsupportedTransactionSetError("outbound", transactionSet);
    return a;
  }

  listInbound(): string[] { return [...this.inbound.keys()].sort(); }
  listOutbound(): string[] { return [...this.outbound.keys()].sort(); }
}

export function createDefaultRegistry(): AdapterRegistry {
  return new AdapterRegistry()
    .registerInbound(new Po850Adapter())
    .registerInbound(new Remittance820Adapter())
    .registerOutbound(new Asn856Adapter())
    .registerOutbound(new Invoice810Adapter());
}
