"""Service-oriented adapters around mock data.

Each *_service module exposes a single `load()` function. In the future these
can be swapped to Google Calendar / Gmail / Slack APIs without touching the
intelligence layer (see `KNOWLEDGE_BASE.md §11 Future integrations roadmap`).
"""
