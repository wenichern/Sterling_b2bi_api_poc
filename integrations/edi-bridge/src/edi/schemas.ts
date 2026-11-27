import Ajv2020Module from "ajv/dist/2020";
import addFormatsModule from "ajv-formats";
import type { ErrorObject } from "ajv";
import { issue, type ValidationIssue } from "./validation";

import orderSchema from "@contracts/canonical/order.schema.json";
import asnSchema from "@contracts/canonical/asn.schema.json";
import remittanceSchema from "@contracts/canonical/remittance.schema.json";
import invoiceSchema from "@contracts/canonical/invoice.schema.json";
import orderEventSchema from "@contracts/events/order-received.v1.schema.json";
import remittanceEventSchema from "@contracts/events/remittance-received.v1.schema.json";
import x12Common from "@contracts/edi-json/x12-common.schema.json";
import x12_850 from "@contracts/edi-json/x12-850.schema.json";
import x12_856 from "@contracts/edi-json/x12-856.schema.json";
import x12_820 from "@contracts/edi-json/x12-820.schema.json";
import x12_810 from "@contracts/edi-json/x12-810.schema.json";

// CJS/ESM interop differs between runtimes (vitest, node, bundlers); accept either shape.
const Ajv2020 = ((Ajv2020Module as unknown as { default?: unknown }).default ?? Ajv2020Module) as typeof Ajv2020Module;
const addFormats = ((addFormatsModule as unknown as { default?: unknown }).default ?? addFormatsModule) as typeof addFormatsModule;

const base = "https://example.com/contracts";
export const SCHEMA = {
  order: `${base}/canonical/order.schema.json`,
  asn: `${base}/canonical/asn.schema.json`,
  remittance: `${base}/canonical/remittance.schema.json`,
  invoice: `${base}/canonical/invoice.schema.json`,
  orderEvent: `${base}/events/order-received.v1.schema.json`,
  remittanceEvent: `${base}/events/remittance-received.v1.schema.json`,
  x12_850: `${base}/edi-json/x12-850.schema.json`,
  x12_856: `${base}/edi-json/x12-856.schema.json`,
  x12_820: `${base}/edi-json/x12-820.schema.json`,
  x12_810: `${base}/edi-json/x12-810.schema.json`,
} as const;

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const s of [
  x12Common, orderSchema, asnSchema, remittanceSchema, invoiceSchema,
  orderEventSchema, remittanceEventSchema, x12_850, x12_856, x12_820, x12_810,
]) {
  ajv.addSchema(s as object);
}

function describe(e: ErrorObject): string {
  const p = e.params as Record<string, unknown>;
  if (e.keyword === "required") return `missing required property '${String(p.missingProperty)}'`;
  if (e.keyword === "additionalProperties") return `unexpected property '${String(p.additionalProperty)}'`;
  return e.message ?? "invalid";
}

/** Validate data against a contract schema. Returns [] when valid. Messages never echo field values. */
export function validateSchema(schemaId: string, data: unknown): ValidationIssue[] {
  const validate = ajv.getSchema(schemaId);
  if (!validate) throw new Error(`Schema not registered: ${schemaId}`);
  if (validate(data)) return [];
  return (validate.errors ?? []).map((e) => issue("SCHEMA", e.instancePath || "/", describe(e)));
}
