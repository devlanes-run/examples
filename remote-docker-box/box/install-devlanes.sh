#!/usr/bin/env bash
# Installs devlanes in the box image and fails when the installed release is not the one the
# client runs, since a client and its box must run the same release.
#
# Usage: install-devlanes <client-version>
set -euo pipefail

readonly BIN_DIR="$HOME/.devlanes/bin"
client_version=""

log() {
  echo "install-devlanes: $*" >&2
}

die() {
  log "$@"
  exit 1
}

parse_args() {
  if (($# != 1)) || [[ -z $1 ]]; then
    die "usage: install-devlanes <client-version>; pass --build-arg CLIENT_VERSION=<version of devlanes on the client>"
  fi
  client_version=$1
}

# install.sh installs only the latest release, so the version check below decides.
install_latest() {
  curl -fsSL --connect-timeout 10 --max-time 60 https://devlanes.run/install.sh \
    | sh -s -- --dir "$BIN_DIR"
}

check_version() {
  local installed
  installed=$("$BIN_DIR/devlanes" --version)
  if [[ $installed != "devlanes $client_version" ]]; then
    die "the box got $installed but the client runs $client_version; run devlanes update on the client"
  fi
  log "$installed matches the client"
}

main() {
  parse_args "$@"
  install_latest
  check_version
}

main "$@"
