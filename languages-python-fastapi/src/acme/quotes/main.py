"""Creates the quotes API and starts it under uvicorn."""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from acme.lane_routes import lane_router
from acme.quotes.routes import quotes_router
from acme.settings import quotes_settings


def create_app() -> FastAPI:
    """The quotes API with CORS limited to this lane's origins."""
    settings = quotes_settings()
    app = FastAPI(title="quotes")
    # Lane 1's web page may call lane 1's quotes and no other lane's.
    app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_methods=["GET"])
    app.include_router(lane_router(settings.lane))
    app.include_router(quotes_router(settings.lane))
    return app


def main() -> None:
    """The `quotes` entry point in pyproject.toml."""
    settings = quotes_settings()
    # Started by `uv run quotes`, so the port comes from PORT and HOST instead of flags.
    uvicorn.run(create_app(), host=settings.lane.host, port=settings.lane.port, proxy_headers=True)
