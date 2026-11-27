/* GENERATED from contracts/canonical/remittance.schema.json by scripts/gen-types.mjs. Do not edit by hand. */

/**
 * Canonical remittance advice produced from EDI 820.
 */
export interface CanonicalRemittance {
  schemaVersion: "1.0";
  partnerId: string;
  docType: "820";
  /**
   * Composite ISA-GS-ST control number.
   */
  controlNumber: string;
  correlationId: string;
  /**
   * Payment trace/reference number (TRN02).
   */
  remittanceId: string;
  paymentDate: string;
  paymentMethod: "ACH" | "CHECK" | "WIRE" | "OTHER";
  currency: string;
  totalAmount: number;
  /**
   * @minItems 1
   */
  payments: {
    invoiceNumber: string;
    amountPaid: number;
    amountInvoiced?: number;
  }[];
}
