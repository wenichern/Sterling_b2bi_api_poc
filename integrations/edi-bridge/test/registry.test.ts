import { describe, expect, it } from "vitest";
import { AdapterRegistry, createDefaultRegistry, UnsupportedTransactionSetError } from "../src/edi/adapters/registry";
import { Po850Adapter } from "../src/edi/adapters/inbound/po-850.adapter";
import { getPartnerContext } from "../src/edi/partners/profiles";
import { UnknownPartnerError } from "../src/edi/partners/partner-context";

describe("adapter registry", () => {
  it("registers the four default adapters", () => {
    const r = createDefaultRegistry();
    expect(r.listInbound()).toEqual(["820", "850"]);
    expect(r.listOutbound()).toEqual(["810", "856"]);
    expect(r.getInbound("850").transactionSet).toBe("850");
    expect(r.getOutbound("856").transactionSet).toBe("856");
  });

  it("throws a typed error for unsupported transaction sets", () => {
    const r = createDefaultRegistry();
    expect(() => r.getInbound("999")).toThrow(UnsupportedTransactionSetError);
    expect(() => r.getOutbound("850")).toThrow(UnsupportedTransactionSetError);
  });

  it("refuses duplicate registration", () => {
    const r = new AdapterRegistry().registerInbound(new Po850Adapter());
    expect(() => r.registerInbound(new Po850Adapter())).toThrow(/already registered/);
  });

  it("throws for an unknown partner profile", () => {
    expect(() => getPartnerContext("NOBODY")).toThrow(UnknownPartnerError);
  });
});
