"""Calendar service — adapter around mock data.

FUTURE: replace `load()` with a Google Calendar API call (events.list)
preserving the same return shape.
"""
import json
from pathlib import Path

from ..types import CalendarEvent

DATA = Path(__file__).resolve().parent.parent.parent / "mock_data" / "calendar.json"


def load() -> list[CalendarEvent]:
    raw = json.loads(DATA.read_text())
    return [CalendarEvent(**r) for r in raw]


def apply_overrides(events: list[CalendarEvent], overrides: list[dict]) -> list[CalendarEvent]:
    """Demo-console hook: judges can drop/modify events at runtime."""
    if not overrides:
        return events
    by_id = {e.id: e for e in events}
    for ov in overrides:
        if ov.get("op") == "remove" and ov.get("id") in by_id:
            del by_id[ov["id"]]
        elif ov.get("op") == "patch" and ov.get("id") in by_id:
            existing = by_id[ov["id"]].model_dump(by_alias=True)
            existing.update({k: v for k, v in ov.items() if k not in ("op", "id")})
            by_id[ov["id"]] = CalendarEvent(**existing)
    return list(by_id.values())
