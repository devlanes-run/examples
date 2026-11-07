"""The mock quotes the API serves."""

from typing import TypedDict


class Quote(TypedDict):
    """One quote as the API returns it."""

    id: int
    text: str
    author: str


QUOTES: list[Quote] = [
    {"id": 1, "text": "Ship the smallest change that works.", "author": "acme handbook"},
    {
        "id": 2,
        "text": "A branch you can run is a branch you can review.",
        "author": "acme handbook",
    },
    {"id": 3, "text": "Read the error before you search for it.", "author": "acme handbook"},
]
