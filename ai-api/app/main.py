"""
ISO 20022 Academy · AI API

  GET  /api/health      liveness (also used to wake the free instance)
  POST /api/translate   AI Translate
  POST /api/repair      AI Repair

Every AI answer is re-checked here with the same deterministic checks the agent
was given (validation + value comparison) before it goes back to the browser.
Message contents are never logged or stored.
"""
from __future__ import annotations

import asyncio
import os
import time
from collections import defaultdict, deque
from datetime import date

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import checks, formats
from .models import RepairRequest, TranslateRequest

ALLOWED_ORIGINS = [o.strip() for o in os.environ.get(
    "ALLOWED_ORIGINS",
    "https://iso20022academy.in,https://www.iso20022academy.in,http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000",
).split(",") if o.strip()]
PER_MINUTE = int(os.environ.get("RATE_PER_MINUTE", "6"))
PER_DAY = int(os.environ.get("RATE_PER_DAY", "40"))
DAILY_CAP = int(os.environ.get("DAILY_REQUEST_CAP", "500"))

app = FastAPI(title="ISO 20022 Academy AI API", docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


# ── limits: per visitor per minute / per day, and a site-wide daily budget ───
_hits: dict[str, deque] = defaultdict(deque)
_day = {"date": date.today(), "total": 0, "per_ip": defaultdict(int)}
_lock = asyncio.Lock()


def _client_ip(req: Request) -> str:
    fwd = req.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() if fwd else (req.client.host if req.client else "unknown")


async def _admit(req: Request) -> None:
    ip, now = _client_ip(req), time.monotonic()
    async with _lock:
        if _day["date"] != date.today():
            _day.update(date=date.today(), total=0, per_ip=defaultdict(int))
        if _day["total"] >= DAILY_CAP:
            raise HTTPException(503, "The AI has reached today's limit. Try again tomorrow.")
        if _day["per_ip"][ip] >= PER_DAY:
            raise HTTPException(429, "You've reached today's limit for AI requests. Try again tomorrow.")
        q = _hits[ip]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= PER_MINUTE:
            raise HTTPException(429, "Too many requests in a minute. Wait a moment and try again.")
        q.append(now)
        _day["per_ip"][ip] += 1
        _day["total"] += 1


def _require_key() -> None:
    if not (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")):
        raise HTTPException(503, "The AI isn't configured on the server yet.")


@app.exception_handler(HTTPException)
async def _http_err(_req, exc: HTTPException):
    return JSONResponse({"ok": False, "message": exc.detail}, status_code=exc.status_code)


@app.get("/api/health")
async def health():
    return {"ok": True, "service": "ai-api", "configured": bool(os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY"))}


def _source_type(text: str, given: str | None) -> dict:
    det = checks.detect(text)
    if not det["std"]:
        raise HTTPException(422, "This doesn't look like an ISO 20022 or SWIFT MT message.")
    if given and given in formats.FORMATS and formats.FORMATS[given]["std"] != det["std"]:
        raise HTTPException(422, f"The message is {'ISO 20022 XML' if det['std'] == 'MX' else 'SWIFT MT'}, but Source is set to {given}.")
    return {**det, "code": given if given in formats.FORMATS else det["code"]}


def _ai_error(e: Exception) -> HTTPException:
    if isinstance(e, asyncio.TimeoutError):
        return HTTPException(504, "The AI took too long. Try again in a moment.")
    return HTTPException(502, "The AI couldn't produce a usable answer for this message. Try again, or check the message is complete.")


@app.post("/api/translate")
async def translate(body: TranslateRequest, req: Request):
    _require_key()
    det = _source_type(body.source, body.sourceType)
    if body.target not in formats.FORMATS:
        raise HTTPException(422, f"{body.target} isn't a destination the Translator supports.")
    if det["code"] == body.target:
        raise HTTPException(422, f"The message is already a {body.target}.")
    await _admit(req)

    from . import agents  # imported lazily so /api/health works without ADK credentials
    t0 = time.monotonic()
    try:
        out = await agents.translate(body.source, det["code"], body.target)
    except Exception as e:  # noqa: BLE001 — every failure becomes a plain message
        raise _ai_error(e)

    validation = checks.validate(out.message)
    detected_out = checks.detect(out.message)
    fidelity = checks.compare_values(body.source, out.message, declared=[f.value for f in out.filled])
    return {
        "ok": True,
        "kind": "translate",
        "sourceType": det["code"],
        "targetType": body.target,
        "outputType": detected_out["code"],
        "direct": formats.is_direct(det["code"] or "", body.target),
        "message": out.message,
        "mapping": [m.model_dump() for m in out.mapping],
        "filled": [f.model_dump() for f in out.filled],
        "dropped": [d.model_dump() for d in out.dropped],
        "notes": out.notes,
        "validation": validation,
        "fidelity": fidelity,
        "model": agents.MODEL,
        "ms": int((time.monotonic() - t0) * 1000),
    }


@app.post("/api/repair")
async def repair(body: RepairRequest, req: Request):
    _require_key()
    det = _source_type(body.source, body.sourceType)
    await _admit(req)

    from . import agents
    before = checks.validate(body.source)
    t0 = time.monotonic()
    try:
        out = await agents.repair(body.source, det["code"], body.rejectReason)
    except Exception as e:  # noqa: BLE001
        raise _ai_error(e)

    after = checks.validate(out.message)
    declared = [c.after for c in out.changes] + [c.before for c in out.changes]
    fidelity = checks.compare_values(body.source, out.message, declared=declared)
    # A repair must stay in the same format.
    same_type = checks.detect(out.message)["code"] in (None, det["code"])
    return {
        "ok": True,
        "kind": "repair",
        "sourceType": det["code"],
        "message": out.message,
        "changes": [c.model_dump() for c in out.changes],
        "unresolved": [u.model_dump() for u in out.unresolved],
        "summary": out.summary,
        "sameType": same_type,
        "validationBefore": before,
        "validation": after,
        "fidelity": fidelity,
        "model": agents.MODEL,
        "ms": int((time.monotonic() - t0) * 1000),
    }
