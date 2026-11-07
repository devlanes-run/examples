#!/usr/bin/env bash
# Prepares this Linux machine as a devlanes box for the user who runs it, then
# starts an example and prints a pairing code. Run it again at any time: each
# step checks first and skips what is done. It only runs on Linux, so it may
# use bash features that macOS's bash 3.2 lacks.
#
#   bash box-setup.sh [--example <folder>] [--repo <url>] [--no-start]
#
# --example  folder of the examples repository to start (default: basics-hello-node)
# --repo     repository to clone into ~/examples (default: the devlanes examples)
# --no-start install and clone only; still prints a pairing code

# Debian's sh is dash, so `sh box-setup.sh` hands over to bash here. Alpine has
# no bash by default and no devlanes build either.
if [ -z "${BASH_VERSION:-}" ]; then
  if ! command -v bash > /dev/null 2>&1; then
    echo "box-setup: bash is missing; devlanes boxes need a glibc Linux such as Debian 12 or Ubuntu 22.04" >&2
    exit 1
  fi
  exec bash "$0" "$@"
fi
set -euo pipefail

usage='usage: bash box-setup.sh [--example <folder>] [--repo <url>] [--no-start]'
checkout=$HOME/examples
bin_dir=$HOME/.devlanes/bin
example=basics-hello-node
repo=https://github.com/devlanes-run/examples
start=1

log() { printf '==> %s\n' "$*"; }
warn() { printf 'box-setup: %s\n' "$*" >&2; }
die() {
  warn "$@"
  exit 1
}
has() { command -v "$1" > /dev/null 2>&1; }

usage_error() {
  printf '%s\n' "$usage" >&2
  exit 2
}

parse_args() {
  while (($# > 0)); do
    case $1 in
      --example | --repo)
        [[ $# -ge 2 && -n ${2:-} ]] || usage_error
        set_option "$1" "$2"
        shift 2
        ;;
      --example=* | --repo=*)
        [[ -n ${1#*=} ]] || usage_error
        set_option "${1%%=*}" "${1#*=}"
        shift
        ;;
      --no-start) start= && shift ;;
      -h | --help) printf '%s\n' "$usage" && exit 0 ;;
      *) warn "unknown option $1" && usage_error ;;
    esac
  done
}

set_option() {
  case $1 in
    --example) example=$2 ;;
    --repo) repo=$2 ;;
  esac
}

check_system() {
  [[ $(uname -s) == Linux ]] || die "this script prepares Linux boxes; the remote setup guide covers macOS and Windows"
  # The box daemon runs every unit as the user that starts it, and clients
  # connect as the SSH user, so both must be the same ordinary account.
  (($(id -u) != 0)) || die "run this as the user you will SSH in as, not as root (create one with: adduser acme)"
}

