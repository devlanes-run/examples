#!/usr/bin/env bash
# Reference only. Gives each worktree a slot from a hand-kept list, exports the
# slot's ports and URLs, and runs mprocs from the example folder. A new worktree
# needs a line in slot_for_worktree and its names in before/Caddyfile.
#
# Usage: before/scripts/slot.sh [essentials]
set -euo pipefail

config=before/mprocs.yaml

log() {
  echo "slot.sh: $*" >&2
}

die() {
  log "$*"
  exit 1
}

usage() {
  echo "usage: $0 [essentials]" >&2
  exit 2
}

parse_args() {
  case $# in
    0) ;;
    1) [[ $1 == essentials ]] || usage ;;
    *) usage ;;
  esac
  if (($#)); then config=before/mprocs.essentials.yaml; fi
}

# Prints the slot of the worktree this script runs in.
slot_for_worktree() {
  local worktree
  worktree=$(basename "$(git rev-parse --show-toplevel)")
  case $worktree in
    examples) echo 0 ;;
    examples-checkout) echo 1 ;;
    examples-review) echo 2 ;;
    *) die "no slot for worktree $worktree: add it to $0 and before/Caddyfile" ;;
  esac
}

# Exports the ports and URLs mprocs.yaml and the apps read for the given slot.
export_slot() {
  local slot=$1 names
  if ((slot == 0)); then names=acme.localhost; else names="s$slot.acme.localhost"; fi

  export API_PORT=$((4000 + slot * 100))
  export WEB_PORT=$((3000 + slot * 100))
  # worker and seed call the api directly, web goes through Caddy.
  export API_URL="http://127.0.0.1:$API_PORT"
  export API_PUBLIC_URL="https://api.$names"
  # The stub has no slot: every worktree sends to the one on 4010.
  export SMS_PUBLIC_URL="https://sms.acme.localhost"

  log "slot $slot: https://$names (web $WEB_PORT, api $API_PORT)"
}

main() {
  parse_args "$@"
  local slot
  slot=$(slot_for_worktree)
  export_slot "$slot"
  cd "$(dirname "$0")/../.."
  exec mprocs --config "$config"
}

main "$@"
