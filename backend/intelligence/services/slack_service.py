"""Slack service — adapter around mock data.

FUTURE: replace with Slack API (conversations.history).
"""
import json
from pathlib import Path

from ..types import SlackItem

DATA = Path(__file__).resolve().parent.parent.parent / "mock_data" / "slack.json"


def load() -> list[SlackItem]:
    raw = json.loads(DATA.read_text())
    return [SlackItem(**r) for r in raw]


def apply_overrides(items: list[SlackItem], overrides: list[dict]) -> list[SlackItem]:
    if not overrides:
        return items
    by_id = {e.id: e for e in items}
    for ov in overrides:
        if ov.get("op") == "remove" and ov.get("id") in by_id:
            del by_id[ov["id"]]
        elif ov.get("op") == "patch" and ov.get("id") in by_id:
            existing = by_id[ov["id"]].model_dump(by_alias=True)
            existing.update({k: v for k, v in ov.items() if k not in ("op", "id")})
            by_id[ov["id"]] = SlackItem(**existing)
    return list(by_id.values())
