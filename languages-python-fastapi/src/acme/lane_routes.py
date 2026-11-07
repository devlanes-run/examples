"""The /healthz and /lane routes both apps mount."""

from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse

from acme.lane import LaneInfo, lane_info
from acme.settings import LaneSettings


def lane_router(settings: LaneSettings) -> APIRouter:
    """A router with the ready check and the lane JSON for one service."""
    router = APIRouter()

    @router.get("/healthz", response_class=PlainTextResponse)
    def healthz() -> str:
        return "ok"

    @router.get("/lane")
    def lane(request: Request) -> LaneInfo:
        return lane_info(settings, request)

    return router
