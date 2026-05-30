"""Layer 3 — Synthesis Engine.

Takes the top-scored items + rule flags + persona context and produces the
final Brief via Claude Sonnet 4.5. The prompt is opinionated, voice-calibrated
to Priya, and constrained to the strict JSON schema.

If the LLM call fails we fall back to a deterministic Brief built from the
top-scored items so the demo never breaks.
"""
from __future__ import annotations

import json
import os
import re
import time
import uuid
from datetime import datetime, timezone
from typing import Any

from .types import (
    Brief,
    HandlePersonallyItem,
    InboxItem,
    ItemScore,
    OneThing,
    OpenLoop,
    RuleFlag,
    SlackItem,
    CalendarEvent,
    ToCancel,
    ToRevive,
)
from .prompts import SYSTEM_PROMPT, FEW_SHOT_EXAMPLE


# ============================================================
# Prompt construction
# ============================================================

def build_user_prompt(
    persona: dict[str, Any],
    flags: list[RuleFlag],
    top_scores: list[ItemScore],
    inbox: list[InboxItem],
    slack: list[SlackItem],
    calendar: list[CalendarEvent],
    open_loops: list[OpenLoop],
    today_iso: str,
) -> str:
    inbox_lines = [
        f"- [{em.id}] {em.from_} ({em.fromCategory}) — \"{em.subject}\": {em.snippet} "
        f"(received {em.receivedAt}, {em.ageHours}h ago, unanswered={em.unanswered})"
        for em in inbox
        if em.fromCategory not in ("newsletter", "spam")
    ]
    slack_lines = [
        f"- [{sl.id}] {sl.from_} in {sl.channel} ({sl.channelType}) @ {sl.timestamp} "
        f"[heat={sl.heat}]: {sl.text}"
        for sl in slack
    ]
    calendar_lines = [
        f"- [{ev.id}] {ev.time} — {ev.title} ({ev.durationMin}m)"
        f"{' [no agenda]' if not ev.agenda else ''}"
        f"{f' [rescheduled {ev.rescheduleCount}x]' if ev.rescheduleCount else ''}"
        f"{' [personal]' if ev.personal else ''}"
        f"{f' — {ev.notes}' if ev.notes else ''}"
        for ev in calendar
    ]
    loops_lines = [
        f"- [{ol.id}] {ol.item} — last touched {ol.lastTouched}"
        f"{f', expires {ol.expiresIn}' if ol.expiresIn else ''}"
        for ol in open_loops
    ]
    flag_lines = [f"- [{f.severity.upper()}] {f.rule}: {f.reason}" for f in flags]
    score_lines = [
        f"- {s.title} (total={s.total}; stakes={s.stakes} "
        f"founderSpecific={s.founderSpecific} timeSensitivity={s.timeSensitivity} "
        f"relationship={s.relationshipWeight}) — {s.rationale}"
        for s in top_scores
    ]

    return f"""TODAY: {today_iso}
FOUNDER: {persona['firstName']} ({persona['role']} of {persona['company']}, {persona['stage']}, raising {persona['raising']})

=== RULE FLAGS (deterministic, MUST respect FORCE flags) ===
{chr(10).join(flag_lines) if flag_lines else '(none)'}

=== TOP-SCORED ITEMS (Layer 2 output, ranked) ===
{chr(10).join(score_lines)}

=== RAW INBOX (last 48h) ===
{chr(10).join(inbox_lines)}

=== RAW SLACK (last 48h) ===
{chr(10).join(slack_lines)}

=== CALENDAR (today) ===
{chr(10).join(calendar_lines)}

=== OPEN LOOPS (3+ days old) ===
{chr(10).join(loops_lines)}

=== YOUR TASK ===
Produce the Brief now. JSON only. No prose. No greeting. No code fences.
"""


# ============================================================
# Claude Sonnet 4.5 call (via emergentintegrations)
# ============================================================

