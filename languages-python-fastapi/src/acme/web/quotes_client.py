"""The web app's HTTPS call to the lane's quotes service."""

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass(frozen=True)
class QuotesCall:
    """The status and body quotes answered with, or the error the call failed with."""

    status: int | None = None
    body: dict[str, Any] | None = None
    error: str | None = None


async def fetch_quotes(quotes_url: str) -> QuotesCall:
    """Requests the quotes index through the proxy; failures are shown on the page."""
    # httpx verifies against SSL_CERT_FILE, which devlanes points at the system roots plus its CA.
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{quotes_url}/")
        response.raise_for_status()
        return QuotesCall(status=response.status_code, body=response.json())
    except httpx.HTTPError as error:
        return QuotesCall(error=f"{type(error).__name__}: {error}")
