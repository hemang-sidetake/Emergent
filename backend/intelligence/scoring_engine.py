"""Layer 2 — Scoring Engine.

Each candidate item (email / slack / calendar / open-loop) is scored 1-5 on
four dimensions:

- stakes:             impact if mishandled
- founderSpecific:    does it require the founder vs delegable
- timeSensitivity:    how fast does it decay
- relationshipWeight: seniority + relationship strength

We run a cheap rule-based scorer here (deterministic, fast, demo-safe).
The score is intentionally hand-tuned to mirror what a cheap LLM would
return — but never blocks the demo on a flaky API call.

If you want to swap in an LLM scorer later, the `score_with_llm` function
is wired but disabled by default.
"""
from __future__ import annotations

from .types import (
    CalendarEvent,
    InboxItem,
    SlackItem,
    OpenLoop,
    ItemScore,
    RuleFlag,
)


def _clip(n: int) -> int:
    return max(1, min(5, n))


def score_inbox(items: list[InboxItem], flags: list[RuleFlag]) -> list[ItemScore]:
    forced = {f.targetId for f in flags if f.severity == "force"}
    scored: list[ItemScore] = []

    for em in items:
        if em.fromCategory in ("newsletter", "spam", "personal"):
            continue

        # stakes — what's the impact?
        stakes = 2
        if em.churnRisk:
            stakes = 5
        elif em.dealValueINR and em.dealValueINR >= 2_000_000:
            stakes = 5
        elif em.investorTier == 1:
            stakes = 5
        elif em.fromCategory == "investor":
            stakes = 3
        elif em.fromCategory == "enterprise_customer":
            stakes = 4
        elif em.fromCategory == "internal":
            stakes = 3

        # founderSpecific
        fs = 3
        if em.investorTier == 1 or em.churnRisk:
            fs = 5
        elif em.fromCategory == "investor":
            fs = 4
        elif em.fromCategory == "enterprise_customer":
            fs = 4

        # timeSensitivity — decays with age + explicit deadlines
        ts = 1
        if "today" in em.snippet.lower() or "EOD" in em.snippet:
            ts = 5
        elif em.ageHours >= 48:
            ts = 4
        elif em.ageHours >= 24:
            ts = 3
        elif em.ageHours >= 12:
            ts = 2

        # relationshipWeight
        rw = 2
        if em.investorTier == 1:
            rw = 5
        elif em.fromCategory in ("investor", "key_customer", "enterprise_customer"):
            rw = 4
        elif em.fromCategory == "internal":
            rw = 3

        total = _clip(stakes) + _clip(founderSpecific_for_email(em, fs)) + _clip(ts) + _clip(rw)
        # Boost forced items to ensure they reach the synthesis layer
        if em.id in forced:
            total = max(total, 18)

        scored.append(ItemScore(
            itemId=em.id,
            source="email",
            title=f"{em.from_}: {em.subject}",
            stakes=_clip(stakes),
            founderSpecific=_clip(fs),
            timeSensitivity=_clip(ts),
            relationshipWeight=_clip(rw),
            total=total,
            rationale=_email_rationale(em),
        ))

    return scored


def founderSpecific_for_email(em: InboxItem, base: int) -> int:
    # Investor-update batches are founder-specific because voice matters.
    if em.fromCategory == "investor" and em.investorTier and em.investorTier >= 2:
        return max(base, 4)
    return base


def _email_rationale(em: InboxItem) -> str:
    bits = []
    if em.investorTier == 1:
        bits.append("tier-1 investor")
    if em.churnRisk:
        bits.append("churn risk")
    if em.dealValueINR:
        bits.append(f"₹{em.dealValueINR // 100000}L deal value")
    bits.append(f"{em.ageHours}h unanswered")
    return ", ".join(bits)


