"""Backend tests for The Morning Dispatch."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to NEXT_PUBLIC_BACKEND_URL from frontend/.env if needed
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Health ----
def test_health(session):
    r = session.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data.get("llmKeyConfigured") is True
    assert data.get("model") == "claude-sonnet-4-5"


# ---- Persona ----
def test_persona(session):
    r = session.get(f"{API}/persona", timeout=15)
    assert r.status_code == 200
    data = r.json()
    blob = str(data)
    assert "Priya" in blob and "Mehrotra" in blob


# ---- Inputs ----
def test_inputs(session):
    r = session.get(f"{API}/inputs", timeout=15)
    assert r.status_code == 200
    data = r.json()
    for key in ("calendar", "inbox", "slack", "openLoops"):
        assert key in data, f"missing {key}"
        assert isinstance(data[key], list)
        assert len(data[key]) > 0, f"{key} is empty"


# ---- Brief (fallback) ----
def test_brief_fallback(session):
    t0 = time.time()
    r = session.post(f"{API}/brief", json={"use_llm": False, "overrides": {}}, timeout=15)
    elapsed = time.time() - t0
    assert r.status_code == 200, r.text
    data = r.json()
    assert "date" in data
    assert data["founderName"] == "Priya"
    assert "oneThing" in data and "headline" in data["oneThing"] and "reasoning" in data["oneThing"]
    assert "handlePersonally" in data and len(data["handlePersonally"]) == 3
    assert "toCancel" in data
    assert "toRevive" in data
    assert elapsed < 5.0, f"Fallback latency too high: {elapsed}s"


# ---- Brief (LLM) ----
@pytest.fixture(scope="module")
def llm_brief(session):
    r = session.post(f"{API}/brief", json={"use_llm": True, "overrides": {}}, timeout=60)
    assert r.status_code == 200, r.text
    return r.json()


def test_brief_llm_schema(llm_brief):
    assert llm_brief["founderName"] == "Priya"
    assert len(llm_brief["handlePersonally"]) == 3
    assert "toCancel" in llm_brief
    assert "toRevive" in llm_brief


def test_brief_llm_cancel_two_reasons(llm_brief):
    cancel = llm_brief["toCancel"]
    # toCancel should cite TWO reasons -- check 'reasons' field or two distinct items
    reasons = cancel.get("reasons") or cancel.get("reason") or cancel.get("why") or []
    if isinstance(reasons, str):
        # split on ; or 'and' or comma
        parts = [p for p in reasons.replace(";", ",").split(",") if p.strip()]
        assert len(parts) >= 2, f"Expected 2 reasons in toCancel, got: {reasons}"
    else:
        assert len(reasons) >= 2, f"Expected 2 reasons in toCancel, got: {reasons}"


def test_brief_llm_mentions_bharat_or_lightspeed(llm_brief):
    one = llm_brief["oneThing"]
    blob = (one.get("headline", "") + " " + one.get("reasoning", "")).lower()
    assert ("bharat" in blob) or ("lightspeed" in blob), f"oneThing should mention Bharat or Lightspeed; got: {blob[:200]}"


# ---- Brief overrides regenerates differently ----
def test_brief_overrides_changes_output(session, llm_brief):
    """Remove email-1 (Bharat) -> oneThing should change."""
    r = session.post(
        f"{API}/brief",
        json={"use_llm": True, "overrides": {"inbox": [{"op": "remove", "id": "email-1"}]}},
        timeout=60,
    )
    assert r.status_code == 200, r.text
    new_brief = r.json()
    orig_headline = llm_brief["oneThing"]["headline"]
    new_headline = new_brief["oneThing"]["headline"]
    # Should differ -- at least not contain 'bharat' anymore (case-insensitive)
    assert "bharat" not in new_headline.lower(), (
        f"After removing Bharat email, headline still mentions Bharat: {new_headline}"
    )
    assert new_headline != orig_headline, "Override did not change oneThing headline"


# ---- Companion ----
def test_companion(session):
    r = session.get(f"{API}/companion", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "alerts" in data
    assert isinstance(data["alerts"], list)
    assert len(data["alerts"]) >= 1
    states = {a.get("state") or a.get("type") or a.get("kind") for a in data["alerts"]}
    # Just verify multi-state variety exists in shape, no strict assertion on exact states
    assert len(states) >= 1


# ---- Evening Close ----
def test_evening_close_get_default(session):
    r = session.get(f"{API}/evening-close", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "decisionsMade" in data
    assert "stillOpen" in data
    assert isinstance(data["decisionsMade"], list)
    assert isinstance(data["stillOpen"], list)
    assert len(data["stillOpen"]) > 0


def test_evening_close_post_then_get(session):
    payload = {
        "date": "2025-01-20",
        "decisionsMade": ["TEST_decision_1", "TEST_decision_2"],
        "stillOpen": ["TEST_open_1"],
        "tomorrowsFirstMove": "TEST_first_move",
    }
    r = session.post(f"{API}/evening-close", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    saved = r.json()
    assert saved.get("status") == "saved"

    r2 = session.get(f"{API}/evening-close", timeout=15)
    assert r2.status_code == 200
    data = r2.json()
    assert "TEST_decision_1" in data["decisionsMade"]
    assert data["tomorrowsFirstMove"] == "TEST_first_move"
