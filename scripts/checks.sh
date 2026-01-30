#!/usr/bin/env bash
# 
set -euo pipefail

BASE_URL="${1:-http://localhost:6969}"
FAILED=0

check() {
  local name="$1"
  local path="$2"
  local expect_redirect="${3:-}"

  printf "%-60s " "$name"
  
  if [[ -n "$expect_redirect" ]]; then
    location=$(curl -s --max-time 10 -o /dev/null -w '%{redirect_url}' "$BASE_URL/$path")
    if [[ "$location" == *"$expect_redirect"* ]]; then
      echo "✓ -> $expect_redirect"
    else
      echo "✗ expected '$expect_redirect', got: $location"
      FAILED=1
    fi
  else
    status=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' "$BASE_URL/$path")
    if [[ "$status" == "200" ]]; then
      echo "✓ (200)"
    else
      echo "✗ (status: $status)"
      FAILED=1
    fi
  fi
}

check_content() {
  local name="$1"
  local path="$2"
  local expect_contains="$3"

  printf "%-60s " "$name"
  
  content=$(curl -sL --max-time 30 "$BASE_URL/$path" 2>/dev/null | head -50 || true)
  if echo "$content" | grep -qF "$expect_contains"; then
    echo "✓ (contains '$expect_contains')"
  else
    echo "✗ expected to contain '$expect_contains'"
    FAILED=1
  fi
}

check_submodule() {
  local name="$1"
  local path="$2"
  local expect_contains="$3"
  local tmpfile=$(mktemp)

  printf "%-60s " "$name"
  
  curl -sL --max-time 90 "$BASE_URL/$path" > "$tmpfile" 2>/dev/null
  if grep -qF "$expect_contains" "$tmpfile"; then
    echo "✓ (contains '$expect_contains')"
  else
    echo "✗ expected to contain '$expect_contains'"
    FAILED=1
  fi
  rm -f "$tmpfile"
}

echo "=== Basic redirects ==="
check "Whole repo (no https)" \
  "github.com/o-az/2md" \
  "gh_o-az_2md@main.md"

check "Whole repo (with https)" \
  "https://github.com/o-az/2md" \
  "gh_o-az_2md@main.md"

check "Directory (tree/main)" \
  "github.com/o-az/2md/tree/main/src" \
  "gh_o-az_2md@main_src.md"

check "Directory shorthand (no tree)" \
  "github.com/o-az/2md/src" \
  "gh_o-az_2md@main_src.md"

echo ""
echo "=== File handling ==="
check "Single file (blob)" \
  "github.com/o-az/2md/blob/main/justfile" \
  "ghf_o-az_2md@main_justfile.md"

check_content "File shorthand (justfile)" \
  "github.com/o-az/2md/justfile" \
  "just --list"

check_content "File shorthand (with extension)" \
  "github.com/o-az/2md/biome.json" \
  "biomejs"

check_content "File in subdirectory" \
  "github.com/o-az/2md/src/index.ts" \
  "Hono"

echo ""
echo "=== Branch handling ==="
check "Different branch (main)" \
  "github.com/honojs/hono/tree/main/src" \
  "gh_honojs_hono@main_src.md"

check "Tag as branch" \
  "github.com/honojs/hono/tree/v4.0.0/src" \
  "gh_honojs_hono@v4.0.0_src.md"

check_content "Tag returns different content than main" \
  "github.com/honojs/hono/tree/v4.0.0/src" \
  "honojs/hono@v4.0.0"

echo ""
echo "=== Clean path format ==="
check "Clean path (repo)" \
  "gh_o-az_2md@main.md"

check "Clean path (directory)" \
  "gh_o-az_2md@main_src.md"

check "Clean path (file)" \
  "ghf_o-az_2md@main_justfile.md"

check "Clean path with tag" \
  "gh_honojs_hono@v4.0.0_src.md"

echo ""
echo "=== Edge cases ==="
check_content "Directory with dot in name" \
  "github.com/o-az/2md/tree/main/.github" \
  ".github"

check_content "File with multiple dots" \
  "github.com/o-az/2md/.env.example" \
  "NODE_ENV"

check "Repo with hyphen in owner/name" \
  "github.com/o-az/2md" \
  "gh_o-az_2md@main.md"

echo ""
echo "=== Submodules support ==="
check_content "Submodules param on repo with submodules" \
  "github.com/foundry-rs/forge-std?submodules=true" \
  "forge-std"

check_submodule "Submodules param returns submodule content" \
  "github.com/transmissions11/solmate?submodules=true" \
  "# Submodule: lib/ds-test"

check_content "No submodules param = no submodule content" \
  "github.com/transmissions11/solmate" \
  "solmate"

check_submodule "Clean path with submodules" \
  "gh_transmissions11_solmate@main.md?submodules=true" \
  "# Submodule: lib/ds-test"

echo ""
echo "=== Utility endpoints ==="
check "Ping" "ping"
check "Root page" ""

echo ""
if [[ $FAILED -eq 0 ]]; then
  echo "✓ All checks passed!"
else
  echo "✗ Some checks failed"
  exit 1
fi
