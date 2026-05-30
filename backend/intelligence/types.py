"""Type definitions for the Intelligence Layer.

Mirrors the TypeScript `Brief` contract exactly. Any change here must be
reflected in /app/frontend/lib/types.ts.
"""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field


# ============================================================
# Input signal models
# ============================================================

class CalendarEvent(BaseModel):
    id: str
    title: str
    time: str
    durationMin: int
    recurring: bool = False
    agenda: Optional[str] = None
    attendees: list[str] = []
    notes: Optional[str] = None
    rescheduleCount: int = 0
    personal: bool = False


class InboxItem(BaseModel):
    id: str
    from_: str = Field(alias="from")
    fromEmail: Optional[str] = None
    fromCategory: str
    subject: str
    snippet: str
    receivedAt: str
    ageHours: int
    unanswered: bool = True
    investorTier: Optional[int] = None
    dealValueINR: Optional[int] = None
    churnRisk: bool = False

    model_config = {"populate_by_name": True}


class SlackItem(BaseModel):
    id: str
    channel: str
    channelType: Literal["dm", "channel"]
    from_: str = Field(alias="from")
    fromCategory: str
    text: str
    timestamp: str
    ageHours: int
    unread: bool = False
    heat: Literal["low", "medium", "high", "stale"] = "low"

    model_config = {"populate_by_name": True}


class OpenLoop(BaseModel):
    id: str
    item: str
    lastTouched: str
    ageDays: int
    expiresIn: Optional[str] = None
    category: str
    weight: int


# ============================================================
# Layer 1 — Rules engine output
# ============================================================

class RuleFlag(BaseModel):
    """A deterministic flag emitted by Layer 1."""
    rule: str                       # e.g. "cancel.no_agenda_24h"
    targetId: str                   # id of the calendar/inbox/slack item
    reason: str
    severity: Literal["info", "warn", "force"] = "info"


# ============================================================
# Layer 2 — Scoring engine output
# ============================================================

class ItemScore(BaseModel):
    itemId: str
    source: Literal["email", "slack", "calendar", "open_loop"]
    title: str                          # human-readable summary line
    stakes: int                         # 1-5
    founderSpecific: int                # 1-5
    timeSensitivity: int                # 1-5
    relationshipWeight: int             # 1-5
    total: int
    rationale: str                      # one-line "why this score"


# ============================================================
# Layer 3 — Brief contract (must match frontend/lib/types.ts)
# ============================================================

class OneThing(BaseModel):
    headline: str
    reasoning: str


class HandlePersonallyItem(BaseModel):
    source: Literal["email", "slack"]
    from_: str = Field(alias="from")
    subject: str
    why: str

    model_config = {"populate_by_name": True}


class ToCancel(BaseModel):
    meeting: str
    time: str
    reason: str


class ToRevive(BaseModel):
    item: str
    lastTouched: str
    suggestedAction: str


class Brief(BaseModel):
    date: str
    founderName: str
    oneThing: OneThing
    handlePersonally: list[HandlePersonallyItem]
    toCancel: ToCancel
    toRevive: ToRevive
    # Telemetry — useful for the demo console
    generatedAt: str
    scoresPreview: list[ItemScore] = []
    ruleFlags: list[RuleFlag] = []
    model: str = "claude-sonnet-4-5"
    latencyMs: int = 0


# ============================================================
# Companion + Evening close
# ============================================================

CompanionState = Literal["silent", "attention", "escalation", "decision"]


class CompanionAlert(BaseModel):
    state: CompanionState
    title: str
    body: str
    cta: Optional[str] = None
    sourceId: Optional[str] = None


class EveningClose(BaseModel):
    date: str
    decisionsMade: list[str]
    stillOpen: list[str]
    tomorrowsFirstMove: Optional[str] = None
