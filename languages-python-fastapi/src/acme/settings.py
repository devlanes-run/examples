"""Every environment variable the apps read, parsed once at startup."""

import os
from dataclasses import dataclass
from functools import cache


def _required(name: str) -> str:
    """Reads a variable devlanes sets, failing early with a hint when the app runs outside it."""
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} is not set; start this service with devlanes start")
    return value


@dataclass(frozen=True)
class LaneSettings:
    """The values devlanes gives every service of the lane."""

    port: int
    host: str
    project: str
    lane: int
    lane_name: str
    service: str
    # Set in devlanes.yaml from ${{ lane.label }} and ${{ lane.domain }}.
    branch: str
    domain: str


@dataclass(frozen=True)
class WebSettings:
    """The web app's settings."""

    lane: LaneSettings
    quotes_url: str
    # Shown on the page; httpx reads the variable itself.
    ssl_cert_file: str | None


@dataclass(frozen=True)
class QuotesSettings:
    """The quotes API's settings."""

    lane: LaneSettings
    # Every https origin of this lane.
    origins: list[str]


def _lane_settings() -> LaneSettings:
    return LaneSettings(
        port=int(_required("PORT")),
        host=os.environ.get("HOST", "127.0.0.1"),
        project=_required("DEVLANES_LANE_PROJECT"),
        lane=int(_required("DEVLANES_LANE")),
        lane_name=_required("DEVLANES_LANE_NAME"),
        service=_required("DEVLANES_SERVICE"),
        branch=_required("LANE_LABEL"),
        domain=_required("LANE_DOMAIN"),
    )


@cache
def web_settings() -> WebSettings:
    """The web app's settings, read once when the app is created."""
    return WebSettings(
        lane=_lane_settings(),
        quotes_url=_required("QUOTES_URL"),
        ssl_cert_file=os.environ.get("SSL_CERT_FILE"),
    )


@cache
def quotes_settings() -> QuotesSettings:
    """The quotes API's settings, read once when the app is created."""
    lane = _lane_settings()
    origins = _required("DEVLANES_ORIGINS").split(",")
    return QuotesSettings(lane=lane, origins=[o for o in origins if o])
