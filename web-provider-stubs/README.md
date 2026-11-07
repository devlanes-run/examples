# Fake SMS and email providers per lane

An app that sends SMS and email through provider APIs, next to fake providers that run in every lane. The app's provider clients read their base URLs from `${{ services.sms_stub.public_url }}` and `${{ services.email_stub.public_url }}` and call them over HTTPS, so each lane's messages land in that lane's stubs. The stubs share a `stub` tag with its own colour under `tags`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later (tested with Node 24 and npm 11)

## Run it

```sh
cd web-provider-stubs
devlanes start
```

`devlanes start --no-ui` prints the start as text instead of opening the TUI:

```text
example-provider-stubs@0 (main): 3/3 ready
ready api http://127.0.0.1:20470 https://api.example-provider-stubs.localhost
ready sms-stub http://127.0.0.1:20472 https://sms.example-provider-stubs.localhost
ready email-stub http://127.0.0.1:20471 https://mail.example-provider-stubs.localhost
```

Open https://api.example-provider-stubs.localhost and send an SMS from the form. The result links to https://sms.example-provider-stubs.localhost, the fake provider's inbox, where the message shows up. Email goes to https://mail.example-provider-stubs.localhost.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0.

1. The first start of a lane runs the `install` task. One `npm install` at the example root installs every package of the npm workspace.
2. devlanes starts the three services at the same time, each on its own `PORT`, and waits until each answers `GET /healthz`.
3. `sms-stub` and `email-stub` both run `apps/stub`, a fake provider with `POST /v1/messages`. `PROVIDER` picks the fields it requires. It refuses requests without `Authorization: Bearer <key>` (the key comes from its `API_KEY`), keeps accepted messages in memory and lists them on its page at `/` and as JSON at `GET /v1/messages`. Its `APP_URL` links back to the api.
4. `api` runs `apps/api`. Its page shows the lane, the provider URLs it got and a form per provider. A send posts to `<SMS_API_URL>/v1/messages` with `SMS_API_KEY`, through the devlanes proxy. Node trusts the proxy's certificate because devlanes sets `NODE_EXTRA_CA_CERTS` for services whose script lives in a `package.json`.

`SMS_API_URL` is `https://sms.example-provider-stubs.localhost` in lane 0 and `https://sms.example-provider-stubs1.localhost` in lane 1. The api uses `public_url` rather than `url` on purpose: its client calls an HTTPS hostname as it would call the real provider, and a stopped stub answers with the proxy's error page instead of a refused connection.

In the TUI both stubs show in magenta from `tags.stub.color`, and `devlanes stop +stub` or `devlanes start +stub` acts on both.

## Try next

On Windows, add `--ssl-revoke-best-effort` to the `curl` commands.

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/web-provider-stubs && devlanes start`. The new worktree is lane 1, with its own ports and hostnames. In a checkout you share, `devlanes lane new --name example-provider-stubs-review --start` gives a second lane without a worktree. Send an SMS through lane 1's api:

  ```sh
  curl -fsS https://api.example-provider-stubs1.localhost/api/sms -H 'content-type: application/json' -d '{"to":"+15550100","body":"Your acme code is 123456"}'
  ```

  ```json
  {
    "provider": "https://sms.example-provider-stubs1.localhost/v1/messages",
    "status": 201,
    "body": {
      "id": "sms_1",
      "received_at": "2026-11-07T01:05:35.108Z",
      "to": "+15550100",
      "body": "Your acme code is 123456",
      "status": "accepted"
    }
  }
  ```

  The message is in lane 1's inbox, `curl -fsS https://sms.example-provider-stubs1.localhost/v1/messages`:

  ```json
  {
    "messages": [
      {
        "id": "sms_1",
        "received_at": "2026-11-07T01:05:35.108Z",
        "to": "+15550100",
        "body": "Your acme code is 123456"
      }
    ]
  }
  ```

  and lane 0's inbox stays empty, `curl -fsS https://sms.example-provider-stubs.localhost/v1/messages`:

  ```json
  { "messages": [] }
  ```

- Stop the SMS stub with `devlanes stop sms-stub` and send again. The proxy answers for the stopped service with its 503 page, and the api passes the status and the `x-devlanes-error` header on with a 502:

  ```sh
  curl -sS https://api.example-provider-stubs.localhost/api/sms -H 'content-type: application/json' -d '{"to":"+15550100","body":"Your acme code is 123456"}'
  ```

  ```json
  {
    "provider": "https://sms.example-provider-stubs.localhost/v1/messages",
    "status": 503,
    "devlanes_error": "service-idle",
    "body": "# DL201 Service not running\n\n`service-idle`, 503 Service Unavailable, info. Sent by the devlanes 0.11.3 proxy, not by the service."
  }
  ```

  The form on the api page shows the whole error page, with the commands to start the service. `devlanes start sms-stub` brings the stub back with an empty inbox, and the next send gets `"status": 201` again.

- When you are done, `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `1` for the second lane.

## Files

- `devlanes.yaml`: the `install` task, the three services, their hostnames and the provider URLs and keys the api reads.
- `apps/api/src/providers/`: the typed provider clients (`sms.ts`, `email.ts`) and the HTTP call they share (`http.ts`).
- `apps/api/src/routes/send.tsx`: the form routes (`/send/sms`) and their JSON twins (`/api/sms`).
- `apps/stub/src/`: the fake provider, with the in-memory inbox in `inbox.ts` and `/v1/messages` in `routes/messages.ts`.
- `packages/shared/`: `Layout`, `LaneCard` and the lane values both apps show.
- `apps/*/brand`: links to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [Reading other services](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#reading-other-services)
- [Programs started by devlanes](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-started-by-devlanes)
- [Tags, profiles and templates](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#tags-profiles-and-templates)
- [DL201 Service not running](https://github.com/devlanes-run/devlanes/blob/main/docs/errors/service-idle.md)
