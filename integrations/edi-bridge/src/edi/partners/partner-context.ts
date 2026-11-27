/** Code-level partner configuration. The partner definition itself stays in manifests/partners/*.yaml. */
export interface PartnerOverlay {
  /** Preferred product qualifiers when reading (first match wins); first entry is also used when writing. */
  skuQualifierOrder?: string[];
  /** Partner UOM code -> canonical UOM code (reversed when writing). */
  uomMap?: Record<string, string>;
  defaultCurrency?: string;
  defaultCountry?: string;
}

export interface PartnerContext {
  /** Matches manifest partner.id. */
  partnerId: string;
  name: string;
  isa: { ourQualifier: string; ourId: string; partnerQualifier: string; partnerId: string };
  gs: { ourCode: string; partnerCode: string; version: string };
  overlay: PartnerOverlay;
}

export class UnknownPartnerError extends Error {
  constructor(partnerId: string) {
    super(`No partner profile for '${partnerId}'`);
    this.name = "UnknownPartnerError";
  }
}
