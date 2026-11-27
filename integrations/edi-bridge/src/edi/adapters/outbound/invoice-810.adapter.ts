import type { OutboundAdapter } from "../contracts";
import type { OutboundMeta } from "../../../canonical/envelope";
import type { InvoiceIssued } from "../../../canonical/events/invoice-issued";
import type { X12Transaction810 } from "../../../generated/x12-810";
import type { PartnerContext } from "../../partners/partner-context";
import { SCHEMA, validateSchema } from "../../schemas";
import { issue, result, fail, type ValidationIssue, type ValidationResult } from "../../validation";
import { compact, isRealIsoDate, mapUomOut, outboundEnvelope, toX12Date, DEFAULT_SKU_ORDER } from "../common";

const TOLERANCE = 0.005;

export class Invoice810Adapter implements OutboundAdapter<InvoiceIssued, X12Transaction810> {
  readonly transactionSet = "810";

  validate(input: unknown, ctx: PartnerContext): ValidationResult {
    const schemaIssues = validateSchema(SCHEMA.invoice, input);
    if (schemaIssues.length > 0) return fail(schemaIssues);

    const inv = input as InvoiceIssued;
    const errors: ValidationIssue[] = [];
    if (inv.partnerId !== ctx.partnerId) errors.push(issue("PARTNER_MISMATCH", "/partnerId", "Invoice partner does not match target partner"));
    if (!isRealIsoDate(inv.invoiceDate)) errors.push(issue("BAD_DATE", "/invoiceDate", "Not a real calendar date"));
    const seen = new Set<number>();
    inv.lines.forEach((l, i) => {
      if (seen.has(l.lineNumber)) errors.push(issue("DUPLICATE_LINE", `/lines/${i}/lineNumber`, "Duplicate line number"));
      seen.add(l.lineNumber);
    });
    const sum = inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    if (Math.abs(sum - inv.totalAmount) > TOLERANCE)
      errors.push(issue("TOTAL_MISMATCH", "/totalAmount", "Total does not equal the sum of line amounts"));
    return result(errors);
  }

  businessKey(inv: InvoiceIssued): string {
    return inv.invoiceNumber;
  }

  businessKeys(inv: InvoiceIssued): Record<string, string> {
    return { "po.number": inv.poNumber, "invoice.number": inv.invoiceNumber };
  }

  toX12(inv: InvoiceIssued, ctx: PartnerContext, meta: OutboundMeta): X12Transaction810 {
    const qualifier = ctx.overlay.skuQualifierOrder?.[0] ?? DEFAULT_SKU_ORDER[0] ?? "SK";
    return compact({
      ...outboundEnvelope(ctx, "IN", "810", meta),
      body: {
        header: { invoiceDate: toX12Date(inv.invoiceDate), invoiceNumber: inv.invoiceNumber, poNumber: inv.poNumber },
        cur: { currencyCode: inv.currency },
        items: inv.lines.map((l) => ({
          assignedId: String(l.lineNumber),
          quantityInvoiced: l.quantity,
          uom: mapUomOut(l.uom, ctx),
          unitPrice: l.unitPrice,
          description: l.description,
          products: [{ qualifier, id: l.sku }],
        })),
        total: { amount: inv.totalAmount },
      },
    });
  }
}
