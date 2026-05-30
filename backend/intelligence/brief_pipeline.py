"""Brief generation pipeline — orchestrates Layers 1, 2, 3.

This is the single entry point used by the FastAPI route. It also handles the
Demo Console overrides so judges can mutate inputs and watch the brief
regenerate.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from . import rules_engine, scoring_engine, synthesis_engine
from .services import (
    calendar_service,
    inbox_service,
    open_loops_service,
    slack_service,
)
from .types import Brief, CompanionAlert

PERSONA_PATH = Path(__file__).resolve().parent.parent / "mock_data" / "persona.json"


def _load_persona() -> dict[str, Any]:
    return json.loads(PERSONA_PATH.read_text())


async def generate_brief(
    overrides: Optional[dict[str, list[dict]]] = None,
    use_llm: bool = True,
) -> Brief:
    overrides = overrides or {}
    persona = _load_persona()

    calendar = calendar_service.apply_overrides(
        calendar_service.load(), overrides.get("calendar", [])
    )
    inbox = inbox_service.apply_overrides(
        inbox_service.load(), overrides.get("inbox", [])
    )
    slack = slack_service.apply_overrides(
        slack_service.load(), overrides.get("slack", [])
    )
    open_loops = open_loops_service.load()

    # Layer 1
    flags = rules_engine.run_rules(calendar, inbox, slack, open_loops)

    # Layer 2
    all_scores = (
        scoring_engine.score_inbox(inbox, flags)
        + scoring_engine.score_slack(slack, flags)
        + scoring_engine.score_calendar(calendar, flags)
        + scoring_engine.score_open_loops(open_loops, flags)
    )
    top = scoring_engine.rank_top(all_scores, k=8)

    today_iso = datetime.now(timezone.utc).date().isoformat()

    # Layer 3
    brief = await synthesis_engine.synthesize(
        persona=persona,
        flags=flags,
        top_scores=top,
        inbox=inbox,
        slack=slack,
        calendar=calendar,
        open_loops=open_loops,
        today_iso=today_iso,
        use_llm=use_llm,
    )
    return brief


# ============================================================
# Daily Companion alerts
# ============================================================

def companion_alerts(brief: Brief) -> list[CompanionAlert]:
    alerts: list[CompanionAlert] = []

    # Escalation: any FORCE rule flags
    force_flags = [f for f in brief.ruleFlags if f.severity == "force"]
    for f in force_flags[:1]:
        alerts.append(CompanionAlert(
            state="escalation",
            title="Escalation",
            body=f.reason,
            cta="Open",
            sourceId=f.targetId,
        ))

    # Decision needed: cancel candidate
    if brief.toCancel.meeting and brief.toCancel.meeting != "—":
        alerts.append(CompanionAlert(
            state="decision",
            title="Decision needed",
            body=f"Cancel {brief.toCancel.meeting} at {brief.toCancel.time}? — {brief.toCancel.reason}",
            cta="Cancel",
            sourceId=None,
        ))

    # Attention: top handlePersonally item
    if brief.handlePersonally:
        first = brief.handlePersonally[0]
        alerts.append(CompanionAlert(
            state="attention",
            title="Attention required",
            body=f"{first.from_}: {first.subject}",
            cta=None,
        ))

    if not alerts:
        alerts.append(CompanionAlert(
            state="silent",
            title="All clear",
            body="Nothing warrants your attention right now.",
        ))

    return alerts
