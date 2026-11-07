# Docker container as a remote box

A Docker container runs its own devlanes daemon and [basics-hello-node](../basics-hello-node), and your machine connects to it as a remote box through `docker exec` instead of SSH, with `remote.boxes.<name>.command`. After pairing, `https://hello-node.localhost` opens on your machine and reaches the server in the container, under the same hostname and port number it has there. A box-only `devlanes.local.yaml` adds a `hidden: true` service that stays in the container and a `sync` folder that the container copies to your machine.

## Requirements

- devlanes on your machine, with `devlanes setup` run once, on the latest release: the image installs the latest release with `install.sh`, and the build stops when it differs from yours (`devlanes update` fixes that)
- Docker with Linux containers (tested with Docker 29 on Windows 11)

The box itself needs nothing on your machine: the image is Debian 12 with Node 24, Git and devlanes.

## Run it

From this folder, build the image. The build context is the repository root, because the image copies `basics-hello-node` from it; the examples repository is not public yet, so the container cannot clone it. In PowerShell, write the version by hand, such as `--build-arg CLIENT_VERSION=0.11.3`.

```sh
cd remote-docker-box
docker build --build-arg CLIENT_VERSION="$(devlanes --version | cut -d' ' -f2)" -f Dockerfile -t acme-box ..
docker run -d --init --name acme-box acme-box
docker exec acme-box devlanes start --no-ui
```

The first devlanes command in the container starts the box's daemon there, and the start prints:

```text
hello-node@0 · main
ok services  2 of 2 ready
  ok  web    https://hello-node.localhost
  ok  admin  https://admin.hello-node.localhost
```

Tell your devlanes how to reach the box. `devlanes config set` reads the value as YAML, so the command is a quoted flow list:

```sh
devlanes config set remote.boxes.acme-box.command '[docker, exec, -i, acme-box, devlanes, tunnel, --stdio]'
```

The box serves only machines it paired with. Get a one-time code in the container, then connect with it:

```sh
docker exec acme-box devlanes daemon pair
devlanes remote connect acme-box --background --code QT7S-26WD
```

`daemon pair` prints the code alone when no terminal is attached (`docker exec -t` prints it with instructions). Use the one it printed, within 10 minutes. Later connections, also after a restart of your daemon, need no code.

Open https://hello-node.localhost. The page says `This is lane 0 of hello-node.` and shows port 41001, the port of `web` in the container. `devlanes remote ls` shows the box; its output starts with:

```text
items:
  state: connected
  server: devlanes 0.11.3
  host: acme-box
  transport: command
  https_port: 443
  lanes: 1
  ports:
    port: 41001
    lane: hello-node@0
    unit: web
    kind: service
    state: bound
    addresses: 127.0.0.1, ::1
```

## During a start

1. `docker run --init` keeps the container up with `sleep infinity`; `--init` reaps the processes the box's daemon leaves behind.
2. `docker exec acme-box devlanes start --no-ui` runs in `~/examples/basics-hello-node`, a Git repository on `main` that the image made from the copy. devlanes calls each worktree a lane, so this is lane 0. Lanes in the box take ports from `41000-41999` (`box/config.yaml`), away from the default pool your machine uses, so your machine can mirror them under the same numbers.
3. `devlanes.local.yaml` in the container (`box/overlay.yaml` here) merges over the example's `devlanes.yaml`. It adds `admin`, the same server under `admin.hello-node.localhost` with `hidden: true`, and `sync` of `outbox` on `web`.
4. `devlanes remote connect acme-box` makes your daemon run the command from `remote.boxes.acme-box.command`. `docker exec -i` passes its input and output through without a terminal, and `devlanes tunnel --stdio` in the container talks to the box's daemon. The code pairs your machine; the box keeps a hash of the token it gives your machine.
5. The box sends its lanes, ports and hostnames, leaving out `admin`. Your daemon listens on 127.0.0.1:41001 and ::1:41001 and adds `hello-node.localhost` to your proxy, with a certificate from your own CA, so the container needs no trust setup. A request goes through the proxy to that port, then over `docker exec` to 127.0.0.1:41001 in the container. Published ports play no part.

## Try next

- Start a second lane in the box: `docker exec acme-box git worktree add -q ../../examples-checkout -b feat/checkout`, then `docker exec acme-box sh -c 'cd ../../examples-checkout/basics-hello-node && devlanes start --no-ui'`. https://hello-node1.localhost opens on your machine without reconnecting, and `devlanes url ls` lists both hostnames next to `hello-node@0:web` and `hello-node@1:web`.
- `docker exec acme-box devlanes stop web`, then reload the page. Your proxy answers 503 `DL201 Service not running` with `Start it on acme-box: devlanes start --lane hello-node@0`, since commands are never sent to the box. `docker exec acme-box devlanes start --no-ui web` brings it back.
- `docker exec acme-box devlanes status` lists `admin` as ready on port 41000, but `devlanes remote ls` on your machine has no port 41000, and `https://admin.hello-node.localhost` fails the TLS handshake there because your proxy has no route or certificate for it. Plain `http://admin.hello-node.localhost` answers 404 `DL101 Unknown host`.
- `docker exec acme-box sh -c 'date -u > outbox/now.txt'`. A second later the file is in `~/.devlanes/sync/acme-box/hello-node/hello-node@0/outbox/` on your machine (`%USERPROFILE%\.devlanes\sync\...` on Windows), next to `hello.txt`. `devlanes remote sync` shows the folder as `watching`.
- `docker exec acme-box devlanes daemon clients` lists your machine as `paired` and connected. `devlanes daemon revoke` with its name or id ends the connection: `devlanes remote ls` shows `needs_pairing` with the fix `devlanes daemon pair on acme-box, then devlanes remote connect acme-box --code <code>`, and the page answers 503 until you pair again.
- `docker restart acme-box`. Your daemon reconnects on its own and the box's daemon starts again, but its lanes stay idle until `docker exec acme-box devlanes start --no-ui`.
- When you are done: `devlanes remote disconnect acme-box`, `devlanes config unset remote.boxes.acme-box`, `docker rm -f acme-box` and `docker image rm acme-box`. Synced files stay under `~/.devlanes/sync/acme-box` until you delete them.

## Files

- `Dockerfile`: the box image. It installs devlanes with `install.sh --dir ~/.devlanes/bin`, copies `basics-hello-node` and commits it to a fresh repository.
- `Dockerfile.dockerignore`: keeps the build context to `basics-hello-node` and `box`.
- `box/config.yaml`: the box's user config, with its own `ports.range`.
- `box/overlay.yaml`: the box's `devlanes.local.yaml` for basics-hello-node, with the hidden `admin` service and the `sync` entry.
- `box/outbox/hello.txt`: the file `sync` copies to your machine.

## Docs

- [Remote boxes](https://github.com/devlanes-run/devlanes/blob/main/docs/remote.md)
- [Boxes reached by a command](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/remote-command.md)
- [Remote setup](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/remote-setup.md)
- [Pairing and what crosses the connection](https://github.com/devlanes-run/devlanes/blob/main/docs/security.md)
- [Config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md)
