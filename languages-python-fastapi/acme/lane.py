import os

from fastapi import Request


def lane_info(request: Request) -> dict:
    env = os.environ
    # Only requests that came through the devlanes proxy carry X-Forwarded-Host.
    forwarded = request.headers.get("x-forwarded-host")
    return {
        "project": env.get("DEVLANES_LANE_PROJECT"),
        "lane": int(env.get("DEVLANES_LANE", "0")),
        "lane_name": env.get("DEVLANES_LANE_NAME"),
        "branch": env.get("LANE_LABEL"),
        "service": env.get("DEVLANES_SERVICE"),
        "port": int(env.get("PORT", "0")),
        "url": f"https://{forwarded}" if forwarded else None,
    }
