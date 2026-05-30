"""The Morning Dispatch — FastAPI server.

Routes:
  GET  /api/health            — liveness
  GET  /api/persona           — persona + ecosystem
  GET  /api/inputs            — raw mock data (for the Demo Console UI)
  POST /api/brief             — generate a Brief (optional overrides)
  GET  /api/companion         — companion alerts derived from latest brief
  POST /api/evening-close     — persist an evening close record (in-memory)
  GET  /api/evening-close     — fetch the latest evening close
"""
from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

from intelligence import brief_pipeline  # noqa: E402
from intelligence.services import (  # noqa: E402
    calendar_service,
    inbox_service,
    open_loops_service,
    slack_service,
)
from intelligence.types import Brief, CompanionAlert, EveningClose  # noqa: E402


# In-memory store (no DB persistence per PRD)
class _Store:
    latest_brief: Optional[Brief] = None
    latest_evening: Optional[EveningClose] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="The Morning Dispatch", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Request models
# ============================================================

class BriefRequest(BaseModel):
    use_llm: bool = True
    overrides: dict[str, list[dict[str, Any]]] = {}


# ============================================================
# Routes
# ============================================================

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "product": "The Morning Dispatch",
        "model": "claude-sonnet-4-5",
        "llmKeyConfigured": bool(os.environ.get("EMERGENT_LLM_KEY")),
    }


@app.get("/api/persona")
async def get_persona():
    persona_path = ROOT / "mock_data" / "persona.json"
    return json.loads(persona_path.read_text())


@app.get("/api/inputs")
async def get_inputs():
    """All raw signals — used by the Demo Console for input visualization."""
    return {
        "calendar": [e.model_dump(by_alias=True) for e in calendar_service.load()],
        "inbox": [e.model_dump(by_alias=True) for e in inbox_service.load()],
        "slack": [e.model_dump(by_alias=True) for e in slack_service.load()],
        "openLoops": [e.model_dump(by_alias=True) for e in open_loops_service.load()],
    }


@app.post("/api/brief")
async def generate_brief(req: BriefRequest):
    try:
        brief = await brief_pipeline.generate_brief(
            overrides=req.overrides,
            use_llm=req.use_llm,
        )
        _Store.latest_brief = brief
        return brief.model_dump(by_alias=True)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/companion")
async def get_companion():
    """Daily Companion alerts derived from the latest brief.
    Generates one if none exists yet."""
    if _Store.latest_brief is None:
        _Store.latest_brief = await brief_pipeline.generate_brief(use_llm=False)
    alerts = brief_pipeline.companion_alerts(_Store.latest_brief)
    return {"alerts": [a.model_dump() for a in alerts]}


@app.post("/api/evening-close")
async def post_evening_close(payload: EveningClose):
    _Store.latest_evening = payload
    return {"status": "saved", "data": payload.model_dump()}


@app.get("/api/evening-close")
async def get_evening_close():
    """Returns the latest evening-close payload — pre-populated from the latest
    brief if the founder hasn't filled one yet today."""
    if _Store.latest_evening is not None:
        return _Store.latest_evening.model_dump()

    # Auto-populate from latest brief
    brief = _Store.latest_brief
    if brief is None:
        brief = await brief_pipeline.generate_brief(use_llm=False)
        _Store.latest_brief = brief

    decisions = [
        f"Cancel {brief.toCancel.meeting} at {brief.toCancel.time}"
        if brief.toCancel.meeting != "—"
        else None,
        f"Move on: {brief.oneThing.headline}",
    ]
    still_open = [
        f"{h.from_}: {h.subject}" for h in brief.handlePersonally
    ]
    still_open.append(f"Revive — {brief.toRevive.item}")

    return EveningClose(
        date=brief.date,
        decisionsMade=[d for d in decisions if d],
        stillOpen=still_open,
        tomorrowsFirstMove=None,
    ).model_dump()