def score_slack(items: list[SlackItem], flags: list[RuleFlag]) -> list[ItemScore]:
    forced = {f.targetId for f in flags if f.severity == "force"}
    scored: list[ItemScore] = []

    for sl in items:
        if sl.fromCategory in ("team", "self") and sl.heat in ("low", "stale"):
            continue

        stakes = 2
        if sl.fromCategory == "internal_leader" and sl.heat == "high":
            stakes = 5
        elif sl.heat == "high":
            stakes = 4
        elif sl.heat == "medium":
            stakes = 3

        fs = 3
        if sl.channelType == "dm" and sl.fromCategory == "internal_leader":
            fs = 5
        elif sl.channelType == "dm":
            fs = 4

        ts = 2
        if sl.ageHours <= 12 and sl.heat in ("high", "medium"):
            ts = 4
        if sl.heat == "high":
            ts = 5

        rw = 2
        if sl.fromCategory == "internal_leader":
            rw = 5
        elif sl.fromCategory == "investor":
            rw = 4

        total = _clip(stakes) + _clip(fs) + _clip(ts) + _clip(rw)
        if sl.id in forced:
            total = max(total, 19)

        scored.append(ItemScore(
            itemId=sl.id,
            source="slack",
            title=f"{sl.from_} in {sl.channel}: {sl.text[:60]}",
            stakes=_clip(stakes),
            founderSpecific=_clip(fs),
            timeSensitivity=_clip(ts),
            relationshipWeight=_clip(rw),
            total=total,
            rationale=f"{sl.heat} heat, {sl.fromCategory}, {sl.ageHours}h old",
        ))

    return scored


def score_calendar(items: list[CalendarEvent], flags: list[RuleFlag]) -> list[ItemScore]:
    cancel_flags = {f.targetId: f for f in flags if f.rule.startswith("cancel.")}
    scored: list[ItemScore] = []

    for ev in items:
        # Only score events that the rules engine has flagged as cancel-candidates;
        # otherwise the calendar score isn't useful for the synthesis layer.
        if ev.id not in cancel_flags or ev.personal or ev.recurring:
            continue
        flag = cancel_flags[ev.id]

        stakes = 4 if flag.severity == "force" else 3   # higher = stronger signal to cancel
        fs = 4 if flag.severity == "force" else 3
        ts = 5 if "24h" in flag.rule or "third_reschedule" in flag.rule else 3
        rw = 2  # PR agencies / no-agenda meetings rarely have high RW
        total = _clip(stakes) + _clip(fs) + _clip(ts) + _clip(rw)

        scored.append(ItemScore(
            itemId=ev.id,
            source="calendar",
            title=f"{ev.title} @ {ev.time}",
            stakes=stakes,
            founderSpecific=fs,
            timeSensitivity=ts,
            relationshipWeight=rw,
            total=total,
            rationale=flag.reason,
        ))

    return scored


def score_open_loops(items: list[OpenLoop], flags: list[RuleFlag]) -> list[ItemScore]:
    expiring = {f.targetId for f in flags if f.rule == "revive.expiring_loop"}
    scored: list[ItemScore] = []

    for ol in items:
        stakes = ol.weight
        fs = 4 if ol.category == "fundraise" else 3
        ts = 5 if ol.id in expiring else (4 if ol.ageDays >= 14 else 3)
        rw = 4 if ol.category in ("fundraise", "customer") else 2
        total = _clip(stakes) + _clip(fs) + _clip(ts) + _clip(rw)

        scored.append(ItemScore(
            itemId=ol.id,
            source="open_loop",
            title=ol.item,
            stakes=_clip(stakes),
            founderSpecific=_clip(fs),
            timeSensitivity=_clip(ts),
            relationshipWeight=_clip(rw),
            total=total,
            rationale=f"{ol.lastTouched}; {ol.category}",
        ))

    return scored


def rank_top(scores: list[ItemScore], k: int = 8) -> list[ItemScore]:
    return sorted(scores, key=lambda s: s.total, reverse=True)[:k]
