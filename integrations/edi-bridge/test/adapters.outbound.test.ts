import { describe, expect, it } from "vitest";
import { Asn856Adapter } from "../src/edi/adapters/outbound/asn-856.adapter";
import { Invoice810Adapter } from "../src/edi/adapters/outbound/invoice-810.adapter";
import { getPartnerContext } from "../src/edi/partners/profiles";
import { SCHEMA, validateSchema } from "../src/edi/schemas";
import { fx } from "./fixtures";

const ctx = getPartnerContext("ACME");
const codes = (r: { errors: { code: string }[] }) => r.errors.map((e) => e.code);

describe("856 outbound adapter", () => {
  const a = new Asn856Adapter();

  it("accepts the example ASN", () => expect(a.validate(fx.asn(), ctx).valid).toBe(true));

  it("produces the documented X12 JSON and it validates against the contract", () => {
    const x = a.toX12(fx.asn(), ctx, { controlNumbers: { isa: "000000201", gs: "201", st: "0001" } });
    expect(x).toEqual(fx.x856());
    expect(validateSchema(SCHEMA.x12_856, x)).toEqual([]);
  });

  it("defaults to the TEST usage indicator and honours P", () => {
    const cn = { isa: "000000001", gs: "1", st: "0001" };
    expect(a.toX12(fx.asn(), ctx, { controlNumbers: cn }).isa.usageIndicator).toBe("T");
    expect(a.toX12(fx.asn(), ctx, { controlNumbers: cn, usageIndicator: "P" }).isa.usageIndicator).toBe("P");
  });

  it("reverses the UOM map and omits optional blocks", () => {
    const asn = fx.asn(); asn.lines[0].uom = "CS"; delete asn.carrier; delete asn.trackingNumber;
    const x = a.toX12(asn, ctx, { controlNumbers: { isa: "000000001", gs: "1", st: "0001" } });
    expect(x.body.items[0]?.uom).toBe("CA"); // canonical CS -> partner CA
    expect(x.body.carrier).toBeUndefined();
    expect(x.body.references).toBeUndefined();
    expect(validateSchema(SCHEMA.x12_856, x)).toEqual([]);
  });

  it("rejects an empty or invalid ASN, a wrong partner, and duplicate lines", () => {
    const empty = fx.asn(); empty.lines = [];
    expect(a.validate(empty, ctx).valid).toBe(false);
    const other = fx.asn(); other.partnerId = "GLOBEX";
    expect(codes(a.validate(other, ctx))).toContain("PARTNER_MISMATCH");
    const dup = fx.asn(); dup.lines.push({ ...dup.lines[0] });
    expect(codes(a.validate(dup, ctx))).toContain("DUPLICATE_LINE");
    // An impossible calendar date is already caught by the schema's `format: date`.
    const badDate = fx.asn(); badDate.shipDate = "2026-02-30";
    expect(codes(a.validate(badDate, ctx))).toContain("SCHEMA");
  });

  it("business key is the shipment id", () => {
    expect(a.businessKey(fx.asn())).toBe("SHP-5001");
    expect(a.businessKeys(fx.asn())).toEqual({ "po.number": "PO-10001", "shipment.id": "SHP-5001" });
  });
});

describe("810 outbound adapter", () => {
  const a = new Invoice810Adapter();

  it("accepts the example invoice and produces the documented X12 JSON", () => {
    expect(a.validate(fx.invoice(), ctx).valid).toBe(true);
    const x = a.toX12(fx.invoice(), ctx, { controlNumbers: { isa: "000000401", gs: "401", st: "0001" } });
    expect(x).toEqual(fx.x810());
    expect(validateSchema(SCHEMA.x12_810, x)).toEqual([]);
  });

  it("rejects a total that does not match the lines", () => {
    const inv = fx.invoice(); inv.totalAmount = 251;
    expect(codes(a.validate(inv, ctx))).toContain("TOTAL_MISMATCH");
  });

  it("tolerates sub-cent rounding in the total", () => {
    const inv = fx.invoice(); inv.lines[0].unitPrice = 2.333; inv.lines[0].quantity = 3; inv.totalAmount = 7;
    expect(a.validate(inv, ctx).valid).toBe(true);
  });

  it("rejects a wrong partner", () => {
    const inv = fx.invoice(); inv.partnerId = "OTHER";
    expect(codes(a.validate(inv, ctx))).toContain("PARTNER_MISMATCH");
  });

  it("rejects an impossible invoice date (caught by the schema's format: date)", () => {
    const inv = fx.invoice(); inv.invoiceDate = "2026-13-01";
    expect(codes(a.validate(inv, ctx))).toContain("SCHEMA");
  });

  it("business key is the invoice number", () => expect(a.businessKey(fx.invoice())).toBe("INV-9001"));
});
