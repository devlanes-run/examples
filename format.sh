#!/usr/bin/env bash
# Formats every example: Prettier for TypeScript, JavaScript, CSS, HTML, JSON, YAML, Markdown and
# shell scripts, cargo fmt for Rust, ruff for Python. With --check it only reports what differs.
#
# Needs `npm install` in the repository root once (Prettier), plus cargo and uv on PATH.
#
# Usage: ./format.sh [--check]
set -euo pipefail

cd "$(dirname "$0")"

RUFF_VERSION=0.17.4
check=false

# Example folders that hold the given manifest, skipping dependencies and build output.
folders_with() {
  find . -name "$1" \
    -not -path '*/node_modules/*' -not -path '*/target/*' -not -path '*/.venv/*' \
    | sed 's|/[^/]*$||' | sort -u
}

format_prettier() {
  if $check; then
    npx --no-install prettier --check .
  else
    npx --no-install prettier --write --log-level warn .
  fi
}

format_rust() {
  local dir
  for dir in $(folders_with Cargo.toml); do
    if $check; then
      (cd "$dir" && cargo fmt --all --check)
    else
      (cd "$dir" && cargo fmt --all)
    fi
  done
}

format_python() {
  local dirs=() dir
  # A read loop instead of mapfile, which the bash 3.2 that macOS ships lacks.
  while IFS= read -r dir; do dirs+=("$dir"); done < <(folders_with pyproject.toml)
  ((${#dirs[@]})) || return 0

  if $check; then
    uvx "ruff@$RUFF_VERSION" format --check "${dirs[@]}"
    uvx "ruff@$RUFF_VERSION" check "${dirs[@]}"
  else
    uvx "ruff@$RUFF_VERSION" format "${dirs[@]}"
    uvx "ruff@$RUFF_VERSION" check --fix "${dirs[@]}"
  fi
}

main() {
  case "${1:-}" in
    "") ;;
    --check) check=true ;;
    *)
      echo "usage: ./format.sh [--check]" >&2
      exit 2
      ;;
  esac

  node _internal/scripts/catalog.ts readme
  format_prettier
  format_rust
  format_python
}

main "$@"
