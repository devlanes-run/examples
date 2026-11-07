"""The pages the web app renders."""

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from acme.lane import lane_info
from acme.settings import WebSettings
from acme.web.quotes_client import fetch_quotes


def pages_router(settings: WebSettings, templates: Jinja2Templates) -> APIRouter:
    """A router with the home page."""
    router = APIRouter()

    @router.get("/", response_class=HTMLResponse)
    async def index(request: Request) -> HTMLResponse:
        return templates.TemplateResponse(
            request,
            "index.html",
            {
                "info": lane_info(settings.lane, request),
                "forwarded_proto": request.headers.get("x-forwarded-proto"),
                "quotes_url": settings.quotes_url,
                "quotes": await fetch_quotes(settings.quotes_url),
                "ssl_cert_file": settings.ssl_cert_file,
            },
        )

    return router
