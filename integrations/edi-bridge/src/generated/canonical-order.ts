/* GENERATED from contracts/canonical/order.schema.json by scripts/gen-types.mjs. Do not edit by hand. */

/**
 * Canonical purchase order produced from EDI 850 (or API). Internal format; EDI/XML only at the partner edge.
 */
export interface CanonicalOrder {
  schemaVersion: "1.0";
  partnerId: string;
  docType: "850";
  /**
   * EDI ISA/GS/ST control number; part of the idempotency key.
   */
  controlNumber: string;
  correlationId: string;
  poNumber: string;
  orderDate: string;
  requestedDeliveryDate?: string;
  currency?: string;
  shipTo?: Address;
  billTo?: Address;
  /**
   * @minItems 1
   */
  lines: Line[];
  /**
   * Claim-check Blob URI when the original payload exceeds 200 KB.
   */
  payloadRef?: string;
}
export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
}
export interface Line {
  lineNumber: number;
  sku: string;
  description?: string;
  quantity: number;
  /**
   * Unit of measure, e.g. EA, CS.
   */
  uom: string;
  unitPrice?: number;
}