check_glibc() {
  local glibc major minor
  glibc=$(getconf GNU_LIBC_VERSION 2> /dev/null | awk '{ print $2 }') || true
  [[ -n $glibc ]] || die "no glibc found; devlanes has no build for musl systems such as Alpine"
  major=${glibc%%.*}
  minor=${glibc#*.}
  minor=${minor%%.*}
  if ((major < 2 || (major == 2 && minor < 35))); then
    die "glibc $glibc is too old; devlanes needs 2.35 or newer (Debian 12, Ubuntu 22.04 and later)"
  fi
  log "glibc $glibc"
}

# Installs git and curl when either is missing.
install_git() {
  local missing=() tool
  for tool in git curl; do
    has "$tool" || missing+=("$tool")
  done
  if ((${#missing[@]} > 0)); then
    has sudo || die "missing: ${missing[*]}, and sudo is not available; install them as root, then run this again"
    log "installing ${missing[*]}"
    install_packages "${missing[@]}"
  fi
  log "$(git --version)"
}

install_packages() {
  if has apt-get; then
    sudo apt-get update -q
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -q "$@" ca-certificates
  elif has dnf; then
    sudo dnf install -y "$@" ca-certificates
  else
    die "missing: $*; install them with this system's package manager, then run this again"
  fi
}

# install.sh only installs the latest release; over an existing install it runs
# `devlanes update`, which would change the box's release behind the client's back.
install_devlanes() {
  if [[ -x $bin_dir/devlanes ]]; then
    log "$("$bin_dir/devlanes" --version) is already in $bin_dir (devlanes update moves it to the latest release)"
  else
    log "installing devlanes into $bin_dir"
    curl -fsSL https://devlanes.run/install.sh | sh -s -- --dir "$bin_dir"
  fi
  export PATH=$bin_dir:$PATH
}

# `remote connect` always looks in ~/.devlanes/bin, so the non-interactive SSH
# PATH needs nothing. This line is for your own login shells on the box.
add_to_profile() {
  # shellcheck disable=SC2016 # expanded by the login shell, not here
  local line='export PATH="$HOME/.devlanes/bin:$PATH"'
  if grep -qsF "$line" "$HOME/.profile"; then
    log "$HOME/.profile already puts $bin_dir on PATH"
  else
    printf '\n# devlanes, added by box-setup.sh\n%s\n' "$line" >> "$HOME/.profile"
    log "added $bin_dir to PATH in $HOME/.profile for new login shells"
  fi
}

# Without linger, systemd stops the box daemon when your last SSH session ends.
enable_linger() {
  local user=${USER:-$(id -un)} linger
  if [[ ! -d /run/systemd/system ]] || ! has loginctl; then
    log "no systemd, so linger does not apply"
    return
  fi
  linger=$(loginctl --no-pager show-user "$user" --property=Linger --value 2> /dev/null || true)
  if [[ $linger == yes ]]; then
    log "linger is on for $user"
  elif has sudo; then
    sudo loginctl enable-linger "$user"
    log "turned linger on for $user"
  else
    warn "sudo is not available; as root, run: loginctl enable-linger $user"
  fi
}

# The laptop keeps 20000-24999 (README), so lanes created on both machines before
# they first connect never share a port. A range you set yourself is left alone.
configure_ports() {
  local range
  range=$(devlanes config get ports.range)
  if [[ $range != 20000-32767 ]]; then
    log "ports.range is $range on this box"
  elif devlanes daemon status > /dev/null 2>&1; then
    log "the daemon already runs with ports.range 20000-32767; set another range yourself (README) if lanes overlap"
  else
    devlanes config set ports.range 25000-32767 > /dev/null
    log "ports.range is 25000-32767 on this box"
  fi
}

clone_examples() {
  if [[ -d $checkout/.git ]]; then
    log "$checkout is already a clone; leaving it as it is"
  elif [[ -e $checkout ]]; then
    die "$checkout exists and is not a Git clone; move it away, then run this again"
  else
    log "cloning $repo into $checkout"
    git clone -q "$repo" "$checkout"
  fi
}

start_example() {
  local dir=$checkout/$example
  [[ -f $dir/devlanes.yaml ]] || die "$dir has no devlanes.yaml; pick another folder with --example, or pass --no-start"
  # The daemon this start launches inherits this PATH, so a node that only an
  # interactive shell finds (nvm in ~/.bashrc) would be missing for the service too.
  if [[ -f $dir/package.json ]] && ! has node; then
    die "$example runs on Node and node is not on PATH; install the version its README lists, or pass --no-start"
  fi
  log "starting $example"
  (cd "$dir" && devlanes start --no-ui)
}

print_pairing() {
  log "pairing code for your laptop"
  devlanes daemon pair
}

main() {
  parse_args "$@"
  check_system
  check_glibc
  install_git
  install_devlanes
  add_to_profile
  enable_linger
  configure_ports
  clone_examples
  if [[ -n $start ]]; then
    start_example
  fi
  print_pairing
}

main "$@"
