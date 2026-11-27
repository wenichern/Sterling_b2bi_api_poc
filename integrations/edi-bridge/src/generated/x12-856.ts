/* GENERATED from contracts/edi-json/x12-856.schema.json by scripts/gen-types.mjs. Do not edit by hand. */

/**
 * X12 856 ship notice as JSON. Produced by the 856 outbound adapter; Sterling serializes it to EDI (including HL hierarchy numbering).
 */
export interface X12Transaction856 {
  isa: Isa;
  gs: Gs;
  st: St;
  body: {
    bsn: {
      purposeCode: "00";
      shipmentId: string;
      /**
       * CCYYMMDD
       */
      date: string;
    };
    carrier?: {
      name?: string;
      scac?: string;
    };
    references?: {
      /**
       * REF01, e.g. CN carrier PRO/tracking.
       */
      qualifier: string;
      value: string;
    }[];
    poNumber: string;
    parties?: Party[];
    /**
     * @minItems 1
     */
    items: {
      lineNumber: number;
      quantityShipped: number;
      uom: string;
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
