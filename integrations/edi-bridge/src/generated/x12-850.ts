/* GENERATED from contracts/edi-json/x12-850.schema.json by scripts/gen-types.mjs. Do not edit by hand. */

/**
 * Translated X12 850 purchase order as JSON. Produced by Sterling's parse step; consumed by the 850 inbound adapter.
 */
export interface X12Transaction850 {
  isa: Isa;
  gs: Gs;
  st: St;
  body: {
    beg: {
      purposeCode: "00" | "05";
      poTypeCode?: string;
      poNumber: string;
      /**
       * CCYYMMDD
       */
      date: string;
    };
    cur?: {
      currencyCode: string;
    };
    dtm?: {
      /**
       * DTM01, e.g. 002 delivery requested.
       */
      qualifier: string;
      /**
       * CCYYMMDD
       */
      date: string;
    }[];
    parties?: Party[];
    /**
     * @minItems 1
     */
    po1: {
      assignedId: string;
      quantity: number;
      uom: string;
      unitPrice?: number;
      description?: string;
      /**
       * @minItems 1
       */
      products: Product[];
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
export interface Product {
  /**
   * Product ID qualifier, e.g. SK (supplier SKU), VP (vendor part), UP (UPC).
   */
  qualifier: string;
  id: string;
}
