#!/usr/bin/env bash
# Installs dependencies and builds every example in catalog.json, or only the ones named, after
# checking that catalog.json matches the example folders. A failing example does not stop the others;
# the script lists every failure at the end and exits 1.
#
# npm ci replaces node_modules, so stop an example's lanes before building it.
#
# Usage: ./build.sh [example-folder ...]
set -uo pipefail

cd "$(dirname "$0")"

build_node() {
  if [[ -f pnpm-lock.yaml ]]; then
    pnpm install --frozen-lockfile && pnpm run build
  else
    npm ci && npm run build
  fi
}

build_rust() {
  cargo build --locked
}

build_python() {
  uv sync --frozen && uv run python -m compileall -q src
}

# Builds one example in a subshell, so a failure or a cd never leaks into the next one.
build_example() (
  cd "$1" || exit 1
  local built=false

  if [[ -f package.json ]]; then
    build_node || exit 1
    built=true
  fi
  if [[ -f Cargo.toml ]]; then
    build_rust || exit 1
    built=true
  fi
  if [[ -f pyproject.toml ]]; then
    build_python || exit 1
    built=true
  fi

  $built || echo "nothing to build"
)

main() {
  node _internal/scripts/catalog.ts check || exit 1

  local examples=("$@") failed=() example
  if ((!$#)); then
    # A read loop instead of mapfile, which the bash 3.2 that macOS ships lacks.
    while IFS= read -r example; do examples+=("$example"); done \
      < <(node _internal/scripts/catalog.ts slugs)
  fi

  for example in "${examples[@]}"; do
    echo "==> ${example%/}"
    build_example "${example%/}" || failed+=("${example%/}")
  done

  if ((${#failed[@]})); then
    echo "failed: ${failed[*]}" >&2
    exit 1
  fi
  echo "built ${#examples[@]} examples"
}

main "$@"
