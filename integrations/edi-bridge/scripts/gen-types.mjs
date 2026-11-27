// Generates TypeScript types from the JSON Schemas in /contracts so the schemas stay the single source of truth.
// Usage: npm run gen:types   (commit the output in src/generated/)
import { compile } from "json-schema-to-typescript";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/generated");

const targets = [
  ["contracts/canonical/order.schema.json", "canonical-order"],
  ["contracts/canonical/asn.schema.json", "canonical-asn"],
  ["contracts/canonical/remittance.schema.json", "canonical-remittance"],
  ["contracts/canonical/invoice.schema.json", "canonical-invoice"],
  ["contracts/edi-json/x12-850.schema.json", "x12-850"],
  ["contracts/edi-json/x12-856.schema.json", "x12-856"],
  ["contracts/edi-json/x12-820.schema.json", "x12-820"],
  ["contracts/edi-json/x12-810.schema.json", "x12-810"],
];

await mkdir(outDir, { recursive: true });
for (const [rel, name] of targets) {
  const file = path.join(root, rel);
  const schema = JSON.parse(await readFile(file, "utf8"));
  delete schema.$id; // let relative $refs resolve against the file path
  const ts = await compile(schema, schema.title ?? name, {
    cwd: path.dirname(file) + path.sep,
    additionalProperties: false,
    ignoreMinAndMaxItems: true,
    bannerComment: `/* GENERATED from ${rel} by scripts/gen-types.mjs. Do not edit by hand. */`,
    style: { singleQuote: false },
  });
  await writeFile(path.join(outDir, `${name}.ts`), ts);
  console.log("generated", name);
}
