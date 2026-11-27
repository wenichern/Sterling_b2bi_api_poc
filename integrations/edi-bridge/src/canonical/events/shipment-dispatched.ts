import type { CanonicalAdvanceShipNotice } from "../../generated/canonical-asn";

/** Outbound canonical input for the 856 adapter (an ASN). Pub/sub event wrapper comes with Pattern 3. */
export type ShipmentDispatched = CanonicalAdvanceShipNotice;
