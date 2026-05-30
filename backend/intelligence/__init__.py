"""Intelligence Layer — the AI operating system that powers the Brief.

Three-layer decision framework:
  Layer 1: rules_engine        — deterministic flags
  Layer 2: scoring_engine      — 4-dimension item scoring
  Layer 3: synthesis_engine    — opinionated Brief generation (Claude Sonnet 4.5)

Orchestration: brief_pipeline.generate_brief()
Type contracts:  types.py  (mirror in /app/frontend/lib/types.ts)
"""
from . import (
    rules_engine,
    scoring_engine,
    synthesis_engine,
    brief_pipeline,
    types,
)

__all__ = ["rules_engine", "scoring_engine", "synthesis_engine", "brief_pipeline", "types"]
