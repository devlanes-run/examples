import os

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from acme.lane import lane_info

QUOTES = [
    {
        "id": 1,
        "text": "Ship the smallest change that works.",
        "author": "acme handbook",
    },
    {
        "id": 2,
        "text": "A branch you can run is a branch you can review.",
        "author": "acme handbook",
    },
    {
        "id": 3,
        "text": "Read the error before you search for it.",
        "author": "acme handbook",
    },
]

app = FastAPI(title="quotes")

# Every https origin of this lane, so lane 1's web page may call lane 1's quotes and no other.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in os.environ.get("DEVLANES_ORIGINS", "").split(",") if o],
    allow_methods=["GET"],
)


@app.get("/healthz", response_class=PlainTextResponse)
def healthz() -> str:
    return "ok"


@app.get("/lane")
def lane(request: Request) -> dict:
    return lane_info(request)


@app.get("/api/quotes")
def quotes() -> list[dict]:
    return QUOTES


@app.get("/")
def index(request: Request) -> dict:
    return {**lane_info(request), "quotes": QUOTES}


def main() -> None:
    # Started by `uv run quotes`, so the port comes from PORT and HOST instead of flags.
    uvicorn.run(
        app,
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ["PORT"]),
        proxy_headers=True,
    )
