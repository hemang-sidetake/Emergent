"""Open-loops service — derived signal.

FUTURE: derive from cross-source recency + reply-status (calendar/inbox/slack).
For the demo it reads the pre-computed mock file.
"""
import json
from pathlib import Path

from ..types import OpenLoop

DATA = Path(__file__).resolve().parent.parent.parent / "mock_data" / "open_loops.json"


def load() -> list[OpenLoop]:
    raw = json.loads(DATA.read_text())
    return [OpenLoop(**r) for r in raw]
