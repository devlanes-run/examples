# Fake SMS and email providers per lane

An app that sends SMS and email through provider APIs, next to fake providers that run in every lane. The app's provider client reads its base URLs from `${{ services.sms_stub.public_url }}` and `${{ services.email_stub.public_url }}` and calls them over HTTPS, so each lane's messages land in that lane's stubs. The stubs share a `stub` tag with its own colour under `tags`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 24

## Run it

```sh
cd web-provider-stubs
devlanes start
```

Open https://api.provider-stubs.localhost and send an SMS from the form. The result links to https://sms.provider-stubs.localhost, the fake provider's inbox, where the message shows up. Email goes to https://mail.provider-stubs.localhost.

## During a start

devlanes starts the services from the scripts in `package.json` at the same time, each on its own `PORT`, and waits until each answers `GET /healthz`:

- `sms-stub` and `email-stub` run `stub.mjs`, a fake provider with `POST /v1/messages`. It refuses requests without `Authorization: Bearer <key>` (the key comes from its `API_KEY`), keeps accepted messages in memory and lists them on its page at `/` and as JSON at `GET /v1/messages`. Its `APP_URL` links back to the api.
- `api` runs `api.mjs`. Its page shows the lane, the provider URLs it got and a form per provider. A send posts to `<SMS_API_URL>/v1/messages` with `SMS_API_KEY`, through the devlanes proxy. Node trusts the proxy's certificate because devlanes sets `NODE_EXTRA_CA_CERTS` for services whose script lives in a `package.json`.

`SMS_API_URL` is `https://sms.provider-stubs.localhost` in lane 0 and `https://sms.provider-stubs1.localhost` in lane 1. The api uses `public_url` rather than `url` on purpose: its client calls an HTTPS hostname as it would call the real provider, and a stopped stub answers with the proxy's error page instead of a refused connection.

In the TUI both stubs show in magenta from `tags.stub.color`, and `devlanes stop +stub` or `devlanes start +stub` acts on both.

## Try next

On Windows, add `--ssl-revoke-best-effort` to the `curl` commands.

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/web-provider-stubs && devlanes start`. Each Git worktree is a lane with its own ports and hostnames. Send an SMS through lane 1's api:

  ```sh
  curl -fsS https://api.provider-stubs1.localhost/api/sms -H 'content-type: application/json' -d '{"to":"+15550100","body":"Your acme code is 123456"}'
  ```

  ```json
  {
    "provider": "https://sms.provider-stubs1.localhost/v1/messages",
    "status": 201,
    "body": {
      "id": "sms_1",
      "received_at": "2026-11-06T20:36:44.998Z",
      "to": "+15550100",
      "body": "Your acme code is 123456",
      "status": "accepted"
    }
  }
  ```

  The message is in lane 1's inbox, `curl -fsS https://sms.provider-stubs1.localhost/v1/messages`:

  ```json
  {
    "messages": [
      {
        "id": "sms_1",
        "received_at": "2026-11-06T20:36:44.998Z",
        "to": "+15550100",
        "body": "Your acme code is 123456"
      }
    ]
  }
  ```

  and lane 0's inbox stays empty, `curl -fsS https://sms.provider-stubs.localhost/v1/messages`:

  ```json
  {
    "messages": []
  }
  ```

- Stop the SMS stub with `devlanes stop sms-stub` and send again. The proxy answers for the stopped service with its 503 page, and the api passes the status and the `x-devlanes-error` header on with a 502:

  ```sh
  curl -sS https://api.provider-stubs.localhost/api/sms -H 'content-type: application/json' -d '{"to":"+15550100","body":"Your acme code is 123456"}'
  ```

  ```json
  {
    "provider": "https://sms.provider-stubs.localhost/v1/messages",
    "status": 503,
    "devlanes_error": "service-idle",
    "body": "# DL201 Service not running\n\n`service-idle`, 503 Service Unavailable, info. Sent by the devlanes 0.11.3 proxy, not by the service."
  }
  ```

  The form on the api page shows the whole error page, with the commands to start the service. `devlanes start sms-stub` brings the stub back with an empty inbox, and the next send gets `"status": 201` again.

## Files

- `devlanes.yaml`: the three services, their hostnames and the provider URLs and keys the api reads.
- `api.mjs`: the app, with the provider client in `send()`.
- `stub.mjs`: the fake provider, started as `node stub.mjs sms` or `node stub.mjs email`.
- `page.mjs`: the lane card, page layout and `/healthz` and `/lane` routes both servers share.
- `devlanes.css`, `logo.svg`, `app.css`: the page look.

## Docs

- [Reading other services](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#reading-other-services)
- [Programs started by devlanes](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-started-by-devlanes)
- [Tags, profiles and templates](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#tags-profiles-and-templates)
- [DL201 Service not running](https://github.com/devlanes-run/devlanes/blob/main/docs/errors/service-idle.md)
