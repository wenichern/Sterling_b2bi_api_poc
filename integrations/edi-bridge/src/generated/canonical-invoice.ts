/* GENERATED from contracts/canonical/invoice.schema.json by scripts/gen-types.mjs. Do not edit by hand. */

/**
 * Canonical invoice used to generate outbound EDI 810.
 */
export interface CanonicalInvoice {
  schemaVersion: "1.0";
  partnerId: string;
  docType: "810";
  correlationId: string;
  invoiceNumber: string;
  invoiceDate: string;
  poNumber: string;
  currency: string;
  /**
   * @minItems 1
   */
  lines: {
    lineNumber: number;
    sku: string;
    description?: string;
    quantity: number;
    uom: string;
    unitPrice: number;
  }[];
  totalAmount: number;
}
