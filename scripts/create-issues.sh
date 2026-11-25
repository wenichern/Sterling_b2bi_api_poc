#!/usr/bin/env bash
# Creates GitHub issues from docs/issues/*.md using the GitHub CLI.
# Usage: ./scripts/create-issues.sh [owner/repo]
set -euo pipefail
REPO="${1:-}"
for f in docs/issues/*.md; do
  title=$(grep -m1 '^title:' "$f" | sed 's/^title: *"\(.*\)"$/\1/')
  body=$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2{print}' "$f")
  echo "Creating: $title"
  if [ -n "$REPO" ]; then
    gh issue create --repo "$REPO" --title "$title" --body "$body" --label agent-task || true
  else
    gh issue create --title "$title" --body "$body" --label agent-task || true
  fi
done
