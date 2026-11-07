# Remote SSH box

`box-setup.sh` turns a fresh Linux VPS into a devlanes box: it installs Git and devlanes into `~/.devlanes/bin`, turns on systemd linger, gives the box its own `ports.range`, clones this repository, starts [basics-hello-node](../basics-hello-node) and prints a pairing code. Your laptop then runs `devlanes remote connect` over SSH and opens `https://hello-node.localhost` from the box as if it ran locally. `ssh_config.example` has `Host` entries for plain SSH, Tailscale and Cloudflare Tunnel.

## Requirements

On the box:

- Linux with glibc 2.35 or newer (Debian 12, Ubuntu 22.04 and later), x86_64 or arm64
- an ordinary user with `sudo` and SSH key login; the script refuses to run as root
- `curl`, or `sudo` to install it
- Node 22 or later for basics-hello-node, installed where a non-interactive SSH session finds it (`/usr/local/bin`, or a package in `/usr/bin`). Debian 12 and Ubuntu 22.04 ship Node 18 and 12 in their own repositories, so use Node's own builds. A Node that only nvm in `~/.bashrc` puts on `PATH` is missing for the box daemon. Not needed with `--no-start`.

On the laptop:

- devlanes, with `devlanes setup` run once
- the OpenSSH client and a key the box accepts, loaded in an agent so reconnects need no prompt
- the same devlanes release as the box (`devlanes --version` on both)

## Run it

On the laptop, add a `Host` entry for the box to `~/.ssh/config` (`%USERPROFILE%\.ssh\config` on Windows). The first block of `ssh_config.example` is the one for a VPS with a public address:

```text
Host acme-box
  HostName 203.0.113.10
  User acme
```

Copy the script to the box and run it there. `-t` gives `sudo` a terminal to ask for a password:

```sh
cd remote-ssh-box
scp box-setup.sh acme-box:
ssh -t acme-box sh box-setup.sh
```

