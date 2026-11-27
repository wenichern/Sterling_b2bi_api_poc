import { describe, expect, it } from "vitest";
import { SCHEMA, validateSchema } from "../src/edi/schemas";
import { composeControlNumber, inboundKey, outboundKey } from "../src/canonical/envelope";
import { fx } from "./fixtures";

describe("contract fixtures validate against their schemas", () => {
  it.each([
    ["x12-850", SCHEMA.x12_850, fx.x850],
    ["x12-856", SCHEMA.x12_856, fx.x856],
    ["x12-820", SCHEMA.x12_820, fx.x820],
    ["x12-810", SCHEMA.x12_810, fx.x810],
    ["order", SCHEMA.order, fx.order],
    ["asn", SCHEMA.asn, fx.asn],
    ["remittance", SCHEMA.remittance, fx.remittance],
    ["invoice", SCHEMA.invoice, fx.invoice],
  ])("%s example is valid", (_n, id, make) => {
    expect(validateSchema(id, make())).toEqual([]);
  });

  it("schema validation can fail (not vacuous)", () => {
    const bad = fx.x850();
    delete bad.body.beg.poNumber;
    const issues = validateSchema(SCHEMA.x12_850, bad);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.message).toContain("poNumber");
  });

  it("issue messages do not echo field values", () => {
    const bad = fx.x850();
    bad.body.beg.date = "SECRET-VALUE";
    const text = JSON.stringify(validateSchema(SCHEMA.x12_850, bad));
    expect(text).not.toContain("SECRET-VALUE");
  });
});

describe("control numbers and idempotency keys", () => {
  const c = { isa: "000000101", gs: "101", st: "0001" };
  it("composes ISA-GS-ST", () => expect(composeControlNumber(c)).toBe("000000101-101-0001"));
  it("inbound key uses all three levels", () => {
    expect(inboundKey("ACME", "850", c)).toBe("ACME|850|000000101|101|0001");
    expect(inboundKey("ACME", "850", { ...c, st: "0002" })).not.toBe(inboundKey("ACME", "850", c));
  });
  it("outbound key uses the business key", () => expect(outboundKey("ACME", "856", "SHP-1")).toBe("ACME|856|out|SHP-1"));
});
