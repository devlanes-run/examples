# Agent plugin and hooks

A folder set up for coding agents. `AGENTS.md` carries the devlanes section of the [agent plugin](https://github.com/devlanes-run/devlanes/tree/main/agent-plugin), `CLAUDE.md` imports it for Claude Code, and `.claude/settings.json` installs the plugin's `PreToolUse` hook for this project, which refuses `npm run dev &` and points the agent to `devlanes exec --name`. The app is an `api` and a `web` service on `node:http`, plus a `node:test` suite that `devlanes with -- npm test` runs against the lane.

## Requirements

- devlanes 0.11.3 or later, with `devlanes setup` run once. The hook runs `devlanes __agent-hook`, so `devlanes` must be on the agent's `PATH`.
- Node 22 or later (tested with Node 24 and npm 11)
- Claude Code or Codex for the prompts under "Try it with an agent"

## Run it

```sh
cd agents-plugin-hooks
devlanes start --no-ui
```

```text
agent-hooks@0 · main
✓ services  2 of 2 ready
  ✓  api  https://api.agent-hooks.localhost
  ✓  web  https://agent-hooks.localhost
```

Open https://agent-hooks.localhost. The page says `This is lane 0 of agent-hooks.`, lists the lane's values and shows the tasks the `web` service fetched from `api`. https://api.agent-hooks.localhost returns the api's lane values and tasks as JSON.

## During a start

devlanes calls each worktree a lane; a fresh clone on `main` is lane 0. It gives `api` and `web` a port each, runs `npm run api` and `npm run dev` with `PORT` set, and waits for `/healthz` on both. `web` reads the api's address from `API_URL`, set to `${{ services.api.url }}`, so each lane's page calls its own lane's api over plain HTTP.

## Install the agent plugin

`.claude/settings.json` gives Claude Code the hook in this folder without the plugin. Elsewhere, install the plugin. These commands are from the plugin's [README](https://github.com/devlanes-run/devlanes/blob/main/agent-plugin/README.md).

Claude Code, from the repository's marketplace:

```sh
claude plugin marketplace add devlanes-run/devlanes
claude plugin install devlanes@devlanes
```

Codex:

```sh
codex plugin marketplace add devlanes-run/devlanes
codex plugin install devlanes@devlanes
```

"Codex runs no plugin hook until you trust it: open `/hooks` in Codex, review the devlanes hook and trust it." The plugin defines Codex's hook only inside the plugin, so this folder has no project-level Codex hook. Codex reads `AGENTS.md` here either way.

The skill alone, through the skills CLI, without the hook:

```sh
npx skills add devlanes-run/devlanes --skill devlanes
```

Add `-g` to install for every project, and `-a claude-code` or `-a codex` to pick the agent.

With the plugin installed as well, Claude Code runs both copies of the hook; they give the same answer.

## Try it with an agent

Start Claude Code or Codex in this folder so it reads `AGENTS.md` (and, for Claude Code, `CLAUDE.md` and `.claude/settings.json`). These prompts were not run with a live agent; the commands they should lead to were run by hand below.

- "Start the dev server in the background with `npm run dev &`." The hook denies the call and the agent reads: `Blocked by the devlanes plugin: this starts a long-running process in the background, where nothing supervises it and its logs are lost.` followed by `devlanes start [UNIT...]` and `devlanes exec --name NAME -- COMMAND`. The agent should then run `devlanes start`.
- "Run `scratch.mjs` on port 8787 while I send it requests." The agent should run `devlanes exec --name scratch -- node scratch.mjs 8787` and `devlanes wait scratch`, then read requests with `devlanes logs scratch --tail 100`.
- "Run the tests." The agent should run `devlanes with -- npm test`, which starts the lane, runs the tests against its URLs and stops what it started.
- "Clean up." The agent should run `devlanes stop --mine`, which reaches every project (see `stop --mine` under "Try next").

## Check the hook without an agent

Feed the hook the JSON a `PreToolUse` call sends. A backgrounded dev server in this folder is denied:

```sh
echo '{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"npm run dev &"}}' | devlanes __agent-hook --agent claude-code
```

```text
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Blocked by the devlanes plugin: this starts a long-running process in the background, where nothing supervises it and its logs are lost.\nUse instead:\n  devlanes start [UNIT...]               services defined in devlanes.yaml\n  devlanes exec --name NAME -- COMMAND   any other long-running command\nThen check it with `devlanes wait NAME --timeout 180s` and `devlanes logs NAME --tail 100`."}}
```

The same call with `"command":"npm test"` prints nothing and exits 0, which lets the call through. Claude Code also sends `cwd`; without it the hook checks the directory it runs in.

The hook reads the words of the command, not the scripts they run. `node --watch api.mjs &` is denied for `--watch`, but `npm run api &` and `node scratch.mjs 8787 &` pass because no word looks like a dev server. `AGENTS.md` is what tells the agent to use `devlanes exec` for those. `DEVLANES_BLOCK_BACKGROUND=0` in the agent's environment turns the hook off.

## Try next

devlanes prints terse agent output when it detects a coding agent, and human output on a terminal. `DEVLANES_OUTPUT=agent` or `DEVLANES_OUTPUT=human` picks one, so you can compare them from a shell. The outputs below are from runs inside an OpenCode session, hence `actor=opencode`.

- `DEVLANES_OUTPUT=agent devlanes exec --name scratch -- node scratch.mjs 8787` runs the server as a unit of lane 0:

  ```text
  ready agent-hooks@0:scratch actor=opencode pid=70464
    logs: devlanes logs agent-hooks@0:scratch -f
    stop: devlanes stop agent-hooks@0:scratch
  ```

  `curl http://127.0.0.1:8787/hello`, then `devlanes logs scratch --tail 20`:

  ```text
  scratch#1 scratch listening on http://127.0.0.1:8787
  scratch#2 lane api: https://api.agent-hooks.localhost
  scratch#3 GET /hello
  ```

  In agent output, `logs -f` needs `--timeout`: `devlanes logs scratch -f --timeout 30s`.

- `devlanes status --mine` lists only what this session started. Agent output, then human output:

  ```text
  running agent-hooks@0 main
  ready agent-hooks@0:scratch actor=opencode
  ```

  ```text
  agent-hooks
    LANE  BRANCH  STATE    SERVICES  CPU   MEM       URL
    0     main    running  –         0.0%  19.2 MiB  agent-hooks.localhost

    UNIT     STATE    PORT  CPU   MEM       URL
    scratch  running  –     0.0%  19.2 MiB
  ```

- Agent output puts failures first, with the command that shows more. After `devlanes exec --name crash -- node -e "process.exit(1)"`, `DEVLANES_OUTPUT=agent devlanes status` prints:

  ```text
  running agent-hooks@0 main 0/2 failed=crash
  failed agent-hooks@0:crash exit=1 actor=opencode
    exited with code 1
    more: devlanes logs agent-hooks@0:crash --tail 200
  stopped agent-hooks@0:api exit=255 http://127.0.0.1:20540 https://api.agent-hooks.localhost default=20540 actor=opencode
  stopped agent-hooks@0:web exit=255 http://127.0.0.1:20541 https://agent-hooks.localhost default=20541 actor=opencode
  ready agent-hooks@0:scratch actor=opencode
  ```

  Human output lists the same units in a table, with `crash  failed (1)` first and `crash: exited with code 1` under it. Both exit 1.

- `DEVLANES_OUTPUT=agent devlanes with -- npm test` starts `api` and `web`, runs `test/lane.test.mjs` against `DEVLANES_PUBLIC_URL_API` and `DEVLANES_PUBLIC_URL_WEB`, stops both and exits with the tests' code:

  ```text
  agent-hooks@0 (main): 2/2 ready
  ready api http://127.0.0.1:20540 https://api.agent-hooks.localhost
  ready web http://127.0.0.1:20541 https://agent-hooks.localhost

  > test
  > node --test

  ✔ api answers through the proxy (44.7304ms)
  ✔ api lists tasks (4.4465ms)
  ✔ web shows the api's tasks from the same lane (13.7706ms)
  ℹ tests 3
  ℹ suites 0
  ℹ pass 3
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 156.0465
  devlanes with · agent-hooks@0 · exit 0
  UNIT  STATE  RUN TIME  AVG CPU  PEAK CPU   AVG MEM  PEAK MEM
  api   ready        1s     0.0%      0.0%  61.5 MiB  61.5 MiB
  web   ready        1s     0.0%      0.0%   3.2 MiB   3.2 MiB
  ```

  With human output the start prints `✓ services  2 of 2 ready` instead of the `ready` lines. A plain `npm test` fails with `DEVLANES_PUBLIC_URL_API or DEVLANES_PUBLIC_URL_WEB is not set`.

- `devlanes stop --mine` stops what this session started, in every lane of every project; `-p agent-hooks` does not narrow it. Units or `--lane` keep it to one lane: `DEVLANES_OUTPUT=agent devlanes stop --mine "*"` printed

  ```text
  stopped agent-hooks@0:api exit=255
  stopped agent-hooks@0:web exit=255
  ```

  and `devlanes stop --mine --lane agent-hooks@0` printed `stopped agent-hooks@0:scratch exit=-1073741510`. `devlanes status --mine` stays in this folder's project, so run it first to see what a stop would touch here.

  A session is matched by the session ID devlanes detects for the agent. When it detects none, as for OpenCode in these runs, `--mine` matches everything started by any session of the same agent, including other agents' units in other projects.

- A second lane without a second worktree: `devlanes lane new --name agent-hooks-review --start` starts lane 1 at https://agent-hooks1.localhost, and `devlanes with --lane agent-hooks-review -- npm test` runs the tests against it.
- When you are done, `devlanes lane clean 1 --yes` and `devlanes lane clean 0 --yes`.

## Files

- `AGENTS.md`: a line about this app, then a copy of the plugin's [codex/AGENTS.md](https://github.com/devlanes-run/devlanes/blob/main/agent-plugin/codex/AGENTS.md). Replace the copy when that file changes.
- `CLAUDE.md`: `@AGENTS.md`, so Claude Code reads the same rules.
- `.claude/settings.json`: the `PreToolUse` hook from the plugin's [hooks/hooks.json](https://github.com/devlanes-run/devlanes/blob/main/agent-plugin/hooks/hooks.json), unchanged.
- `devlanes.yaml`: `api` and `web`, with `hosts`, `/healthz` ready checks and `API_URL` for `web`.
- `package.json`: the `dev`, `api` and `test` scripts and `packageManager`.
- `api.mjs`, `web.mjs`, `lane.mjs`: the two servers and what they share.
- `scratch.mjs`: a one-off server for `devlanes exec`, not part of `devlanes.yaml`.
- `test/lane.test.mjs`: the tests `devlanes with -- npm test` runs.
- `devlanes.css`, `logo.svg`: the page's look, copied from `_template`.

## Docs

- [Agent plugin](https://github.com/devlanes-run/devlanes/blob/main/agent-plugin/README.md)
- [Coding agents in Getting started](https://github.com/devlanes-run/devlanes/blob/main/docs/getting-started.md#coding-agents)
- [CLI reference: exec, wait, with, stop, status](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/cli.md)
- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
