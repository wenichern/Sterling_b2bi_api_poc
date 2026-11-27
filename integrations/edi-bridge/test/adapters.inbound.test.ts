import { describe, expect, it } from "vitest";
import { Po850Adapter } from "../src/edi/adapters/inbound/po-850.adapter";
import { Remittance820Adapter } from "../src/edi/adapters/inbound/remittance-820.adapter";
import { getPartnerContext } from "../src/edi/partners/profiles";
import { SCHEMA, validateSchema } from "../src/edi/schemas";
import { fx } from "./fixtures";

const ctx = getPartnerContext("ACME");
const meta = { correlationId: "7b1f6c52-3a4e-4d3b-9f0a-2c9d8a1e5b77", receivedAt: "2026-11-25T14:00:00.000Z" };
const codes = (r: { errors: { code: string }[] }) => r.errors.map((e) => e.code);

describe("850 inbound adapter", () => {
  const a = new Po850Adapter();

  it("accepts the example document", () => {
    const r = a.validate(fx.x850(), ctx);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("maps X12 JSON to the canonical order and a schema-valid event", () => {
    const evt = a.toEvent(fx.x850(), ctx, meta);
    expect(validateSchema(SCHEMA.orderEvent, evt)).toEqual([]);
    expect(evt.controlNumber).toBe("000000101-101-0001");
    expect(evt.order).toEqual({ ...fx.order(), controlNumber: "000000101-101-0001" });
  });

  it("applies partner overlays (qualifier preference, UOM map)", () => {
    const evt = a.toEvent(fx.x850(), ctx, meta);
    expect(evt.order.lines[1]).toMatchObject({ sku: "SKU-002", uom: "CS" }); // CA -> CS
    const reordered = { ...ctx, overlay: { ...ctx.overlay, skuQualifierOrder: ["SK", "VP"] } };
    const x = fx.x850();
    x.body.po1[0].products = [{ qualifier: "VP", id: "VENDOR-1" }, { qualifier: "SK", id: "SUPPLIER-1" }];
    expect(a.toEvent(x, ctx, meta).order.lines[0]?.sku).toBe("VENDOR-1");
    expect(a.toEvent(x, reordered, meta).order.lines[0]?.sku).toBe("SUPPLIER-1");
  });

  it("exposes control numbers and business keys", () => {
    const x = fx.x850();
    expect(a.controlNumbers(x)).toEqual({ isa: "000000101", gs: "101", st: "0001" });
    expect(a.businessKeys(a.toEvent(x, ctx, meta))).toEqual({ "po.number": "PO-10001" });
  });

  it("rejects schema violations without throwing", () => {
    const x = fx.x850();
    delete x.body.beg;
    const r = a.validate(x, ctx);
    expect(r.valid).toBe(false);
    expect(codes(r)).toContain("SCHEMA");
    expect(a.validate(null, ctx).valid).toBe(false);
    expect(a.validate("garbage", ctx).valid).toBe(false);
  });

  it("rejects a document from the wrong sender or to the wrong receiver", () => {
    const x = fx.x850(); x.isa.senderId = "SOMEONEELSE";
    expect(codes(a.validate(x, ctx))).toContain("PARTNER_MISMATCH");
    const y = fx.x850(); y.isa.receiverId = "NOTUS";
    expect(codes(a.validate(y, ctx))).toContain("RECEIVER_MISMATCH");
  });

  it("rejects wrong transaction set / functional id", () => {
    const x = fx.x850(); x.st.transactionSet = "856"; x.gs.functionalId = "SH";
    expect(codes(a.validate(x, ctx))).toEqual(expect.arrayContaining(["WRONG_TRANSACTION_SET", "WRONG_FUNCTIONAL_ID"]));
  });

  it("rejects impossible dates, bad and duplicate line numbers, and missing product ids", () => {
    const x = fx.x850();
    x.body.beg.date = "20261340";
    x.body.po1[0].assignedId = "ABC";
    x.body.po1[1].assignedId = "1";
    x.body.po1.push({ assignedId: "1", quantity: 1, uom: "EA", products: [{ qualifier: "XX", id: "Z" }] });
    expect(codes(a.validate(x, ctx))).toEqual(expect.arrayContaining(["BAD_DATE", "BAD_LINE_NUMBER", "NO_PRODUCT_ID"]));
    const y = fx.x850(); y.body.po1[1].assignedId = "1";
    expect(codes(a.validate(y, ctx))).toContain("DUPLICATE_LINE");
  });

  it("warns (not fails) on an incomplete address and omits it from the canonical order", () => {
    const x = fx.x850();
    delete x.body.parties[0].line1;
    const r = a.validate(x, ctx);
    expect(r.valid).toBe(true);
    expect(r.warnings.map((w) => w.code)).toContain("ADDRESS_INCOMPLETE");
    expect(a.toEvent(x, ctx, meta).order.shipTo).toBeUndefined();
  });

  it("falls back to the profile default currency", () => {
    const x = fx.x850(); delete x.body.cur;
    expect(a.toEvent(x, ctx, meta).order.currency).toBe("USD");
  });
});

describe("820 inbound adapter", () => {
  const a = new Remittance820Adapter();
  const m = { ...meta, correlationId: "0d6c3b7e-5a21-4a8e-9a0d-5f2b6c1d9e11" };

  it("accepts the example and maps to the canonical remittance", () => {
    expect(a.validate(fx.x820(), ctx).valid).toBe(true);
    const evt = a.toEvent(fx.x820(), ctx, m);
    expect(validateSchema(SCHEMA.remittanceEvent, evt)).toEqual([]);
    expect(evt.remittance).toEqual(fx.remittance());
    expect(a.businessKeys(evt)).toEqual({ "remittance.id": "TRN-778899" });
  });

  it("warns when the payment amount differs from the remittance lines", () => {
    const x = fx.x820(); x.body.payment.amount = 299;
    const r = a.validate(x, ctx);
    expect(r.valid).toBe(true);
    expect(r.warnings.map((w) => w.code)).toContain("AMOUNT_MISMATCH");
  });

  it("maps an unknown payment method to OTHER with a warning", () => {
    const x = fx.x820(); x.body.payment.methodCode = "BOP";
    expect(a.validate(x, ctx).warnings.map((w) => w.code)).toContain("UNKNOWN_PAYMENT_METHOD");
    expect(a.toEvent(x, ctx, m).remittance.paymentMethod).toBe("OTHER");
  });

  it("maps CHK to CHECK and FWT to WIRE", () => {
    const c = fx.x820(); c.body.payment.methodCode = "CHK";
    const w = fx.x820(); w.body.payment.methodCode = "FWT";
    expect(a.toEvent(c, ctx, m).remittance.paymentMethod).toBe("CHECK");
    expect(a.toEvent(w, ctx, m).remittance.paymentMethod).toBe("WIRE");
  });

  it("rejects wrong sender and impossible dates", () => {
    const x = fx.x820(); x.isa.senderId = "OTHER"; x.body.payment.paymentDate = "20261399";
    expect(codes(a.validate(x, ctx))).toEqual(expect.arrayContaining(["PARTNER_MISMATCH", "BAD_DATE"]));
  });

  it("requires a currency from the document or the profile", () => {
    const x = fx.x820(); delete x.body.payment.currencyCode;
    expect(a.validate(x, ctx).valid).toBe(true); // profile default USD
    const noDefault = { ...ctx, overlay: { ...ctx.overlay, defaultCurrency: undefined } };
    expect(codes(a.validate(x, noDefault))).toContain("CURRENCY_MISSING");
  });
});
