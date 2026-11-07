"""The quotes API routes."""

from fastapi import APIRouter, Request

from acme.lane import LaneInfo, lane_info
from acme.quotes.data import QUOTES, Quote
from acme.settings import LaneSettings


class QuotesIndex(LaneInfo):
    """The answer on /: the lane values plus every quote."""

    quotes: list[Quote]


def quotes_router(settings: LaneSettings) -> APIRouter:
    """A router with the quotes list and the API's index."""
    router = APIRouter()

    @router.get("/api/quotes")
    def quotes() -> list[Quote]:
        return QUOTES

    @router.get("/")
    def index(request: Request) -> QuotesIndex:
        return {**lane_info(settings, request), "quotes": QUOTES}

    return router