async def synthesize_with_llm(user_prompt: str) -> tuple[str, str]:
    """Returns (raw_response_text, model_used)."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage  # type: ignore

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY missing")

    session_id = f"brief-{uuid.uuid4()}"
    chat = (
        LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=SYSTEM_PROMPT + "\n\n" + FEW_SHOT_EXAMPLE,
        )
        .with_model("anthropic", "claude-sonnet-4-5-20250929")
        .with_params(max_tokens=2000)
    )
    msg = UserMessage(text=user_prompt)
    response = await chat.send_message(msg)
    return response, "claude-sonnet-4-5"


def _extract_json(raw: str) -> dict[str, Any]:
    """Strip code fences and parse JSON."""
    text = raw.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?", "", text)
    text = re.sub(r"```$", "", text)
    # Find the first { and last } to be tolerant of leading prose
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in LLM response")
    return json.loads(text[start : end + 1])


# ============================================================
# Deterministic fallback (demo-safe)
# ============================================================

def _fallback_brief(
    persona: dict[str, Any],
    flags: list[RuleFlag],
    top_scores: list[ItemScore],
    inbox: list[InboxItem],
    slack: list[SlackItem],
    calendar: list[CalendarEvent],
    open_loops: list[OpenLoop],
    today_iso: str,
) -> Brief:
    """When the LLM is unavailable, build a passable brief from the scored
    items. Matches the demo target as closely as possible."""

    inbox_by_id = {e.id: e for e in inbox}
    slack_by_id = {s.id: s for s in slack}
    cal_by_id = {c.id: c for c in calendar}
    loop_by_id = {o.id: o for o in open_loops}

    # ONE THING — pick highest-scoring email/slack (tier-1 investor if any)
    one_thing_item = next(
        (s for s in top_scores if s.source == "email" and inbox_by_id[s.itemId].investorTier == 1),
        top_scores[0] if top_scores else None,
    )
    if one_thing_item and one_thing_item.source == "email":
        em = inbox_by_id[one_thing_item.itemId]
        one_thing = OneThing(
            headline=f"Reply to {em.from_.split()[0]}. {em.subject.split('—')[0].strip()}.",
            reasoning=em.snippet[:160],
        )
    else:
        one_thing = OneThing(
            headline="Move on the highest-leverage open item today.",
            reasoning="The scorer found no single dominant item; pick the top score yourself.",
        )

    # HANDLE PERSONALLY — top 3 email/slack with founderSpecific >= 4
    handle: list[HandlePersonallyItem] = []
    seen_ids: set[str] = set()
    if one_thing_item:
        seen_ids.add(one_thing_item.itemId)
    for s in top_scores:
        if len(handle) >= 3:
            break
        if s.source not in ("email", "slack") or s.itemId in seen_ids:
            continue
        if s.founderSpecific < 4:
            continue
        if s.source == "email":
            em = inbox_by_id[s.itemId]
            handle.append(HandlePersonallyItem(
                source="email",
                **{"from": em.from_},
                subject=em.subject,
                why=s.rationale[:80],
            ))
        else:
            sl = slack_by_id[s.itemId]
            handle.append(HandlePersonallyItem(
                source="slack",
                **{"from": sl.from_},
                subject=sl.text[:60],
                why=s.rationale[:80],
            ))
        seen_ids.add(s.itemId)

    # CANCEL — first forced cancel flag, else first cancel.* flag
    cancel_flag = next((f for f in flags if f.rule == "cancel.third_reschedule"), None)
    if not cancel_flag:
        cancel_flag = next((f for f in flags if f.rule.startswith("cancel.")), None)
    if cancel_flag and cancel_flag.targetId in cal_by_id:
        ev = cal_by_id[cancel_flag.targetId]
        reasons = [cancel_flag.reason]
        if ev.rescheduleCount >= 3:
            reasons.append("no agenda")
        to_cancel = ToCancel(
            meeting=ev.title,
            time=ev.time,
            reason=", ".join(reasons[:2]) or "low value, no agenda",
        )
    else:
        to_cancel = ToCancel(meeting="—", time="—", reason="No cancel candidate today.")

    # REVIVE — highest-scoring open loop with stakes >= 4
    revive_score = next(
        (s for s in top_scores if s.source == "open_loop" and s.stakes >= 4),
        None,
    )
    if revive_score and revive_score.itemId in loop_by_id:
        ol = loop_by_id[revive_score.itemId]
        to_revive = ToRevive(
            item=ol.item,
            lastTouched=ol.lastTouched,
            suggestedAction=f"Reply today even without a fix. {ol.category.title()} risk.",
        )
    else:
        to_revive = ToRevive(item="—", lastTouched="—", suggestedAction="No cold loop today.")

    return Brief(
        date=today_iso,
        founderName=persona["firstName"],
        oneThing=one_thing,
        handlePersonally=handle,
        toCancel=to_cancel,
        toRevive=to_revive,
        generatedAt=datetime.now(timezone.utc).isoformat(),
        scoresPreview=top_scores,
        ruleFlags=flags,
        model="fallback-deterministic",
    )


# ============================================================
# Public entry point
# ============================================================

async def synthesize(
    persona: dict[str, Any],
    flags: list[RuleFlag],
    top_scores: list[ItemScore],
    inbox: list[InboxItem],
    slack: list[SlackItem],
    calendar: list[CalendarEvent],
    open_loops: list[OpenLoop],
    today_iso: str,
    use_llm: bool = True,
) -> Brief:
    started = time.time()
    if not use_llm:
        brief = _fallback_brief(persona, flags, top_scores, inbox, slack, calendar, open_loops, today_iso)
        brief.latencyMs = int((time.time() - started) * 1000)
        return brief

    user_prompt = build_user_prompt(
        persona, flags, top_scores, inbox, slack, calendar, open_loops, today_iso
    )

    try:
        raw, model = await synthesize_with_llm(user_prompt)
        data = _extract_json(raw)

        # Normalize: model returns "from" which is a reserved python kw on input
        if "handlePersonally" in data and isinstance(data["handlePersonally"], list):
            for it in data["handlePersonally"]:
                # already correct
                pass

        brief = Brief(
            date=data.get("date", today_iso),
            founderName=data.get("founderName", persona["firstName"]),
            oneThing=OneThing(**data["oneThing"]),
            handlePersonally=[HandlePersonallyItem(**it) for it in data["handlePersonally"][:3]],
            toCancel=ToCancel(**data["toCancel"]),
            toRevive=ToRevive(**data["toRevive"]),
            generatedAt=datetime.now(timezone.utc).isoformat(),
            scoresPreview=top_scores,
            ruleFlags=flags,
            model=model,
            latencyMs=int((time.time() - started) * 1000),
        )
        return brief
    except Exception as e:  # noqa: BLE001 — demo must not crash
        print(f"[synthesis] LLM failed, using fallback: {e}")
        brief = _fallback_brief(persona, flags, top_scores, inbox, slack, calendar, open_loops, today_iso)
        brief.latencyMs = int((time.time() - started) * 1000)
        return brief
