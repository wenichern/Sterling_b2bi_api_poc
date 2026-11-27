/* GENERATED from contracts/edi-json/x12-820.schema.json by scripts/gen-types.mjs. Do not edit by hand. */

/**
 * Translated X12 820 payment order / remittance advice as JSON.
 */
export interface X12Transaction820 {
  isa: Isa;
  gs: Gs;
  st: St;
  body: {
    payment: {
      amount: number;
      /**
       * CCYYMMDD
       */
      paymentDate: string;
      /**
       * BPR04, e.g. ACH, CHK, FWT.
       */
      methodCode: string;
      currencyCode?: string;
    };
    trace: {
      referenceNumber: string;
    };
    parties?: Party[];
    /**
     * @minItems 1
     */
    remittances: {
      invoiceNumber: string;
      amountPaid: number;
      amountInvoiced?: number;
    }[];
  };
}
export interface Isa {
  senderQualifier: string;
  senderId: string;
  receiverQualifier: string;
  receiverId: string;
  controlNumber: string;
  usageIndicator?: "P" | "T" | "I";
}
export interface Gs {
  functionalId: string;
  senderCode: string;
  receiverCode: string;
  controlNumber: string;
  version: string;
}
export interface St {
  transactionSet: string;
  controlNumber: string;
}
export interface Party {
  /**
   * N101, e.g. ST ship-to, BT bill-to, SF ship-from.
   */
  entityCode: string;
  name: string;
  idQualifier?: string;
  id?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}
