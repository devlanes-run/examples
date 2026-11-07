#!/bin/sh
# Reference only. Gives each worktree a slot by hand, exports the slot's ports
# and URLs, and runs mprocs. Usage: before/scripts/slot.sh [essentials]
set -eu

# A new worktree needs a line here and its names in before/Caddyfile.
case "$(basename "$(git rev-parse --show-toplevel)")" in
  examples) slot=0 ;;
  examples-checkout) slot=1 ;;
  examples-review) slot=2 ;;
  *)
    echo "no slot for this worktree: add it to $0 and before/Caddyfile" >&2
    exit 1
    ;;
esac

offset=$((slot * 100))
if [ "$slot" -eq 0 ]; then names=acme.localhost; else names="s$slot.acme.localhost"; fi

export API_PORT=$((4000 + offset))
export WEB_PORT=$((3000 + offset))
# worker and seed call the api directly, web goes through Caddy.
export API_URL="http://127.0.0.1:$API_PORT"
export API_PUBLIC_URL="https://api.$names"
# The stub has no slot: every worktree sends to the one on 4010.
export SMS_PUBLIC_URL="https://sms.acme.localhost"

echo "slot $slot: https://$names (web $WEB_PORT, api $API_PORT)"

cd "$(dirname "$0")/../.."
if [ "${1:-}" = essentials ]; then
  exec mprocs --config before/mprocs.essentials.yaml
fi
exec mprocs --config before/mprocs.yaml
