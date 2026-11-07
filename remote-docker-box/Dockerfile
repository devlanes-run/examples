# Debian 12 with Node 24. devlanes' Linux builds need glibc 2.35 or newer.
FROM node:24.22.2-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git \
  && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /home/node
# `docker exec` runs devlanes from this PATH, so the box command can name it bare.
ENV PATH=/home/node/.devlanes/bin:$PATH

# install.sh installs only the latest release. The build stops when that is not the
# release the client runs, and a new value rebuilds this step instead of reusing the cache.
# Not DEVLANES_VERSION: install.sh refuses to run when that variable is set.
ARG CLIENT_VERSION
RUN test -n "$CLIENT_VERSION" || { echo "pass --build-arg CLIENT_VERSION=<version of devlanes on the client>" >&2; exit 1; } \
 && curl -fsSL https://devlanes.run/install.sh | sh -s -- --dir /home/node/.devlanes/bin \
 && { devlanes --version | grep -qx "devlanes $CLIENT_VERSION" \
      || { echo "the box got $(devlanes --version) but the client runs $CLIENT_VERSION; run devlanes update on the client" >&2; exit 1; }; }

# The examples repository is not public yet, so the app comes from the build context.
# Once it is, this becomes: RUN git clone https://github.com/devlanes-run/examples
RUN mkdir examples
COPY --chown=node:node basics-hello-node examples/basics-hello-node
# devlanes runs a lane per Git worktree, so the copy becomes a repository on main.
RUN git -C examples init -q -b main \
  && git -C examples add -A \
  && git -C examples -c user.name=acme -c user.email=acme@example.invalid commit -q -m "Add basics-hello-node"

COPY --chown=node:node remote-docker-box/box/config.yaml .devlanes/config.yaml
COPY --chown=node:node remote-docker-box/box/overlay.yaml examples/basics-hello-node/devlanes.local.yaml
COPY --chown=node:node remote-docker-box/box/outbox examples/basics-hello-node/outbox
RUN chmod 700 .devlanes

WORKDIR /home/node/examples/basics-hello-node
# The box daemon starts with the first devlanes command run through `docker exec`.
CMD ["sleep", "infinity"]
