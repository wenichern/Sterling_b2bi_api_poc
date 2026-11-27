import type { PartnerContext } from "../partners/partner-context";
import type { ControlNumbers, OutboundMeta } from "../../canonical/envelope";
import type { Party, Product } from "../../generated/x12-850";
import type { Address } from "../../generated/canonical-order";

export type X12Party = Party;
export type X12Product = Product;

/** Recursively drop undefined values so optional fields are absent (schemas forbid extra/undefined). */
export function compact<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => compact(v)) as unknown as T;
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = compact(v);
    }
    return out as T;
  }
  return value;
}

export function must<T>(value: T | undefined | null, what: string): T {
  if (value === undefined || value === null) throw new Error(`Invariant violated (validate() first): ${what}`);
  return value;
}

/** CCYYMMDD -> YYYY-MM-DD */
export const toIsoDate = (d: string): string => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
/** YYYY-MM-DD -> CCYYMMDD */
export const toX12Date = (iso: string): string => iso.replaceAll("-", "");

export function isRealCcyymmdd(d: string): boolean {
  if (!/^[0-9]{8}$/.test(d)) return false;
  const y = Number(d.slice(0, 4)), m = Number(d.slice(4, 6)), day = Number(d.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === day;
}

export function isRealIsoDate(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && isRealCcyymmdd(toX12Date(iso));
}

export const DEFAULT_SKU_ORDER = ["SK", "VP", "UP"];

export function pickProduct(products: readonly X12Product[], ctx: PartnerContext): string | undefined {
  const order = ctx.overlay.skuQualifierOrder ?? DEFAULT_SKU_ORDER;
  for (const q of order) {
    const hit = products.find((p) => p.qualifier === q);
    if (hit) return hit.id;
  }
  return undefined;
}

export function mapUomIn(uom: string, ctx: PartnerContext): string {
  return ctx.overlay.uomMap?.[uom] ?? uom;
}

/** Canonical UOM -> partner UOM (reverse of uomMap). */
export function mapUomOut(uom: string, ctx: PartnerContext): string {
  const map = ctx.overlay.uomMap ?? {};
  const hit = Object.entries(map).find(([, canonical]) => canonical === uom);
  return hit ? hit[0] : uom;
}

export const findParty = (parties: readonly X12Party[] | undefined, entityCode: string): X12Party | undefined =>
  parties?.find((p) => p.entityCode === entityCode);

/** Returns an Address only when all required canonical fields are available. */
export function toAddress(p: X12Party | undefined, ctx: PartnerContext): Address | undefined {
  if (!p) return undefined;
  const country = p.country ?? ctx.overlay.defaultCountry;
  if (!p.line1 || !p.city || !country || !/^[A-Z]{2}$/.test(country)) return undefined;
  return compact({
    name: p.name, line1: p.line1, line2: p.line2, city: p.city,
    region: p.state, postalCode: p.postalCode, country,
  });
}

export function outboundEnvelope(ctx: PartnerContext, functionalId: string, transactionSet: string, meta: OutboundMeta) {
  const c: ControlNumbers = meta.controlNumbers;
  return {
    isa: {
      senderQualifier: ctx.isa.ourQualifier,
      senderId: ctx.isa.ourId,
      receiverQualifier: ctx.isa.partnerQualifier,
      receiverId: ctx.isa.partnerId,
      controlNumber: c.isa,
      usageIndicator: meta.usageIndicator ?? ("T" as const),
    },
    gs: {
      functionalId,
      senderCode: ctx.gs.ourCode,
      receiverCode: ctx.gs.partnerCode,
      controlNumber: c.gs,
      version: ctx.gs.version,
    },
    st: { transactionSet, controlNumber: c.st },
  };
}

/** Checks ISA sender/receiver on inbound documents against the partner profile. */
export function checkInboundParties(
  isa: { senderId: string; receiverId: string },
  ctx: PartnerContext,
): { code: string; path: string; message: string }[] {
  const errs = [];
  if (isa.senderId.trim() !== ctx.isa.partnerId)
    errs.push({ code: "PARTNER_MISMATCH", path: "/isa/senderId", message: "ISA sender does not match the partner profile" });
  if (isa.receiverId.trim() !== ctx.isa.ourId)
    errs.push({ code: "RECEIVER_MISMATCH", path: "/isa/receiverId", message: "ISA receiver is not our interchange id" });
  return errs;
}
