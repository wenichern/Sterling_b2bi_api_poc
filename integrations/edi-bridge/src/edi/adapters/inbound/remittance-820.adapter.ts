import type { InboundAdapter } from "../contracts";
import type { ControlNumbers, InboundMeta } from "../../../canonical/envelope";
import { composeControlNumber } from "../../../canonical/envelope";
import type { RemittanceReceivedEvent } from "../../../canonical/events/remittance-received";
import type { CanonicalRemittance } from "../../../generated/canonical-remittance";
import type { X12Transaction820 } from "../../../generated/x12-820";
import type { PartnerContext } from "../../partners/partner-context";
import { SCHEMA, validateSchema } from "../../schemas";
import { issue, result, fail, type ValidationIssue, type ValidationResult } from "../../validation";
import { checkInboundParties, compact, isRealCcyymmdd, toIsoDate } from "../common";

const METHODS: Record<string, CanonicalRemittance["paymentMethod"]> = { ACH: "ACH", CHK: "CHECK", FWT: "WIRE" };
const round2 = (n: number): number => Math.round(n * 100) / 100;

export class Remittance820Adapter implements InboundAdapter<X12Transaction820, RemittanceReceivedEvent> {
  readonly transactionSet = "820";

  validate(input: unknown, ctx: PartnerContext): ValidationResult {
    const schemaIssues = validateSchema(SCHEMA.x12_820, input);
    if (schemaIssues.length > 0) return fail(schemaIssues);

    const x = input as X12Transaction820;
    const errors: ValidationIssue[] = [...checkInboundParties(x.isa, ctx)];
    const warnings: ValidationIssue[] = [];

    if (x.st.transactionSet !== "820") errors.push(issue("WRONG_TRANSACTION_SET", "/st/transactionSet", "Expected transaction set 820"));
    if (x.gs.functionalId !== "RA") errors.push(issue("WRONG_FUNCTIONAL_ID", "/gs/functionalId", "Expected functional id RA"));
    if (!isRealCcyymmdd(x.body.payment.paymentDate)) errors.push(issue("BAD_DATE", "/body/payment/paymentDate", "Not a real calendar date"));
    if (!(x.body.payment.currencyCode ?? ctx.overlay.defaultCurrency))
      errors.push(issue("CURRENCY_MISSING", "/body/payment/currencyCode", "No currency in document or partner profile"));

    const paid = round2(x.body.remittances.reduce((s, r) => s + r.amountPaid, 0));
    if (paid !== round2(x.body.payment.amount))
      warnings.push(issue("AMOUNT_MISMATCH", "/body/payment/amount", "Payment amount differs from the sum of remittance lines (adjustments?)"));
    if (!METHODS[x.body.payment.methodCode])
      warnings.push(issue("UNKNOWN_PAYMENT_METHOD", "/body/payment/methodCode", "Mapped to OTHER"));
    return result(errors, warnings);
  }

  controlNumbers(x: X12Transaction820): ControlNumbers {
    return { isa: x.isa.controlNumber, gs: x.gs.controlNumber, st: x.st.controlNumber };
  }

  toEvent(x: X12Transaction820, ctx: PartnerContext, meta: InboundMeta): RemittanceReceivedEvent {
    const controlNumber = composeControlNumber(this.controlNumbers(x));
    const remittance: CanonicalRemittance = compact({
      schemaVersion: "1.0" as const,
      partnerId: ctx.partnerId,
      docType: "820" as const,
      controlNumber,
      correlationId: meta.correlationId,
      remittanceId: x.body.trace.referenceNumber,
      paymentDate: toIsoDate(x.body.payment.paymentDate),
      paymentMethod: METHODS[x.body.payment.methodCode] ?? ("OTHER" as const),
      currency: (x.body.payment.currencyCode ?? ctx.overlay.defaultCurrency) as string,
      totalAmount: x.body.payment.amount,
      payments: x.body.remittances.map((r) => ({
        invoiceNumber: r.invoiceNumber,
        amountPaid: r.amountPaid,
        amountInvoiced: r.amountInvoiced,
      })),
    });
    return {
      eventType: "remittance.received.v1",
      eventTime: meta.receivedAt,
      correlationId: meta.correlationId,
      partnerId: ctx.partnerId,
      docType: "820",
      controlNumber,
      remittanceId: remittance.remittanceId,
      remittance,
    };
  }

  businessKeys(e: RemittanceReceivedEvent): Record<string, string> {
    return { "remittance.id": e.remittanceId };
  }
}
