# The Morning Dispatch — PRD & Progress

## Original problem statement

Build a production-quality hackathon demo of **The Morning Dispatch**, an AI Chief of Staff for founders. Two layers:

- **Intelligence Layer** — 3-layer decision framework (Rules → Scoring → Synthesis), Brief generation pipeline, service-oriented Python intelligence.
- **Experience Layer** — Morning Brief (newspaper editorial), Daily Companion (4 states), Evening Close (3-question), Demo Console for judges, plus "Imagine this in" Slack/Email mockups.

Source of truth: `PRD_AI_Chief_of_Staff.md` + `KNOWLEDGE_BASE.md`.

## Architecture

```
/app/
├── backend/              # FastAPI (port 8001) — Intelligence Layer
│   ├── server.py
│   ├── intelligence/
│   │   ├── rules_engine.py        # Layer 1 (deterministic)
│   │   ├── scoring_engine.py      # Layer 2 (4-dim scoring)
│   │   ├── synthesis_engine.py    # Layer 3 (Claude Sonnet 4.5)
│   │   ├── prompts.py             # voice-calibrated system prompt + few-shot
│   │   ├── brief_pipeline.py      # orchestrator
│   │   ├── types.py               # Pydantic Brief contract
│   │   └── services/              # calendar/inbox/slack/open_loops adapters
│   └── mock_data/                 # persona + 4 signal sources (matches KB §5)
└── frontend/             # Next.js 14 App Router (port 3000) — Experience Layer
    ├── app/
    │   ├── page.tsx               # Morning Brief (hero)
    │   ├── evening/page.tsx       # Evening Close
    │   ├── mockups/{slack,email}/page.tsx
    │   └── api/brief/route.ts     # Portability stub (proxies FastAPI)
    ├── components/                # masthead, morning-brief, daily-companion,
    │                              # demo-console, regeneration-overlay, global-nav
    ├── lib/                       # types.ts (mirrors backend), api.ts client
    └── tailwind.config.js + globals.css  # Fraunces / Newsreader / Manrope
```

## User personas

- **Primary**: Solo / early-stage founders (pre-Series A → Series A), India + global.
- **Secondary**: Operators in founder-adjacent roles.
- **Demo persona**: Priya Mehrotra — Series A SaaS founder, Stellaride, Bangalore, 18 months in, raising a $4M bridge.

## Core requirements (static)

- Brief schema: `{ date, founderName, oneThing, handlePersonally[3], toCancel, toRevive }` — frontend and backend share this contract.
- 4 mandatory sections, never more.
- Synthesis must take positions (never hedge), cite specific facts, never use AI-isms.
- Companion default state is **silent**; loud interrupts reserved for force-flags.
- Demo must support live regeneration via judge-modified inputs.

## What's been implemented (2026-01-30 / built today)

- ✅ **Intelligence Layer (Python)**: full rules engine, scoring engine, synthesis engine. All 3 layers wired through `brief_pipeline.generate_brief()`. Deterministic fallback if LLM fails.
- ✅ **Claude Sonnet 4.5 integration** via Emergent universal key (`emergentintegrations`). Produces Knowledge Base §5 target output (Bharat/Lightspeed oneThing, Ananya/Rohit/three-angels handlePersonally, Vox PR toCancel, Anil/Mumbai toRevive).
- ✅ **API routes**: `/api/health`, `/api/persona`, `/api/inputs`, `POST /api/brief`, `GET /api/companion`, `GET+POST /api/evening-close`.
- ✅ **Next.js 14 frontend** with TypeScript, Tailwind, Framer Motion. Editorial design system using Fraunces + Newsreader + Manrope.
- ✅ **Morning Brief hero page** — masthead, dateline, drop cap, 4 sections, hairline rules, colophon footer.
- ✅ **Daily Companion** right-side panel with 4 states: silent, attention, escalation, decision.
- ✅ **Evening Close** flow — 3 questions, auto-populated from latest brief, textarea for tomorrow's first move.
- ✅ **Demo Console** (⌘K) — 5 scenarios that mutate inputs and regenerate the brief live. Includes inputs tab showing raw signals.
- ✅ **Regeneration overlay** — cinematic 5-step "Chief of Staff is thinking" sequence during AI calls.
- ✅ **Slack + Email mockups** — `/mockups/slack` and `/mockups/email` render the same brief in those surfaces.
- ✅ **All `data-testid` attributes** across interactive elements.
- ✅ **Testing agent verified**: 100% backend (11/11 pytest), 100% frontend.

## Prioritized backlog (P0 / P1 / P2)

**P0 — None outstanding.** Hackathon demo target is complete.

**P1 — Polish for live demo:**
- Add subtle entrance choreography to the dateline (currently fades with masthead).
- Add a small "scenario-active" badge near the masthead so judges can see which input mutation is currently applied.
- Pre-warm the LLM call on first page mount so the initial brief is instant.

**P2 — Future / post-hackathon:**
- Real OAuth: Google Calendar (calendar.readonly), Gmail (gmail.readonly), Slack (channels:history + im:history).
- Persistence layer (Postgres / Mongo) for memory + evening logs.
- Cron delivery at 7am the founder's local time.
- Per-user voice calibration via short voice-sample onboarding.
- Multi-founder support, accounts.
- Mobile app + Slack-DM-as-second-surface delivery.

## Next tasks

- (User decision) — Demo to judges; iterate based on feedback.
- (Optional) — Push to GitHub via the "Save to Github" button in the chat input.