A run on a Debian 12 container with systemd printed this (apt-get's own lines left out). That run passed `--repo` with a local copy of this repository, so the clone line names it:

```text
==> glibc 2.36
==> installing git
==> git version 2.39.5
==> installing devlanes into /home/acme/.devlanes/bin
Installed devlanes 0.11.3 to /home/acme/.devlanes/bin
/home/acme/.devlanes/bin is not on PATH. Add it to your shell profile:
  export PATH="/home/acme/.devlanes/bin:$PATH"
==> added /home/acme/.devlanes/bin to PATH in /home/acme/.profile for new login shells
==> turned linger on for acme
==> ports.range is 25000-32767 on this box
==> cloning /srv/examples into /home/acme/examples
==> starting basics-hello-node
hello-node@0 · main
✓ services  1 of 1 ready
  ✓  web  https://hello-node.localhost
hello-node.localhost needs devlanes setup (CA not trusted)
==> pairing code for your laptop
pairing code: R0SZ-27CY
it works once and expires in 10 minutes
on your other machine, run: devlanes remote connect <box> --code R0SZ-27CY
```

The `CA not trusted` line is about browsers on the box itself and can be ignored: the laptop serves the box's hostnames with its own CA.

Back on the laptop, give it a port range that does not overlap the box's `25000-32767`, then connect with the code:

```sh
devlanes config set ports.range 20000-24999
devlanes daemon restart # only if the daemon was already running
devlanes remote connect acme-box --code R0SZ-27CY
devlanes remote ls
```

`remote connect` stays attached to show SSH prompts; Ctrl-C detaches and the connection stays up (`--background` returns once connected). The first lines of `remote ls` show the mirrored port and route:

```text
items:
  state: connected
  server: devlanes 0.11.3
  host: acme-box
  transport: ssh
  https_port: 443
  lanes: 1
  ports:
    port: 25000
    lane: hello-node@0
    unit: web
    kind: service
    state: bound
    addresses: 127.0.0.1, ::1
    conflicts: -
    relay: -
  routes:
    host: hello-node.localhost
    port: 25000
    lane: hello-node@0
    unit: web
    url: https://hello-node.localhost
    state: ready
```

Open the route's `url` in your browser. The page says `This is lane 0 of hello-node.`, and https://hello-node.localhost/lane answers with the box's port:

```json
{
  "project": "hello-node",
  "lane": 0,
  "lane_name": "main",
  "branch": "main",
  "service": "web",
  "port": 25000,
  "url": "https://hello-node.localhost"
}
```

The test box could bind port 443. On a VPS where an ordinary user cannot, the box's proxy falls back to 8443 and its URLs read `https://hello-node.localhost:8443`; the laptop then listens on 8443 too and the URL opens unchanged ([box proxy on another port](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/remote-setup.md#box-proxy-on-another-port)).

The pairing code lasts 10 minutes. For a new one, run `ssh acme-box '~/.devlanes/bin/devlanes daemon pair'`, which prints only the code.

## During box-setup.sh

Each step checks first, so a second run skips what is done and leaves an existing clone, devlanes install and `ports.range` alone.

1. Checks the glibc version with `getconf GNU_LIBC_VERSION` and stops below 2.35 or on musl.
2. Installs `git` and `curl` with `apt-get` (or `dnf`) through `sudo` when they are missing.
3. Installs devlanes with `install.sh --dir ~/.devlanes/bin`. `remote connect` always looks there, so the non-interactive SSH `PATH`, which skips `~/.bashrc`, needs no change. The script also adds that directory to `PATH` in `~/.profile` for your own login shells. `install.sh` installs only the latest release and has no version flag; when devlanes is already installed, the script leaves it, so the box changes release only when you run `devlanes update` there.
4. Runs `sudo loginctl enable-linger "$USER"` when systemd runs, so the box daemon survives your last SSH session. Without it, `devlanes remote ls` on the laptop shows `the box stops your processes at logout`.
5. Sets `ports.range` to `25000-32767` when the box still has the default `20000-32767`.
6. Clones this repository into `~/examples`.
7. Runs `devlanes start --no-ui` in `~/examples/basics-hello-node`, which also starts the box daemon with the script's `PATH`.
8. Runs `devlanes daemon pair`.

Options:

- `--example <folder>` starts another example, such as `--example basics-ready-checks`. Install what its README lists on the box first.
- `--no-start` installs and clones only, then prints a pairing code.
- `--repo <url>` clones another repository, such as your fork.

## Try next

- Start a second lane on the box: `cd ~/examples && git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/basics-hello-node && devlanes start --no-ui`. Without reconnecting, `devlanes url ls` on the laptop lists both:

  ```text
  HOST                       TARGET            PORT   STATE
  hello-node.localhost   ->  hello-node@0:web  25000  ready
  hello-node1.localhost  ->  hello-node@1:web  25010  ready
  ```

- `devlanes stop` in that worktree on the box. https://hello-node1.localhost on the laptop then answers 503 with the proxy's `DL201 Service not running` page, which names the box and the command to run there, `devlanes start --lane hello-node@1`.
- `devlanes daemon clients` on the box lists the laptop as paired and connected, with its address and how many ports it mirrors. `devlanes url print web` in `~/examples/basics-hello-node` adds a line per connected client with the URL that opens there, such as `on laptop: https://hello-node.localhost`.
- `devlanes remote disconnect acme-box` on the laptop removes the mirrored port and hostname. When you are done with the box, run `devlanes lane clean <lane> --yes` there for each lane.

## Tailscale

A box on your tailnet is an ordinary SSH host to devlanes. Use the `acme-tailnet` block of `ssh_config.example` with the box's full MagicDNS name, then `devlanes remote connect acme-tailnet` as above. With Tailscale SSH, the default `check` rule asks for a browser sign-in that `remote connect` never shows, so use an `accept` rule for the box and account, or run `ssh acme-tailnet true` first and connect within the check period. Mirrored ports travel inside the SSH connection, so the tailnet policy only needs TCP port 22. [Remote boxes over Tailscale](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/remote-tailscale.md) has the policy rules.

## Cloudflare Tunnel

Publish the box's `localhost:22` as an SSH application behind Cloudflare Access, then use the `acme-cloudflare` block. Its `ProxyCommand` names `cloudflared` by its full path, since `ssh` runs as a child of the devlanes daemon with the daemon's `PATH`. cloudflared's login URL never reaches `remote connect`, so get the Access token in a terminal first with `ssh acme-cloudflare true`, and again when the session expires. [Remote boxes through Cloudflare](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/remote-cloudflare.md) covers the tunnel, Access and the Cloudflare One Client.

## Limits

- TCP only. UDP ports on the box are not mirrored.
- Run the same release on both machines. `install.sh` installs the latest one, so keep the laptop current with `devlanes update`, and run `devlanes update` on the box when the laptop moves ahead. A different release with the same protocol connects with a warning; a different protocol does not connect.
- devlanes never installs or updates anything on the box, and the laptop never runs commands there. Start, stop and inspect lanes in an SSH shell on the box.
- A Windows laptop uses Windows' OpenSSH, which has no ControlMaster, so every reconnect authenticates again. Keep the key in the ssh-agent service ([Windows clients](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/remote-setup.md#windows-clients)).

## Tested

Tested with devlanes 0.11.3 on Debian 12 containers with sshd, one with systemd as PID 1: the full script on a fresh box, a second run, linger on and off, a Linux client connecting over SSH with the `acme-box` block and `curl` against the mirrored hostname, and a Windows 11 client reaching the same box through a `remote.boxes` command that runs `ssh -F`. On Ubuntu 22.04 and Debian 11 only the glibc check ran. A real VPS, arm64, the `dnf` path and the Tailscale and Cloudflare blocks are untested.

## Files

- `box-setup.sh`: prepares the box, starts an example and prints a pairing code. POSIX `sh`.
- `ssh_config.example`: `Host` entries for plain SSH, Tailscale and Cloudflare Tunnel.

## Docs

- [Remote setup](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/remote-setup.md)
- [Remote boxes](https://github.com/devlanes-run/devlanes/blob/main/docs/remote.md)
- [Remote boxes over Tailscale](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/remote-tailscale.md)
- [Remote boxes through Cloudflare](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/remote-cloudflare.md)
- [Security](https://github.com/devlanes-run/devlanes/blob/main/docs/security.md)
