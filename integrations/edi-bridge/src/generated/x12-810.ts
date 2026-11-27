/* GENERATED from contracts/edi-json/x12-810.schema.json by scripts/gen-types.mjs. Do not edit by hand. */

/**
 * X12 810 invoice as JSON. Amounts are decimal numbers; Sterling serializes them per X12 rules.
 */
export interface X12Transaction810 {
  isa: Isa;
  gs: Gs;
  st: St;
  body: {
    header: {
      /**
       * CCYYMMDD
       */
      invoiceDate: string;
      invoiceNumber: string;
      poNumber: string;
    };
    cur?: {
      currencyCode: string;
    };
    parties?: Party[];
    /**
     * @minItems 1
     */
    items: {
      assignedId: string;
      quantityInvoiced: number;
      uom: string;
      unitPrice: number;
      description?: string;
      /**
       * @minItems 1
       */
      products: Product[];
    }[];
    total: {
      amount: number;
    };
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
export interface Product {
  /**
   * Product ID qualifier, e.g. SK (supplier SKU), VP (vendor part), UP (UPC).
   */
  qualifier: string;
  id: string;
}
