#!/usr/bin/env bash
# 
set -euo pipefail

BASE_URL="${1:-http://localhost:6969}"

check() {
  local name="$1"
  local path="$2"
  local expect_redirect="${3:-}"

  printf "%-50s " "$name"
  
  if [[ -n "$expect_redirect" ]]; then
    location=$(curl -s -o /dev/null -w '%{redirect_url}' "$BASE_URL/$path")
    if [[ "$location" == *"$expect_redirect"* ]]; then
      echo "✓ -> $location"
    else
      echo "✗ expected redirect to contain '$expect_redirect', got: $location"
      return 1
    fi
  else
    status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/$path")
    if [[ "$status" == "200" ]]; then
      echo "✓ (200)"
    else
      echo "✗ (status: $status)"
      return 1
    fi
  fi
}

echo "=== Redirect checks ==="
check "Whole repo (no https)" \
  "github.com/vercel-labs/json-render" \
  "gh_vercel-labs_json-render.md"

check "Whole repo (with https)" \
  "https://github.com/vercel-labs/json-render" \
  "gh_vercel-labs_json-render.md"

check "Directory (tree)" \
  "github.com/vercel-labs/json-render/tree/main/examples/dashboard" \
  "gh_vercel-labs_json-render_examples_dashboard.md"

check "Single file (blob)" \
  "github.com/vercel-labs/json-render/blob/main/examples/dashboard/next-env.d.ts" \
  "ghf_vercel-labs_json-render_examples_dashboard_next-env.d.ts.md"

check "Single file (README)" \
  "github.com/vercel-labs/json-render/blob/main/README.md" \
  "ghf_vercel-labs_json-render_README.md.md"

echo ""
echo "=== Direct clean path checks ==="
check "Clean path (repo)" \
  "gh_vercel-labs_json-render.md"

check "Clean path (directory)" \
  "gh_vercel-labs_json-render_examples_dashboard.md"

check "Clean path (file)" \
  "ghf_vercel-labs_json-render_README.md.md"

echo ""
echo "=== Utility endpoints ==="
check "Ping" "ping"
check "Root" ""

echo ""
echo "All checks passed!"
