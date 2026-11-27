import acme from "./ACME.json";
import { UnknownPartnerError, type PartnerContext } from "../partner-context";

// Add one JSON file per EDI partner (ISA/GS identifiers are placeholders until confirmed with the partner).
const profiles: Record<string, PartnerContext> = {
  [acme.partnerId]: acme as PartnerContext,
};

export function getPartnerContext(partnerId: string): PartnerContext {
  const ctx = profiles[partnerId];
  if (!ctx) throw new UnknownPartnerError(partnerId);
  return ctx;
}
