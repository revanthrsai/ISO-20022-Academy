"""The owner-only dashboard API: the key gate, the Cloudflare call (stubbed), and the service counters."""
import pytest
from fastapi.testclient import TestClient

from app import admin, main

KEY = "k" * 24
CF = {"viewer": {"accounts": [{
    "total": [{"count": 120, "sum": {"visits": 45}}],
    "days": [{"count": 70, "sum": {"visits": 20}, "dimensions": {"date": "2026-10-16"}},
             {"count": 50, "sum": {"visits": 25}, "dimensions": {"date": "2026-10-17"}}],
    "paths": [{"count": 80, "dimensions": {"requestPath": "/"}}, {"count": 40, "dimensions": {"requestPath": "/library/301-pacs-008/"}}],
    "referrers": [{"count": 30, "dimensions": {"refererHost": "www.linkedin.com"}}, {"count": 10, "dimensions": {"refererHost": ""}}],
    "countries": [{"count": 90, "dimensions": {"countryName": "IN"}}],
    "devices": [{"count": 100, "dimensions": {"deviceType": "mobile"}}],
    "browsers": [{"count": 100, "dimensions": {"userAgentBrowser": "Chrome"}}],
}]}}


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("ADMIN_KEY", KEY)
    monkeypatch.setenv("CF_API_TOKEN", "t")
    monkeypatch.setenv("CF_ACCOUNT_ID", "a")
    admin._fails.clear()
    admin._cache.clear()


@pytest.fixture
def client():
    return TestClient(main.app)


def test_needs_the_right_key(client):
    assert client.get("/api/admin/service").status_code == 401
    assert client.get("/api/admin/service", headers={"X-Admin-Key": "wrong"}).status_code == 401
    assert client.get("/api/admin/service", headers={"X-Admin-Key": KEY}).status_code == 200


def test_wrong_keys_lock_out(client):
    for _ in range(10):
        client.get("/api/admin/service", headers={"X-Admin-Key": "nope"})
    assert client.get("/api/admin/service", headers={"X-Admin-Key": KEY}).status_code == 429


def test_short_or_missing_key_means_not_set_up(client, monkeypatch):
    monkeypatch.setenv("ADMIN_KEY", "short")
    assert client.get("/api/admin/service", headers={"X-Admin-Key": "short"}).status_code == 503


def test_traffic_shapes_cloudflare(client, monkeypatch):
    calls = []

    async def fake(days):
        calls.append(days)
        return admin.shape(CF, days)
    monkeypatch.setattr(admin, "fetch_cloudflare", fake)
    j = client.get("/api/admin/traffic?days=30", headers={"X-Admin-Key": KEY}).json()
    assert j["pageViews"] == 120 and j["visits"] == 45 and len(j["byDay"]) == 2
    assert j["referrers"][1]["label"] == "Direct / none" and j["paths"][1]["label"] == "/library/301-pacs-008/"
    client.get("/api/admin/traffic?days=30", headers={"X-Admin-Key": KEY})
    assert calls == [30]  # the second call is served from the 5-minute cache


def test_traffic_without_cloudflare_says_what_to_add(client, monkeypatch):
    monkeypatch.delenv("CF_API_TOKEN")
    r = client.get("/api/admin/traffic", headers={"X-Admin-Key": KEY})
    assert r.status_code == 503 and "CF_API_TOKEN" in r.json()["message"]


def test_service_counts_rules_translations(client):
    from tests.test_checks import PACS008
    main._counts.clear()
    client.post("/api/translate", json={"source": PACS008, "target": "MT103"})
    j = client.get("/api/admin/service", headers={"X-Admin-Key": KEY}).json()
    assert j["rules"] == 1 and j["pairs"][0] == {"label": "pacs.008 → MT103", "count": 1}
