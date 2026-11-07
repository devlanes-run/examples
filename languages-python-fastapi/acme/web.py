import os
from pathlib import Path

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from acme.lane import lane_info

ROOT = Path(__file__).resolve().parent.parent
QUOTES_URL = os.environ["QUOTES_URL"]

app = FastAPI(title="web")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")
templates = Jinja2Templates(directory=ROOT / "templates")


async def call_quotes() -> dict:
    # httpx verifies against SSL_CERT_FILE, which devlanes points at the system roots plus its CA.
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{QUOTES_URL}/")
        response.raise_for_status()
        return {"ok": True, "status": response.status_code, "body": response.json()}
    except httpx.HTTPError as error:
        return {"ok": False, "error": f"{type(error).__name__}: {error}"}


@app.get("/healthz", response_class=PlainTextResponse)
def healthz() -> str:
    return "ok"


@app.get("/lane")
def lane(request: Request) -> dict:
    return lane_info(request)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "info": lane_info(request),
            "request_url": str(request.url),
            "forwarded_proto": request.headers.get("x-forwarded-proto"),
            "quotes_url": QUOTES_URL,
            "quotes": await call_quotes(),
            "ssl_cert_file": os.environ.get("SSL_CERT_FILE"),
        },
    )
