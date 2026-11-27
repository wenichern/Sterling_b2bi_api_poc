import { describe, expect, it } from "vitest";
import { processInbound } from "../src/orchestration/inbound-pipeline";
import { processOutbound } from "../src/orchestration/outbound-pipeline";
import { UnsupportedTransactionSetError } from "../src/edi/adapters/registry";
import { UnknownPartnerError } from "../src/edi/partners/partner-context";
import { SCHEMA, validateSchema } from "../src/edi/schemas";
import { fx } from "./fixtures";
import { makeInbound, makeOutbound } from "./helpers/fakes";

const in850 = (x12: unknown = fx.x850()) => ({ partnerId: "ACME", transactionSet: "850", x12 });
const out856 = (canonical: unknown = fx.asn()) => ({ partnerId: "ACME", transactionSet: "856", canonical });

describe("inbound pipeline", () => {
  it("publishes a valid 850 with correlation, acknowledges, and emits business events", async () => {
    const t = makeInbound();
    const r = await processInbound(t.deps, { ...in850(), traceparent: "00-aaaa-bbbb-01" });
    expect(r.status).toBe("published");
    expect(t.publisher.published).toHaveLength(1);
    const msg = t.publisher.published[0]!;
    expect(msg.destination).toBe("orders-in");
    expect(validateSchema(SCHEMA.orderEvent, msg.body)).toEqual([]);
    expect(msg.props).toMatchObject({
      correlationId: "00000000-0000-4000-8000-000000000001", partnerId: "ACME", docType: "850",
      controlNumber: "000000101-101-0001", traceparent: "00-aaaa-bbbb-01",
    });
    expect(t.acknowledger.acks.map((a) => a.status)).toEqual(["accepted"]);
    expect(t.events.names).toEqual(["translated", "sent"]);
    expect(t.events.events[0]).toMatchObject({ poNumber: "PO-10001", bpName: "edi-bridge.inbound" });
    expect(t.idempotency.keys.has("ACME|850|000000101|101|0001")).toBe(true);
  });

  it("keeps a caller-supplied correlation id", async () => {
    const t = makeInbound();
    const r = await processInbound(t.deps, { ...in850(), correlationId: "11111111-1111-4111-8111-111111111111" });
    expect(r).toMatchObject({ status: "published", correlationId: "11111111-1111-4111-8111-111111111111" });
  });

  it("suppresses a retransmission but acknowledges it again", async () => {
    const t = makeInbound();
    await processInbound(t.deps, in850());
    const second = await processInbound(t.deps, in850());
    expect(second.status).toBe("duplicate");
    expect(t.publisher.published).toHaveLength(1);
    expect(t.acknowledger.acks.map((a) => a.status)).toEqual(["accepted", "accepted"]);
  });

  it("treats a different ST control number in the same interchange as a different document", async () => {
    const t = makeInbound();
    await processInbound(t.deps, in850());
    const other = fx.x850(); other.st.controlNumber = "0002";
    expect((await processInbound(t.deps, in850(other))).status).toBe("published");
    expect(t.publisher.published).toHaveLength(2);
  });

  it("rejects an invalid document: no publish, negative ack, failed event with codes only", async () => {
    const t = makeInbound();
    const bad = fx.x850(); delete bad.body.beg.poNumber; bad.body.beg.date = "SECRET-DATE";
    const r = await processInbound(t.deps, in850(bad));
    expect(r.status).toBe("rejected");
    expect(t.publisher.published).toHaveLength(0);
    expect(t.acknowledger.acks[0]?.status).toBe("rejected");
    const ev = t.events.events[0]!;
    expect(ev).toMatchObject({ eventName: "failed", errorCode: "VALIDATION" });
    expect(ev.errorSummary).toContain("SCHEMA");
    expect(JSON.stringify(ev)).not.toContain("SECRET-DATE");
    expect(t.idempotency.keys.size).toBe(0);
  });

  it("rejects a business-rule violation (wrong sender)", async () => {
    const t = makeInbound();
    const x = fx.x850(); x.isa.senderId = "IMPOSTOR";
    const r = await processInbound(t.deps, in850(x));
    expect(r.status).toBe("rejected");
    expect(r.status === "rejected" && r.issues.map((i) => i.code)).toContain("PARTNER_MISMATCH");
  });

  it("reports a publish failure as retryable, does not ack or mark seen, and succeeds on retry", async () => {
    const t = makeInbound();
    t.publisher.fail = true;
    const r = await processInbound(t.deps, in850());
    expect(r).toMatchObject({ status: "failed", retryable: true });
    expect(t.acknowledger.acks).toHaveLength(0);
    expect(t.idempotency.keys.size).toBe(0);
    expect(t.events.names).toEqual(["translated", "failed"]);
    t.publisher.fail = false;
    expect((await processInbound(t.deps, in850())).status).toBe("published");
  });

  it("still succeeds when the idempotency write fails, and says so", async () => {
    const t = makeInbound();
    t.idempotency.failPut = true;
    const r = await processInbound(t.deps, in850());
    expect(r).toMatchObject({ status: "published", warnings: ["IDEMPOTENCY_STORE_WRITE_FAILED"] });
  });

  it("is not broken by telemetry failures", async () => {
    const t = makeInbound();
    t.events.fail = true;
    expect((await processInbound(t.deps, in850())).status).toBe("published");
  });

  it("routes 820 to its own queue", async () => {
    const t = makeInbound();
    const r = await processInbound(t.deps, { partnerId: "ACME", transactionSet: "820", x12: fx.x820() });
    expect(r.status).toBe("published");
    expect(t.publisher.published[0]?.destination).toBe("remittances-in");
    expect(validateSchema(SCHEMA.remittanceEvent, t.publisher.published[0]?.body)).toEqual([]);
  });

  it("throws on unknown partner, unsupported transaction set, or missing destination", async () => {
    const t = makeInbound();
    await expect(processInbound(t.deps, { ...in850(), partnerId: "NOBODY" })).rejects.toThrow(UnknownPartnerError);
    await expect(processInbound(t.deps, { ...in850(), transactionSet: "999" })).rejects.toThrow(UnsupportedTransactionSetError);
    t.deps.destinations = {};
    await expect(processInbound(t.deps, in850())).rejects.toThrow(/No destination/);
  });
});

