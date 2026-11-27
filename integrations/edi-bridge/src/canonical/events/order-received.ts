import type { BaseEvent } from "../envelope";
import type { CanonicalOrder } from "../../generated/canonical-order";

/** Matches contracts/events/order-received.v1.schema.json. */
export interface OrderReceivedEvent extends BaseEvent {
  eventType: "order.received.v1";
  docType: "850";
  poNumber: string;
  order: CanonicalOrder;
}
