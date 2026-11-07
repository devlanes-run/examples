# FastAPI under uv

Two FastAPI apps run with uv in every lane (each worktree's own copy of the stack, with its own ports and hostnames). `web` renders Jinja2 pages under uvicorn with `--reload` and `--proxy-headers`, and calls `quotes` over HTTPS with httpx, which trusts the devlanes CA through `SSL_CERT_FILE`. `quotes` starts through `run_script` on `pyproject.toml` and reads its CORS allow-list from `DEVLANES_ORIGINS`.

## Requirements

- devlanes, with `devlanes setup` run once
- uv (tested with 0.11) and Python 3.12

## Run it

```sh
cd languages-python-fastapi
devlanes start
```

On a terminal, `devlanes start` opens the TUI. `devlanes start --no-ui` prints the start as text:

```text
example-python-fastapi@0 (main): 2/2 ready
ready web http://127.0.0.1:20591 https://example-python-fastapi.localhost
ready quotes http://127.0.0.1:20590 https://quotes.example-python-fastapi.localhost
```

Open https://example-python-fastapi.localhost. The page shows lane 0 of `example-python-fastapi`, the `request.url` uvicorn saw, the answer of the lane's `quotes` service, and whether your browser's own call to `quotes` passed CORS.

## During a start

1. On a lane's first start the `sync` task (`when: lane.create`) runs `uv sync --frozen`, which builds `.venv` from `uv.lock`. Later starts skip it.
2. `web` runs `uv run uvicorn acme.web.main:app` with `--port ${{ self.port }}` and serves https://example-python-fastapi.localhost. `quotes` runs `uv run quotes`, the entry point in `[project.scripts]`, which reads `PORT` and `HOST`, and serves https://quotes.example-python-fastapi.localhost.
3. Each service counts as ready once `/healthz` answers. The 3 minute timeout leaves room for `uv run` to sync again after a `uv.lock` change.

devlanes detects the `python` platform from `pyproject.toml` and gives both services `SSL_CERT_FILE` and `REQUESTS_CA_BUNDLE` (system roots plus the devlanes CA) and `PYTHONUNBUFFERED=1`. `web` gets `QUOTES_URL` from `${{ services.quotes.public_url }}`, so its httpx call goes through the proxy over HTTPS. The proxy sends `X-Forwarded-Proto: https` and `--proxy-headers` makes uvicorn use it, so `request.url` and the page's `url_for` links start with `https://`. Both services answer `/lane` with their lane as JSON. `src/acme/settings.py` reads every variable once and stops the app with the name of the first one missing.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/languages-python-fastapi && devlanes start`. https://example-python-fastapi1.localhost says lane 1, and its `quotes` answer comes from lane 1 too. Without a worktree, `devlanes lane new --name example-python-fastapi-review --start` gives this folder a second lane, and `devlanes lane clean example-python-fastapi-review --yes` removes it.
- `devlanes env show web --explain` lists `SSL_CERT_FILE`, `REQUESTS_CA_BUNDLE` and `PYTHONUNBUFFERED` in the `contributor` layer. Your own shell does not have them, so the same httpx call from there fails with `httpx.ConnectError: [SSL: CERTIFICATE_VERIFY_FAILED]`:

  ```sh
  uv run python -c "import httpx; print(httpx.get('https://quotes.example-python-fastapi.localhost/healthz').text)"
  ```

- Change the footer in `src/acme/web/templates/base.html` and reload the page: Jinja reads the template again without a restart. Change `src/acme/web/main.py` and `--reload` restarts the server; `devlanes logs web --tail 10` shows `StatReload detected changes in 'src\acme\web\main.py'. Reloading...` (on Windows).
- `quotes` sends CORS headers only to this lane's origins. This prints `access-control-allow-origin: https://example-python-fastapi.localhost`, and prints nothing with lane 1's origin, `https://example-python-fastapi1.localhost` (on Windows add `--ssl-revoke-best-effort`):

  ```sh
  curl -sS -o /dev/null -D - -H "Origin: https://example-python-fastapi.localhost" https://quotes.example-python-fastapi.localhost/api/quotes | grep -i access-control
  ```

## Files

- `devlanes.yaml`: the `sync` task, `web` as a `run` string, `quotes` as a `run_script`, each with `hosts` and an `http` ready check.
- `pyproject.toml`, `uv.lock`, `.python-version`: pinned FastAPI, uvicorn, Jinja2 and httpx, the `quotes` entry point and the ruff settings.
- `src/acme/settings.py`: every variable the apps read, parsed once.
- `src/acme/web/`: `main.py` creates the app, `routes/pages.py` renders the page, `quotes_client.py` makes the httpx call, `templates/` holds `base.html` and the page, `static/cors-check.js` is the browser's call.
- `src/acme/quotes/`: `main.py` creates the API with CORS from `DEVLANES_ORIGINS` and holds the `main()` that `uv run quotes` calls; `routes.py` serves the quotes.
- `src/acme/lane.py`, `src/acme/lane_routes.py`: the `/lane` JSON and the `/healthz` route both apps mount.
- `brand`: a link to `_internal/brand`, the CSS and logo all examples share, served under `/brand`.

## Docs

- [Languages: Python](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/languages.md#python)
- [Run and run_script: pyproject.toml](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/run-scripts.md#pyprojecttoml)
- [Programs started by devlanes](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-started-by-devlanes)
- [Lifecycle tasks](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#lifecycle-tasks)
