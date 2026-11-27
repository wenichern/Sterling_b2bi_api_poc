import x850 from "@contracts/examples/edi-json/x12-850.example.json";
import x856 from "@contracts/examples/edi-json/x12-856.example.json";
import x820 from "@contracts/examples/edi-json/x12-820.example.json";
import x810 from "@contracts/examples/edi-json/x12-810.example.json";
import order from "@contracts/examples/order.example.json";
import asn from "@contracts/examples/asn.example.json";
import remittance from "@contracts/examples/remittance.example.json";
import invoice from "@contracts/examples/invoice.example.json";

// Fresh deep copy per call so tests can mutate freely.
const clone = <T>(v: T): T => structuredClone(v);
export const fx = {
  x850: () => clone(x850) as any, x856: () => clone(x856) as any,
  x820: () => clone(x820) as any, x810: () => clone(x810) as any,
  order: () => clone(order) as any, asn: () => clone(asn) as any,
  remittance: () => clone(remittance) as any, invoice: () => clone(invoice) as any,
};
