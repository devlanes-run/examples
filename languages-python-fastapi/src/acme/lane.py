"""The lane values both apps show on their pages and return from /lane."""

from typing import TypedDict

from fastapi import Request

from acme.settings import LaneSettings


class LaneInfo(TypedDict):
    """The JSON every devlanes example answers on /lane."""

    project: str
    lane: int
    lane_name: str
    branch: str
    service: str
    port: int
    url: str | None


def lane_info(settings: LaneSettings, request: Request) -> LaneInfo:
    """The lane values for this request, with the URL the proxy received it on."""
    # Only requests that came through the devlanes proxy carry X-Forwarded-Host.
    forwarded = request.headers.get("x-forwarded-host")
    return {
        "project": settings.project,
        "lane": settings.lane,
        "lane_name": settings.lane_name,
        "branch": settings.branch,
        "service": settings.service,
        "port": settings.port,
        "url": f"https://{forwarded}" if forwarded else None,
    }
