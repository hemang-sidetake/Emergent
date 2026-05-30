"""Inbox service — adapter around mock data.

FUTURE: replace with Gmail API (messages.list + get).
"""
import json
from pathlib import Path

from ..types import InboxItem

DATA = Path(__file__).resolve().parent.parent.parent / "mock_data" / "inbox.json"


def load() -> list[InboxItem]:
    raw = json.loads(DATA.read_text())
    return [InboxItem(**r) for r in raw]


def apply_overrides(items: list[InboxItem], overrides: list[dict]) -> list[InboxItem]:
    if not overrides:
        return items
    by_id = {e.id: e for e in items}
    for ov in overrides:
        if ov.get("op") == "remove" and ov.get("id") in by_id:
            del by_id[ov["id"]]
        elif ov.get("op") == "patch" and ov.get("id") in by_id:
            existing = by_id[ov["id"]].model_dump(by_alias=True)
            existing.update({k: v for k, v in ov.items() if k not in ("op", "id")})
            by_id[ov["id"]] = InboxItem(**existing)
        elif ov.get("op") == "add":
            payload = {k: v for k, v in ov.items() if k != "op"}
            payload.setdefault("id", f"email-custom-{len(by_id) + 1}")
            payload.setdefault("ageHours", 1)
            by_id[payload["id"]] = InboxItem(**payload)
    return list(by_id.values())
