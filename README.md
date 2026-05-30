# The Morning Dispatch

An AI Chief of Staff for founders. A single artifact, delivered every morning.
Four sections, never more. Built for VibeCon India 2026.

> **The differentiator isn't the AI. The differentiator is craft.**

---

## Architecture

Two distinct layers per the PRD:

### Layer 1 — Intelligence (FastAPI / Python)

The AI operating system that powers the brief. Located in `backend/intelligence/`.

```
intelligence/
├── types.py             # Brief schema (mirrors lib/types.ts)
├── rules_engine.py      # Layer 1 — deterministic rules
├── scoring_engine.py    # Layer 2 — 4-dimension scoring
├── synthesis_engine.py  # Layer 3 — Claude Sonnet 4.5 synthesis
├── prompts.py           # Voice-calibrated system prompts
├── brief_pipeline.py    # Orchestrates Layers 1→2→3
└── services/
    ├── calendar_service.py   # Mock data → future: Google Calendar
    ├── inbox_service.py      # Mock data → future: Gmail
    ├── slack_service.py      # Mock data → future: Slack
    └── open_loops_service.py # Derived signal
```

**Decision framework** (per Knowledge Base §7):
1. **Rules** — deterministic Python (no LLM). Force-cancels meetings rescheduled 3+ times, force-surfaces tier-1 investor emails over 24h old, force-surfaces customer escalations over 48h.
2. **Scoring** — every item gets scored 1-5 on `stakes`, `founderSpecific`, `timeSensitivity`, `relationshipWeight`. Top 8 feed Layer 3.
3. **Synthesis** — Claude Sonnet 4.5 (via Emergent universal key) writes the brief in Priya's voice, conforming strictly to the `Brief` schema.

**Demo-safe**: if the LLM call fails, a deterministic fallback brief is produced from the top-scored items so the demo never breaks.

### Layer 2 — Experience (Next.js 14 / TypeScript)

A founder-grade reading experience. Located in `frontend/`.

```
frontend/
├── app/
│   ├── page.tsx              # Morning Brief (hero)
│   ├── evening/page.tsx      # Evening Close
│   ├── mockups/slack/page.tsx
│   ├── mockups/email/page.tsx
│   └── api/brief/route.ts    # Portability stub (proxies FastAPI)
├── components/
│   ├── masthead.tsx
│   ├── morning-brief.tsx
│   ├── daily-companion.tsx   # 4 states
│   ├── demo-console.tsx      # ⌘K judge palette
│   ├── regeneration-overlay.tsx
│   └── global-nav.tsx
├── lib/
│   ├── types.ts              # Brief schema (mirrors backend types.py)
│   ├── api.ts                # Typed client
│   └── utils.ts
```

**Design system**: Fraunces (heading) + Newsreader (body) + Manrope (UI). Newsprint paper warm palette, Arc-style dark mode. See `/app/design_guidelines.json`.

---

## Data flow

```
                       ┌─────────────────────────────────┐
                       │  Mock data (JSON, persona Priya) │
                       │  calendar / inbox / slack / loops │
                       └────────────────┬────────────────┘
                                        │ load()
                                        ▼
                    ┌────────────────────────────────────────┐
                    │     /api/brief  (FastAPI POST)          │
                    │  ┌──────────────────────────────────┐   │
                    │  │ Layer 1 — Rules engine            │   │
                    │  │ (force flags, priority routing)   │   │
                    │  └──────────────┬───────────────────┘   │
                    │                 ▼                        │
                    │  ┌──────────────────────────────────┐   │
                    │  │ Layer 2 — Scoring engine          │   │
                    │  │ (4 dims, rank top 8)              │   │
                    │  └──────────────┬───────────────────┘   │
                    │                 ▼                        │
                    │  ┌──────────────────────────────────┐   │
                    │  │ Layer 3 — Synthesis (Claude 4.5)  │   │
                    │  │ structured Brief JSON output      │   │
                    │  └──────────────┬───────────────────┘   │
                    └─────────────────┼────────────────────────┘
                                      ▼
                          ┌──────────────────────┐
                          │  Brief (typed JSON)   │
                          └─────────┬────────────┘
                                    ▼
                       Morning Brief / Companion / Email / Slack
```

---

## API contract

`POST /api/brief`

```jsonc
// Request
{ "use_llm": true, "overrides": { "inbox": [{ "op": "remove", "id": "email-1" }] } }
```

Response shape — see `lib/types.ts` → `Brief`:

```ts
interface Brief {
  date: string;
  founderName: string;
  oneThing: { headline: string; reasoning: string };
  handlePersonally: Array<{ source: 'email' | 'slack'; from: string; subject: string; why: string }>;
  toCancel: { meeting: string; time: string; reason: string };
  toRevive: { item: string; lastTouched: string; suggestedAction: string };
  // Telemetry
  generatedAt: string;
  scoresPreview: ItemScore[];
  ruleFlags: RuleFlag[];
  model: string;
  latencyMs: number;
}
```

Other routes:

- `GET  /api/health`
- `GET  /api/persona`
- `GET  /api/inputs`         — raw mock signals (powers the demo console)
- `GET  /api/companion`      — derived alerts for the right-side panel
- `GET  /api/evening-close`  — auto-populated payload from latest brief
- `POST /api/evening-close`  — persists the founder's reflection

---

## The demo

1. Open the brief at `/`. The full editorial layout renders with a Claude-generated brief for Priya Mehrotra.
2. Press **⌘K** (Cmd+K / Ctrl+K) to open the **Demo Console**.
3. Pick a scenario — e.g. *"You already replied to Bharat"*. The brief regenerates with Claude Sonnet 4.5 in real time and the new One Thing, Cancel, Revive reorder.
4. Visit `/evening` for the auto-populated Evening Close.
5. Visit `/mockups/slack` and `/mockups/email` to see "Imagine this in" surfaces.

---

## Future integrations roadmap

The `Brief` shape stays identical when going live. Only data sources swap:

| Mock file                       | Real source                  | Auth                           |
| ------------------------------- | ---------------------------- | ------------------------------ |
| `mock_data/calendar.json`       | Google Calendar (events.list) | OAuth, calendar.readonly       |
| `mock_data/inbox.json`          | Gmail (messages.list)         | OAuth, gmail.readonly + labels |
| `mock_data/slack.json`          | Slack (conversations.history) | OAuth, channels:history + im   |
| `mock_data/open_loops.json`     | Derived from all three above  | n/a                            |
| (in-memory evening close)       | Postgres / Mongo persistence  | internal                       |

A scheduled cron job posts the brief at 7am the founder's local time — same Slack block-kit message, same email template.

---

## Hackathon scope

- ✅ Morning Brief — full editorial design, real AI synthesis
- ✅ Daily Companion — 4 states (silent / attention / escalation / decision)
- ✅ Evening Close — 3 questions, auto-populated
- ✅ Demo Console — ⌘K judge palette with scenario triggers
- ✅ Slack + Email "Imagine this in" mockups
- ✅ Mock data exactly matches Knowledge Base §5
- ❌ Real OAuth, user accounts, persistence — explicitly out of scope per PRD §6

---

Built by two designers, for founders. With craft.
