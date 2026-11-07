#!/bin/sh
# Prepares this Linux machine as a devlanes box for the user who runs it, then
# starts an example and prints a pairing code. Run it again at any time: each
# step checks first and skips what is done.
#
#   sh box-setup.sh [--example <folder>] [--repo <url>] [--no-start]
#
# --example  folder of the examples repository to start (default: basics-hello-node)
# --repo     repository to clone into ~/examples (default: the devlanes examples)
# --no-start install and clone only; still prints a pairing code
set -eu

example=basics-hello-node
repo=https://github.com/devlanes-run/examples
start=1
checkout=$HOME/examples
bin_dir=$HOME/.devlanes/bin
devlanes=$bin_dir/devlanes

usage='usage: sh box-setup.sh [--example <folder>] [--repo <url>] [--no-start]'
say() { printf '==> %s\n' "$*"; }
fail() {
	printf 'box-setup: %s\n' "$*" >&2
	exit 1
}
bad_usage() {
	printf '%s\n' "$usage" >&2
	exit 2
}

while [ "$#" -gt 0 ]; do
	case $1 in
	--example)
		if [ "$#" -lt 2 ] || [ -z "$2" ]; then bad_usage; fi
		example=$2
		shift 2
		;;
	--example=*)
		example=${1#*=}
		[ -n "$example" ] || bad_usage
		shift
		;;
	--repo)
		if [ "$#" -lt 2 ] || [ -z "$2" ]; then bad_usage; fi
		repo=$2
		shift 2
		;;
	--repo=*)
		repo=${1#*=}
		[ -n "$repo" ] || bad_usage
		shift
		;;
	--no-start)
		start=
		shift
		;;
	-h | --help)
		printf '%s\n' "$usage"
		exit 0
		;;
	*)
		printf 'box-setup: unknown option %s\n' "$1" >&2
		bad_usage
		;;
	esac
done

[ "$(uname -s)" = Linux ] || fail "this script prepares Linux boxes; the remote setup guide covers macOS and Windows"
# The box daemon runs every unit as the user that starts it, and clients connect
# as the SSH user, so both must be the same ordinary account.
[ "$(id -u)" -ne 0 ] || fail "run this as the user you will SSH in as, not as root (create one with: adduser acme)"

glibc=$(getconf GNU_LIBC_VERSION 2>/dev/null | awk '{ print $2 }') || true
[ -n "$glibc" ] || fail "no glibc found; devlanes has no build for musl systems such as Alpine"
major=${glibc%%.*}
minor=${glibc#*.}
minor=${minor%%.*}
if [ "$major" -lt 2 ] || { [ "$major" -eq 2 ] && [ "$minor" -lt 35 ]; }; then
	fail "glibc $glibc is too old; devlanes needs 2.35 or newer (Debian 12, Ubuntu 22.04 and later)"
fi
say "glibc $glibc"

missing=
for tool in git curl; do
	command -v "$tool" >/dev/null 2>&1 || missing="$missing $tool"
done
if [ -n "$missing" ]; then
	command -v sudo >/dev/null 2>&1 || fail "missing:$missing, and sudo is not available; install them as root, then run this again"
	say "installing$missing"
	if command -v apt-get >/dev/null 2>&1; then
		sudo apt-get update -q
		# shellcheck disable=SC2086 # one word per package
		sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -q $missing ca-certificates
	elif command -v dnf >/dev/null 2>&1; then
		# shellcheck disable=SC2086
		sudo dnf install -y $missing ca-certificates
	else
		fail "missing:$missing; install them with this system's package manager, then run this again"
	fi
fi
say "$(git --version)"

# install.sh only installs the latest release; over an existing install it runs
# `devlanes update`, which would change the box's release behind the client's back.
if [ -x "$devlanes" ]; then
	say "$("$devlanes" --version) is already in $bin_dir (devlanes update moves it to the latest release)"
else
	say "installing devlanes into $bin_dir"
	curl -fsSL https://devlanes.run/install.sh | sh -s -- --dir "$bin_dir"
fi

# `remote connect` always looks in ~/.devlanes/bin, so the non-interactive SSH
# PATH needs nothing. This line is for your own login shells on the box.
# shellcheck disable=SC2016 # expanded by the login shell, not here
path_line='export PATH="$HOME/.devlanes/bin:$PATH"'
if grep -qsF "$path_line" "$HOME/.profile"; then
	say "$HOME/.profile already puts $bin_dir on PATH"
else
	printf '\n# devlanes, added by box-setup.sh\n%s\n' "$path_line" >>"$HOME/.profile"
	say "added $bin_dir to PATH in $HOME/.profile for new login shells"
fi
PATH=$bin_dir:$PATH
export PATH

# Without linger, systemd stops the box daemon when your last SSH session ends.
if [ -d /run/systemd/system ] && command -v loginctl >/dev/null 2>&1; then
	user=${USER:-$(id -un)}
	if [ "$(loginctl --no-pager show-user "$user" --property=Linger --value 2>/dev/null || true)" = yes ]; then
		say "linger is on for $user"
	elif command -v sudo >/dev/null 2>&1; then
		sudo loginctl enable-linger "$user"
		say "turned linger on for $user"
	else
		printf 'box-setup: sudo is not available; as root, run: loginctl enable-linger %s\n' "$user" >&2
	fi
else
	say "no systemd, so linger does not apply"
fi

# The laptop keeps 20000-24999 (README), so lanes created on both machines before
# they first connect never share a port. A range you set yourself is left alone.
if [ "$(devlanes config get ports.range)" = 20000-32767 ]; then
	if devlanes daemon status >/dev/null 2>&1; then
		say "the daemon already runs with ports.range 20000-32767; set another range yourself (README) if lanes overlap"
	else
		devlanes config set ports.range 25000-32767 >/dev/null
		say "ports.range is 25000-32767 on this box"
	fi
else
	say "ports.range is $(devlanes config get ports.range) on this box"
fi

if [ -d "$checkout/.git" ]; then
	say "$checkout is already a clone; leaving it as it is"
elif [ -e "$checkout" ]; then
	fail "$checkout exists and is not a Git clone; move it away, then run this again"
else
	say "cloning $repo into $checkout"
	git clone -q "$repo" "$checkout"
fi

if [ -n "$start" ]; then
	dir=$checkout/$example
	[ -f "$dir/devlanes.yaml" ] || fail "$dir has no devlanes.yaml; pick another folder with --example, or pass --no-start"
	# The daemon this start launches inherits this PATH, so a node that only an
	# interactive shell finds (nvm in ~/.bashrc) would be missing for the service too.
	if [ -f "$dir/package.json" ] && ! command -v node >/dev/null 2>&1; then
		fail "$example runs on Node and node is not on PATH; install the version its README lists, or pass --no-start"
	fi
	say "starting $example"
	(cd "$dir" && devlanes start --no-ui)
fi

say "pairing code for your laptop"
devlanes daemon pair