describe("outbound pipeline", () => {
  it("translates an ASN, allocates control numbers, and hands X12 JSON to Sterling", async () => {
    const t = makeOutbound();
    const r = await processOutbound(t.deps, out856());
    expect(r).toMatchObject({ status: "submitted", destination: "acme-856-out", controlNumbers: { isa: "000000001", gs: "1", st: "0001" } });
    const msg = t.publisher.published[0]!;
    expect(validateSchema(SCHEMA.x12_856, msg.body)).toEqual([]);
    expect(msg.props).toMatchObject({ correlationId: "7b1f6c52-3a4e-4d3b-9f0a-2c9d8a1e5b77", partnerId: "ACME", docType: "856" });
    expect(t.events.names).toEqual(["translated"]); // Sterling emits `sent` after the MDN
    expect(t.events.events[0]).toMatchObject({ poNumber: "PO-10001", bpName: "edi-bridge.outbound" });
  });

  it("sends the same shipment only once and does not burn another control number", async () => {
    const t = makeOutbound();
    await processOutbound(t.deps, out856());
    const second = await processOutbound(t.deps, out856());
    expect(second.status).toBe("duplicate");
    expect(t.publisher.published).toHaveLength(1);
    expect(t.allocator.n).toBe(1);
  });

  it("rejects an invalid ASN before allocating a control number", async () => {
    const t = makeOutbound();
    const bad = fx.asn(); bad.lines = [];
    const r = await processOutbound(t.deps, out856(bad));
    expect(r.status).toBe("rejected");
    expect(t.allocator.n).toBe(0);
    expect(t.events.events[0]).toMatchObject({ eventName: "failed", errorCode: "VALIDATION" });
  });

  it("reports handoff failure as retryable and allows a retry", async () => {
    const t = makeOutbound();
    t.publisher.fail = true;
    expect(await processOutbound(t.deps, out856())).toMatchObject({ status: "failed", retryable: true });
    expect(t.idempotency.keys.size).toBe(0);
    t.publisher.fail = false;
    expect((await processOutbound(t.deps, out856())).status).toBe("submitted");
  });

  it("rejects an invoice whose total does not match its lines", async () => {
    const t = makeOutbound();
    const inv = fx.invoice(); inv.totalAmount = 999;
    const r = await processOutbound(t.deps, { partnerId: "ACME", transactionSet: "810", canonical: inv });
    expect(r.status).toBe("rejected");
    expect(r.status === "rejected" && r.issues.map((i) => i.code)).toContain("TOTAL_MISMATCH");
  });

  it("submits a valid 810 to the partner's 810 queue", async () => {
    const t = makeOutbound();
    const r = await processOutbound(t.deps, { partnerId: "ACME", transactionSet: "810", canonical: fx.invoice() });
    expect(r).toMatchObject({ status: "submitted", destination: "acme-810-out" });
    expect(validateSchema(SCHEMA.x12_810, t.publisher.published[0]?.body)).toEqual([]);
  });

  it("handles a non-object payload without throwing", async () => {
    const t = makeOutbound();
    expect((await processOutbound(t.deps, out856(null))).status).toBe("rejected");
  });
});
