"""Creates the web app; uvicorn imports `app` from here."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from acme.lane_routes import lane_router
from acme.settings import web_settings
from acme.web.routes.pages import pages_router

HERE = Path(__file__).resolve().parent
# brand/ at the example root links to _internal/brand, the CSS and logo every example shares.
BRAND = HERE.parents[2] / "brand"


def create_app() -> FastAPI:
    """The web app with its pages, the brand files and the browser script."""
    settings = web_settings()
    templates = Jinja2Templates(directory=HERE / "templates")
    app = FastAPI(title="web")
    app.mount("/brand", StaticFiles(directory=BRAND), name="brand")
    app.mount("/static", StaticFiles(directory=HERE / "static"), name="static")
    app.include_router(lane_router(settings.lane))
    app.include_router(pages_router(settings, templates))
    return app


app = create_app()
