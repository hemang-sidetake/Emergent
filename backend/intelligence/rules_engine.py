"""Layer 1 — Deterministic Rules Engine.

No LLM calls. Pure Python over the structured mock data.

The output is a list of `RuleFlag`s that the scoring and synthesis layers
consume as hard constraints. These are the rules the AI cannot override.
"""
from __future__ import annotations

from .types import (
    CalendarEvent,
    InboxItem,
    SlackItem,
    OpenLoop,
    RuleFlag,
)


def run_rules(
    calendar: list[CalendarEvent],
    inbox: list[InboxItem],
    slack: list[SlackItem],
    open_loops: list[OpenLoop],
) -> list[RuleFlag]:
    flags: list[RuleFlag] = []

    # Rule 1.1 — Meetings without an agenda within 24h → cancel candidate
    for ev in calendar:
        if ev.personal or ev.recurring:
            continue
        if not ev.agenda:
            flags.append(RuleFlag(
                rule="cancel.no_agenda_24h",
                targetId=ev.id,
                reason=f"No agenda shared for '{ev.title}' at {ev.time}",
                severity="warn",
            ))

    # Rule 1.2 — Meeting rescheduled >= 3 times → force cancel candidate
    for ev in calendar:
        if ev.rescheduleCount >= 3:
            flags.append(RuleFlag(
                rule="cancel.third_reschedule",
                targetId=ev.id,
                reason=f"'{ev.title}' has been rescheduled {ev.rescheduleCount} times",
                severity="force",
            ))

    # Rule 1.3 — Calendar with 6+ hours of meetings → recommend cancellations
    total_min = sum(ev.durationMin for ev in calendar if not ev.personal)
    if total_min >= 360:
        flags.append(RuleFlag(
            rule="cancel.day_overloaded",
            targetId="day",
            reason=f"{total_min // 60}h of meetings booked today",
            severity="warn",
        ))

    # Rule 2.1 — Emails from named investors → priority routing
    for em in inbox:
        if em.fromCategory == "investor" and em.unanswered:
            flags.append(RuleFlag(
                rule="priority.investor_unanswered",
                targetId=em.id,
                reason=f"Unanswered investor email from {em.from_} ({em.ageHours}h)",
                severity="warn" if em.ageHours >= 24 else "info",
            ))

    # Rule 2.2 — Tier-1 investor email older than 24h → force surface
    for em in inbox:
        if em.investorTier == 1 and em.unanswered and em.ageHours >= 24:
            flags.append(RuleFlag(
                rule="force_surface.tier1_investor",
                targetId=em.id,
                reason=f"Tier-1 investor {em.from_} unanswered for {em.ageHours}h",
                severity="force",
            ))

    # Rule 3.1 — Customer escalations open >48h → force surface
    for em in inbox:
        if em.churnRisk and em.ageHours >= 48:
            flags.append(RuleFlag(
                rule="force_surface.customer_escalation",
                targetId=em.id,
                reason=f"Customer escalation from {em.from_} open {em.ageHours}h",
                severity="force",
            ))

    # Rule 4.1 — Leadership DM marked high heat → force surface
    for sl in slack:
        if sl.channelType == "dm" and sl.fromCategory == "internal_leader" and sl.heat == "high":
            flags.append(RuleFlag(
                rule="force_surface.leader_dm",
                targetId=sl.id,
                reason=f"High-heat DM from {sl.from_}",
                severity="force",
            ))

    # Rule 5.1 — Open loops expiring this week → revive candidates
    for ol in open_loops:
        if ol.expiresIn and ("Friday" in ol.expiresIn or "churn" in ol.expiresIn.lower()):
            flags.append(RuleFlag(
                rule="revive.expiring_loop",
                targetId=ol.id,
                reason=f"Loop '{ol.item}' expires {ol.expiresIn}",
                severity="warn",
            ))

    return flags
