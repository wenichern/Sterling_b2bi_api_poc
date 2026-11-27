import type { OutboundAdapter } from "../contracts";
import type { OutboundMeta } from "../../../canonical/envelope";
import type { ShipmentDispatched } from "../../../canonical/events/shipment-dispatched";
import type { X12Transaction856 } from "../../../generated/x12-856";
import type { PartnerContext } from "../../partners/partner-context";
import { SCHEMA, validateSchema } from "../../schemas";
import { issue, result, fail, type ValidationIssue, type ValidationResult } from "../../validation";
import { compact, isRealIsoDate, mapUomOut, outboundEnvelope, toX12Date, DEFAULT_SKU_ORDER } from "../common";

export class Asn856Adapter implements OutboundAdapter<ShipmentDispatched, X12Transaction856> {
  readonly transactionSet = "856";

  validate(input: unknown, ctx: PartnerContext): ValidationResult {
    const schemaIssues = validateSchema(SCHEMA.asn, input);
    if (schemaIssues.length > 0) return fail(schemaIssues);

    const asn = input as ShipmentDispatched;
    const errors: ValidationIssue[] = [];
    if (asn.partnerId !== ctx.partnerId) errors.push(issue("PARTNER_MISMATCH", "/partnerId", "ASN partner does not match target partner"));
    if (!isRealIsoDate(asn.shipDate)) errors.push(issue("BAD_DATE", "/shipDate", "Not a real calendar date"));
    const seen = new Set<number>();
    asn.lines.forEach((l, i) => {
      if (seen.has(l.lineNumber)) errors.push(issue("DUPLICATE_LINE", `/lines/${i}/lineNumber`, "Duplicate line number"));
      seen.add(l.lineNumber);
    });
    return result(errors);
  }

  businessKey(asn: ShipmentDispatched): string {
    return asn.shipmentId;
  }

  businessKeys(asn: ShipmentDispatched): Record<string, string> {
    return { "po.number": asn.poNumber, "shipment.id": asn.shipmentId };
  }

  toX12(asn: ShipmentDispatched, ctx: PartnerContext, meta: OutboundMeta): X12Transaction856 {
    const qualifier = ctx.overlay.skuQualifierOrder?.[0] ?? DEFAULT_SKU_ORDER[0] ?? "SK";
    return compact({
      ...outboundEnvelope(ctx, "SH", "856", meta),
      body: {
        bsn: { purposeCode: "00" as const, shipmentId: asn.shipmentId, date: toX12Date(asn.shipDate) },
        carrier: asn.carrier ? { name: asn.carrier } : undefined,
        references: asn.trackingNumber ? [{ qualifier: "CN", value: asn.trackingNumber }] : undefined,
        poNumber: asn.poNumber,
        items: asn.lines.map((l) => ({
          lineNumber: l.lineNumber,
          quantityShipped: l.quantityShipped,
          uom: mapUomOut(l.uom, ctx),
          products: [{ qualifier, id: l.sku }],
        })),
      },
    });
  }
}
