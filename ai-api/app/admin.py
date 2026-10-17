"""
Owner-only endpoints behind /insights/.

  GET /api/admin/traffic?days=1|7|30   visits from Cloudflare Web Analytics
  GET /api/admin/service               the Translator since this instance started

Every call needs the X-Admin-Key header to match ADMIN_KEY (set on Render only).
Cloudflare is read with CF_API_TOKEN (permission: Account Analytics: Read) and
CF_ACCOUNT_ID; CF_SITE_TAG narrows it to this site's Web Analytics, otherwise
the site's hostname (SITE_HOST) is used. No visitor data is stored here.
"""
from __future__ import annotations

import hmac
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/admin")

CF_GRAPHQL = "https://api.cloudflare.com/client/v4/graphql"
_fails: dict[str, deque] = defaultdict(deque)
_cache: dict[int, tuple[float, dict]] = {}
CACHE_S = 300

_QUERY = """
query Traffic($account: string!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
  viewer {
    accounts(filter: { accountTag: $account }) {
      total: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 1) { count sum { visits } }
      days: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 100, orderBy: [date_ASC]) { count sum { visits } dimensions { date } }
      paths: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 20, orderBy: [count_DESC]) { count dimensions { requestPath } }
      referrers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 12, orderBy: [count_DESC]) { count dimensions { refererHost } }
      countries: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 12, orderBy: [count_DESC]) { count dimensions { countryName } }
      devices: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 6, orderBy: [count_DESC]) { count dimensions { deviceType } }
      browsers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 8, orderBy: [count_DESC]) { count dimensions { userAgentBrowser } }
    }
  }
}
"""


def _client_ip(req: Request) -> str:
    fwd = req.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() if fwd else (req.client.host if req.client else "unknown")


def require_owner(req: Request) -> None:
    """Constant-time key check; ten wrong keys in ten minutes locks that address out for a while."""
    expected = os.environ.get("ADMIN_KEY", "")
    if len(expected) < 16:
        raise HTTPException(503, "The dashboard isn't set up: add an ADMIN_KEY of at least 16 characters on Render.")
    ip, now = _client_ip(req), time.monotonic()
    q = _fails[ip]
    while q and now - q[0] > 600:
        q.popleft()
    if len(q) >= 10:
        raise HTTPException(429, "Too many wrong keys. Try again in a few minutes.")
    given = req.headers.get("x-admin-key", "")
    if not hmac.compare_digest(given.encode(), expected.encode()):
        q.append(now)
        raise HTTPException(401, "That key isn't right.")


def _rows(groups: list, dim: str, empty: str = "(none)") -> list[dict]:
    return [{"label": (g.get("dimensions") or {}).get(dim) or empty, "count": g.get("count", 0)} for g in groups or []]


def shape(data: dict, days: int) -> dict:
    """Cloudflare's answer → what the dashboard draws."""
    acct = (((data or {}).get("viewer") or {}).get("accounts") or [{}])[0] or {}
    total = (acct.get("total") or [{}])
    total = total[0] if total else {}
    return {
        "days": days,
        "pageViews": total.get("count", 0),
        "visits": (total.get("sum") or {}).get("visits", 0),
        "byDay": [{"date": g["dimensions"]["date"], "views": g.get("count", 0), "visits": (g.get("sum") or {}).get("visits", 0)}
                  for g in acct.get("days") or [] if (g.get("dimensions") or {}).get("date")],
        "paths": _rows(acct.get("paths"), "requestPath"),
        "referrers": _rows(acct.get("referrers"), "refererHost", "Direct / none"),
        "countries": _rows(acct.get("countries"), "countryName", "Unknown"),
        "devices": _rows(acct.get("devices"), "deviceType", "Unknown"),
        "browsers": _rows(acct.get("browsers"), "userAgentBrowser", "Unknown"),
    }


async def fetch_cloudflare(days: int) -> dict:
    token, account = os.environ.get("CF_API_TOKEN", ""), os.environ.get("CF_ACCOUNT_ID", "")
    if not (token and account):
        raise HTTPException(503, "Traffic isn't connected yet: add CF_API_TOKEN and CF_ACCOUNT_ID on Render.")
    end = datetime.now(timezone.utc).replace(microsecond=0)
    start = end - timedelta(days=days)
    where = [{"datetime_geq": start.isoformat().replace("+00:00", "Z")}, {"datetime_leq": end.isoformat().replace("+00:00", "Z")}]
    site_tag = os.environ.get("CF_SITE_TAG", "")
    where.append({"siteTag": site_tag} if site_tag else {"requestHost": os.environ.get("SITE_HOST", "iso20022academy.in")})
    body = {"query": _QUERY, "variables": {"account": account, "filter": {"AND": where}}}
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(CF_GRAPHQL, json=body, headers={"Authorization": f"Bearer {token}"})
    if r.status_code in (401, 403):
        raise HTTPException(502, "Cloudflare refused the token. It needs the 'Account Analytics: Read' permission.")
    j = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if j.get("errors"):
        raise HTTPException(502, "Cloudflare: " + "; ".join(e.get("message", "") for e in j["errors"])[:300])
    if r.status_code >= 400:
        raise HTTPException(502, f"Cloudflare returned HTTP {r.status_code}.")
    return shape(j.get("data") or {}, days)


@router.get("/traffic")
async def traffic(req: Request, days: int = 7):
    require_owner(req)
    days = days if days in (1, 7, 30) else 7
    hit = _cache.get(days)
    if hit and time.time() - hit[0] < CACHE_S:
        return {**hit[1], "cached": True}
    out = await fetch_cloudflare(days)
    out["fetchedAt"] = datetime.now(timezone.utc).isoformat()
    _cache[days] = (time.time(), out)
    return out


@router.get("/service")
async def service(req: Request):
    require_owner(req)
    from . import main  # the counters live with the endpoints that count
    counts = dict(main._counts)
    pairs = sorted(((k[5:], v) for k, v in counts.items() if k.startswith("pair:")), key=lambda x: -x[1])
    reasons = sorted(((k[7:], v) for k, v in counts.items() if k.startswith("reason:")), key=lambda x: -x[1])
    return {
        "since": datetime.fromtimestamp(main._ai_state["since"], timezone.utc).isoformat(),
        "ai": main._ai_status(),
        "rules": counts.get("rules", 0), "aiAnswers": counts.get("ai", 0),
        "fallbacks": counts.get("fallback", 0), "aiFailures": counts.get("ai_failed", 0),
        "pairs": [{"label": k, "count": v} for k, v in pairs[:16]],
        "reasons": [{"label": k, "count": v} for k, v in reasons[:10]],
        "aiToday": main._day["total"], "aiDailyCap": main.DAILY_CAP,
    }
