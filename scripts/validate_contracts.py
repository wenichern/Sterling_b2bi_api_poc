#!/usr/bin/env python3
"""Validate schemas, examples, and partner manifests. Exit non-zero on any failure."""
import json, sys, pathlib
import yaml
from jsonschema import Draft202012Validator, FormatChecker

ROOT = pathlib.Path(__file__).resolve().parent.parent
errors = 0

def load(p):
    return json.loads(p.read_text())

def check_schema(p):
    global errors
    try:
        Draft202012Validator.check_schema(load(p))
        print(f"OK   schema   {p.relative_to(ROOT)}")
    except Exception as e:
        errors += 1
        print(f"FAIL schema   {p.relative_to(ROOT)}: {e}")

def validate(instance, schema_path, label):
    global errors
    v = Draft202012Validator(load(schema_path), format_checker=FormatChecker())
    errs = sorted(v.iter_errors(instance), key=lambda e: list(e.path))
    if errs:
        errors += 1
        print(f"FAIL {label}")
        for e in errs:
            print(f"       - {'/'.join(map(str, e.path))}: {e.message}")
    else:
        print(f"OK   {label}")

for p in list((ROOT / "contracts").rglob("*.schema.json")) + list((ROOT / "manifests/schema").glob("*.json")):
    check_schema(p)

validate(load(ROOT / "contracts/examples/order.example.json"), ROOT / "contracts/canonical/order.schema.json", "example order vs order.schema")
validate(load(ROOT / "contracts/examples/asn.example.json"), ROOT / "contracts/canonical/asn.schema.json", "example asn vs asn.schema")

for p in sorted((ROOT / "manifests/partners").glob("*.yaml")):
    validate(yaml.safe_load(p.read_text()), ROOT / "manifests/schema/partner.schema.json", f"manifest {p.name}")

for p in sorted((ROOT / "contracts/openapi").glob("*.yaml")):
    try:
        doc = yaml.safe_load(p.read_text())
        assert doc.get("openapi", "").startswith("3."), "missing openapi version"
        assert doc.get("paths"), "no paths"
        print(f"OK   openapi  {p.relative_to(ROOT)}")
    except Exception as e:
        errors += 1
        print(f"FAIL openapi  {p.relative_to(ROOT)}: {e}")

sys.exit(1 if errors else 0)
