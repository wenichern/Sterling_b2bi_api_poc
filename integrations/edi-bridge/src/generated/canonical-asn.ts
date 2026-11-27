/* GENERATED from contracts/canonical/asn.schema.json by scripts/gen-types.mjs. Do not edit by hand. */

/**
 * Canonical ASN used to generate outbound EDI 856.
 */
export interface CanonicalAdvanceShipNotice {
  schemaVersion: "1.0";
  partnerId: string;
  docType: "856";
  correlationId: string;
  poNumber: string;
  shipmentId: string;
  shipDate: string;
  carrier?: string;
  trackingNumber?: string;
  /**
   * @minItems 1
   */
  lines: {
    lineNumber: number;
    sku: string;
    quantityShipped: number;
    uom: string;
  }[];
}
