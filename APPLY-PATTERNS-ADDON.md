# Applying the patterns add-on to your existing repo

1. Unzip the add-on at the root of your repo (it only adds new files).
2. Optional edits to existing files:
   - `.gitignore`: add a line `generated/`
   - `README.md`: append the section titled "Patterns, templates, and onboarding accelerator" from this add-on's `README-SNIPPET.md`
3. Install deps and test:
   ```bash
   pip install jsonschema pyyaml
   python scripts/onboard_partner.py manifests/partners/*.yaml --check
   python scripts/onboard_partner.py manifests/partners/*.yaml --out docs/cases/generated-example
   git status docs/cases/generated-example   # should show no changes
   ```
4. Commit on a branch and open a PR. The new `onboarding.yml` workflow runs on it.
