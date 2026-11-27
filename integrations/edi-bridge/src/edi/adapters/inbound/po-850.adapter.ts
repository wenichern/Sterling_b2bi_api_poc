import type { InboundAdapter } from "../contracts";
import type { ControlNumbers, InboundMeta } from "../../../canonical/envelope";
import { composeControlNumber } from "../../../canonical/envelope";
import type { OrderReceivedEvent } from "../../../canonical/events/order-received";
import type { CanonicalOrder } from "../../../generated/canonical-order";
import type { X12Transaction850 } from "../../../generated/x12-850";
import type { PartnerContext } from "../../partners/partner-context";
import { SCHEMA, validateSchema } from "../../schemas";
import { issue, result, type ValidationIssue, type ValidationResult, fail } from "../../validation";
import {
  checkInboundParties, compact, findParty, isRealCcyymmdd, mapUomIn, must, pickProduct, toAddress, toIsoDate,
} from "../common";

const DTM_DELIVERY_REQUESTED = "002";

export class Po850Adapter implements InboundAdapter<X12Transaction850, OrderReceivedEvent> {
  readonly transactionSet = "850";

  validate(input: unknown, ctx: PartnerContext): ValidationResult {
    const schemaIssues = validateSchema(SCHEMA.x12_850, input);
    if (schemaIssues.length > 0) return fail(schemaIssues);

    const x = input as X12Transaction850;
    const errors: ValidationIssue[] = [...checkInboundParties(x.isa, ctx)];
    const warnings: ValidationIssue[] = [];

    if (x.st.transactionSet !== "850") errors.push(issue("WRONG_TRANSACTION_SET", "/st/transactionSet", "Expected transaction set 850"));
    if (x.gs.functionalId !== "PO") errors.push(issue("WRONG_FUNCTIONAL_ID", "/gs/functionalId", "Expected functional id PO"));
    if (!isRealCcyymmdd(x.body.beg.date)) errors.push(issue("BAD_DATE", "/body/beg/date", "Not a real calendar date"));
    x.body.dtm?.forEach((d, i) => {
      if (!isRealCcyymmdd(d.date)) errors.push(issue("BAD_DATE", `/body/dtm/${i}/date`, "Not a real calendar date"));
    });

    const seen = new Set<number>();
    x.body.po1.forEach((line, i) => {
      const n = Number(line.assignedId);
      if (!Number.isInteger(n) || n < 1) errors.push(issue("BAD_LINE_NUMBER", `/body/po1/${i}/assignedId`, "Line number must be a positive integer"));
      else if (seen.has(n)) errors.push(issue("DUPLICATE_LINE", `/body/po1/${i}/assignedId`, "Duplicate line number"));
      else seen.add(n);
      if (pickProduct(line.products, ctx) === undefined)
        errors.push(issue("NO_PRODUCT_ID", `/body/po1/${i}/products`, "No product id with an accepted qualifier"));
    });

    if (!x.body.cur && !ctx.overlay.defaultCurrency)
      warnings.push(issue("CURRENCY_MISSING", "/body/cur", "No currency in document or partner profile"));
    for (const code of ["ST", "BT"]) {
      const p = findParty(x.body.parties, code);
      if (p && !toAddress(p, ctx)) warnings.push(issue("ADDRESS_INCOMPLETE", "/body/parties", `${code} address incomplete; omitted from canonical order`));
    }
    return result(errors, warnings);
  }

  controlNumbers(x: X12Transaction850): ControlNumbers {
    return { isa: x.isa.controlNumber, gs: x.gs.controlNumber, st: x.st.controlNumber };
  }

  toEvent(x: X12Transaction850, ctx: PartnerContext, meta: InboundMeta): OrderReceivedEvent {
    const controlNumber = composeControlNumber(this.controlNumbers(x));
    const requested = x.body.dtm?.find((d) => d.qualifier === DTM_DELIVERY_REQUESTED)?.date;

    const order: CanonicalOrder = compact({
      schemaVersion: "1.0" as const,
      partnerId: ctx.partnerId,
      docType: "850" as const,
      controlNumber,
      correlationId: meta.correlationId,
      poNumber: x.body.beg.poNumber,
      orderDate: toIsoDate(x.body.beg.date),
      requestedDeliveryDate: requested ? toIsoDate(requested) : undefined,
      currency: x.body.cur?.currencyCode ?? ctx.overlay.defaultCurrency,
      shipTo: toAddress(findParty(x.body.parties, "ST"), ctx),
      billTo: toAddress(findParty(x.body.parties, "BT"), ctx),
      lines: x.body.po1.map((l) => ({
        lineNumber: Number(l.assignedId),
        sku: must(pickProduct(l.products, ctx), "product id"),
        description: l.description,
        quantity: l.quantity,
        uom: mapUomIn(l.uom, ctx),
        unitPrice: l.unitPrice,
      })),
    });

    return {
      eventType: "order.received.v1",
      eventTime: meta.receivedAt,
      correlationId: meta.correlationId,
      partnerId: ctx.partnerId,
      docType: "850",
      controlNumber,
      poNumber: order.poNumber,
      order,
    };
  }

  businessKeys(e: OrderReceivedEvent): Record<string, string> {
    return { "po.number": e.poNumber };
  }
}
