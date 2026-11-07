# Debian 12 with Node 24. devlanes' Linux builds need glibc 2.35 or newer.
FROM node:24.22.2-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git \
  && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /home/node
# `docker exec` runs devlanes from this PATH, so the box command can name it bare.
ENV PATH=/home/node/.devlanes/bin:$PATH

COPY --chmod=755 remote-docker-box/box/install-devlanes.sh /usr/local/bin/install-devlanes
# A new value rebuilds the install step instead of reusing the cache. Not DEVLANES_VERSION:
# install.sh refuses to run when that variable is set.
ARG CLIENT_VERSION
RUN install-devlanes "$CLIENT_VERSION"

# The examples repository is not public yet, so the app comes from the build context, laid out
# as in the repository. Once it is public, this becomes a git clone.
RUN mkdir examples
WORKDIR /home/node/examples
COPY --chown=node:node .gitignore .gitignore
COPY --chown=node:node _internal/brand _internal/brand

# Dependencies first, so an edit to the app's source reuses the installed node_modules.
COPY --chown=node:node basics-hello-node/package.json basics-hello-node/package-lock.json basics-hello-node/
RUN npm ci --prefix basics-hello-node

COPY --chown=node:node basics-hello-node basics-hello-node
# A checkout without symlink support has brand as a file holding the link's target.
RUN ln -sfn ../_internal/brand basics-hello-node/brand

# devlanes runs a lane per Git worktree, so the copy becomes a repository on main.
RUN git init -q -b main
RUN git add -A \
  && git -c user.name=acme -c user.email=acme@example.invalid commit -q -m "Add basics-hello-node"

# Copied after the commit, so they stay out of the repository and out of new worktrees.
COPY --chown=node:node remote-docker-box/box/config.yaml /home/node/.devlanes/config.yaml
COPY --chown=node:node remote-docker-box/box/overlay.yaml basics-hello-node/devlanes.local.yaml
COPY --chown=node:node remote-docker-box/box/outbox basics-hello-node/outbox
RUN chmod 700 /home/node/.devlanes

WORKDIR /home/node/examples/basics-hello-node
# The box daemon starts with the first devlanes command run through `docker exec`.
CMD ["sleep", "infinity"]
