import type { BaseEvent } from "../envelope";
import type { CanonicalRemittance } from "../../generated/canonical-remittance";

/** Matches contracts/events/remittance-received.v1.schema.json. */
export interface RemittanceReceivedEvent extends BaseEvent {
  eventType: "remittance.received.v1";
  docType: "820";
  remittanceId: string;
  remittance: CanonicalRemittance;
}
