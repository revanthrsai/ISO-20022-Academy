"""
ISO 20022 Academy · AI API

  GET  /api/health      liveness (also used to wake the free instance)
  POST /api/check       validate only (no AI)
  POST /api/translate   rules engine first; the AI only when the engine can't
  POST /api/repair      rule-based fixes first; the AI only for what rules can't untangle

Hybrid: the rules engine (app/engine) handles every message it has rules for,
instantly and for free. The AI (Google ADK + Gemini) is the fallback. Every
result, whoever wrote it, gets the same checks (validation, the pair's field
rules, value comparison) before it goes back to the browser.
Message contents are never logged or stored.
"""
from __future__ import annotations

import asyncio
import logging
import os
import time
from collections import defaultdict, deque
from datetime import date

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import checks, engine, formats, mappings
from .models import RepairRequest, TranslateRequest
from .admin import router as admin_router

ALLOWED_ORIGINS = [o.strip() for o in os.environ.get(
    "ALLOWED_ORIGINS",
    "https://iso20022academy.in,https://www.iso20022academy.in,http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000",
).split(",") if o.strip()]
PER_MINUTE = int(os.environ.get("RATE_PER_MINUTE", "6"))
PER_DAY = int(os.environ.get("RATE_PER_DAY", "40"))
DAILY_CAP = int(os.environ.get("DAILY_REQUEST_CAP", "500"))

app = FastAPI(title="ISO 20022 Academy AI API", docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["GET", "POST"], allow_headers=["Content-Type", "X-Admin-Key"])


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


app.include_router(admin_router)


@app.exception_handler(HTTPException)
async def _http_err(_req, exc: HTTPException):
    return JSONResponse({"ok": False, "message": exc.detail}, status_code=exc.status_code)


# What the status page shows about the AI, from the calls since this instance started.
_ai_state: dict = {"last_ok": None, "last_error": None, "since": time.time()}
_counts: dict = defaultdict(int)  # since this instance started: rules / ai / fallbacks / failures


def _ai_status() -> str:
    if not (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")):
        return "not-configured"
    err, ok = _ai_state["last_error"], _ai_state["last_ok"]
    if err and (not ok or err["at"] > ok) and time.time() - err["at"] < 6 * 3600:
        return "limited" if err["kind"] == "quota" else "failing"
    return "available"


@app.get("/api/health")
async def health():
    return {"ok": True, "service": "ai-api", "engine": "rules", "pairs": len(engine.TRANSLATORS),
            "configured": bool(os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")),
            "ai": _ai_status()}


def _source_type(text: str, given: str | None) -> dict:
    det = checks.detect(text)
    if not det["std"]:
        raise HTTPException(422, "This doesn't look like an ISO 20022 or SWIFT MT message.")
    if given and given in formats.FORMATS and formats.FORMATS[given]["std"] != det["std"]:
        raise HTTPException(422, f"The message is {'ISO 20022 XML' if det['std'] == 'MX' else 'SWIFT MT'}, but Source is set to {given}.")
    return {**det, "code": given if given in formats.FORMATS else det["code"]}


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("ai-api")


def _ai_error(e: Exception) -> HTTPException:
    # Only the error type and the API's own text are logged, never the message being translated.
    code = getattr(e, "code", None) or getattr(e, "status_code", None)
    log.error("AI call failed: %s (code=%s): %s", type(e).__name__, code, str(e)[:400])
    quota = code == 429 or "RESOURCE_EXHAUSTED" in str(e)
    _ai_state["last_error"] = {"kind": "quota" if quota else "error", "at": time.time()}
    _counts["ai_failed"] += 1
    if isinstance(e, asyncio.TimeoutError):
        return HTTPException(504, "The AI took too long. Try again in a moment.")
    if code == 429 or "RESOURCE_EXHAUSTED" in str(e):
        return HTTPException(503, "The AI has hit its usage limit with Google for now. Try again in a little while.")
    if code in (401, 403) or "API_KEY" in str(e) or "PERMISSION_DENIED" in str(e):
        return HTTPException(503, "The AI key on the server was rejected by Google. It needs to be checked.")
    if code == 404 or "NOT_FOUND" in str(e):
        return HTTPException(503, "The AI model configured on the server isn't available. It needs to be checked.")
    return HTTPException(502, "The AI couldn't produce a usable answer for this message. Try again, or check the message is complete.")


_check_hits: dict[str, deque] = defaultdict(deque)
_engine_hits: dict[str, deque] = defaultdict(deque)
ENGINE_PER_MINUTE = int(os.environ.get("ENGINE_PER_MINUTE", "30"))


def _cheap_admit(req: Request, store: dict, limit: int, what: str) -> None:
    """Rules-engine calls cost nothing, so they get a generous per-minute limit and no daily cap."""
    ip, now = _client_ip(req), time.monotonic()
    q = store[ip]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(429, f"Too many {what} in a minute. Wait a moment and try again.")
    q.append(now)


def _has_key() -> bool:
    return bool(os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY"))


@app.post("/api/check")
async def check(body: RepairRequest, req: Request):
    """Validate a message without the AI: instant, and doesn't count towards the AI limits."""
    _cheap_admit(req, _check_hits, 30, "checks")
    det = checks.detect(body.source)
    v = checks.validate(body.source)
    if det["std"] == "MT":
        hdr = mappings.header_findings(body.source)
        if hdr:
            v["findings"] = v["findings"] + hdr
            v["valid"] = False
    code = det["code"]
    return {"ok": True, "sourceType": code, "version": det.get("version"),
            "equivalent": formats.FORMATS.get(code or "", {}).get("equivalent"), "validation": v}


def _review(source: str, src: str, target: str, message: str, declared: list[str], original: str | None = None,
            parts: list | None = None) -> tuple[dict, dict]:
    """The same checks for every result, whoever wrote it: validation, the pair's rules, value comparison.

    `source` is what was translated (the fixed message, when fixing); values are compared with the
    visitor's `original`, with the declared fixes allowed.
    """
    validation = checks.validate(message)
    if parts and len(parts) > 1:  # one MT per transaction: each is checked against its own piece of the source
        rule_findings = [{**f, "where": f"Message {i + 1} {f.get('where', '')}".strip()}
                         for i, (piece, msg) in enumerate(parts) for f in mappings.pair_findings(src, target, piece, msg)]
    else:
        rule_findings = mappings.pair_findings(src, target, source, message)
    if rule_findings:
        validation["findings"] = validation["findings"] + rule_findings
        validation["valid"] = False
    return validation, checks.compare_values(original or source, message, declared=declared)


def _new_errors(validation: dict, source: str) -> list[dict]:
    """Errors in a result that the source didn't already have (a bad IBAN copied faithfully isn't the engine's fault)."""
    src_vals = {(f["rule"], f.get("value")) for f in checks.validate(source)["findings"] if f["severity"] == "error"}
    return [f for f in validation["findings"] if f["severity"] == "error" and (f["rule"], f.get("value")) not in src_vals]


@app.post("/api/translate")
async def translate(body: TranslateRequest, req: Request):
    det = _source_type(body.source, body.sourceType)
    src = det["code"]
    if src not in formats.FORMATS:
        raise HTTPException(422, f"{src or 'This message type'} isn't supported by the Translator yet.")
    equivalent = formats.FORMATS[src]["equivalent"]
    if not equivalent:
        raise HTTPException(422, f"{src} is free text and has no structured equivalent to translate into.")
    if body.target != equivalent:
        raise HTTPException(422, f"{src} translates to {equivalent}, its direct equivalent.")
    _cheap_admit(req, _engine_hits, ENGINE_PER_MINUTE, "translations")
    t0 = time.monotonic()

    # 1. Fix first, by rule, when asked.
    source, fixed, unresolved, ai_fix = body.source, [], [], False
    if body.fix:
        r = engine.repair(body.source)
        source, fixed, unresolved, ai_fix = r["message"], r["changes"], r["unresolved"], r["needs_ai"]

    def payload(by: str, message: str, filled, dropped, notes: str, extra_fixed=(), reason: str = "", model: str = "", parts=None):
        all_fixed = list(fixed) + list(extra_fixed)
        declared = [f["value"] for f in filled] + [c["after"] for c in all_fixed]
        validation, fidelity = _review(source, src, body.target, message, declared, original=body.source, parts=parts)
        return {
            "ok": True, "kind": "translate", "engine": by, "fallbackReason": reason or None,
            "sourceType": src, "targetType": body.target, "outputType": checks.detect(message)["code"],
            "direct": formats.is_direct(src or "", body.target),
            "message": message, "filled": list(filled), "dropped": list(dropped), "notes": notes,
            "fixed": all_fixed, "unresolved": unresolved if not extra_fixed else [],
            "repairedSource": source if (fixed and source != body.source) else None,
            "carried": fidelity.get("carried", []), "validation": validation, "fidelity": fidelity,
            "model": model or None, "ms": int((time.monotonic() - t0) * 1000),
        }

    # 2. The rules engine.
    rules_result, reason = None, ""
    if ai_fix:
        reason = "Part of the message needs more than a rule-based fix (" + "; ".join(u["issue"].split(":")[0] for u in unresolved[:3]) + ")."
    else:
        try:
            o = engine.translate(source, src, body.target)
            rules_result = payload("rules", o.message, o.filled, o.dropped, " ".join(o.notes), parts=o.parts)
            new_errs = _new_errors(rules_result["validation"], source)
            if not new_errs and rules_result["fidelity"]["ok"]:
                _counts["rules"] += 1
                _counts[f"pair:{src} → {body.target}"] += 1
                return rules_result
            reason = "The rules engine's result broke a rule: " + (new_errs[0]["message"] if new_errs else "a value didn't match the source.")
        except engine.Decline as e:
            reason = str(e)
    log.info("rules engine passed %s -> %s to the AI: %s", src, body.target, reason[:200])
    _counts["fallback"] += 1
    _counts[f"reason:{reason[:80]}"] += 1

    # 3. The AI, only now.
    def keep_rules(note: str):
        rules_result["notes"] = (rules_result["notes"] + " " + note).strip()
        return rules_result

    if not _has_key():
        if rules_result:
            return keep_rules("The AI isn't configured, so this is the rules engine's result with its flags.")
        raise HTTPException(422, f"The rules engine can't translate this one: {reason}")
    try:
        await _admit(req)
    except HTTPException as limit:
        if rules_result:
            return keep_rules("The AI's limit is reached, so this is the rules engine's result with its flags.")
        raise HTTPException(limit.status_code, f"The rules engine can't translate this message: {reason} {limit.detail}")
    from . import agents  # imported lazily so the engine works without ADK credentials
    try:
        out = await agents.translate(source, src, body.target, fix=ai_fix)
    except Exception as e:  # noqa: BLE001 — every failure becomes a plain message
        err = _ai_error(e)
        if rules_result:
            return keep_rules(f"The AI couldn't be reached ({err.detail}) This is the rules engine's result with its flags.")
        # Say why the rules engine passed it on, not just that the AI is out.
        raise HTTPException(err.status_code, f"The rules engine can't translate this message: {reason} "
                                             f"It would normally go to the AI, but {err.detail[0].lower() + err.detail[1:]}")
    _ai_state["last_ok"] = time.time()
    _counts["ai"] += 1
    _counts[f"pair:{src} → {body.target}"] += 1
    return payload("ai", out.message, [f.model_dump() for f in out.filled], [d.model_dump() for d in out.dropped], out.notes,
                   extra_fixed=[c.model_dump() for c in out.fixed], reason=reason, model=agents.MODEL)


@app.post("/api/repair")
async def repair(body: RepairRequest, req: Request):
    det = _source_type(body.source, body.sourceType)
    _cheap_admit(req, _engine_hits, ENGINE_PER_MINUTE, "repairs")
    before = checks.validate(body.source)
    t0 = time.monotonic()
    r = engine.repair(body.source)
    result = {"message": r["message"], "changes": r["changes"], "unresolved": r["unresolved"], "summary": "", "engine": "rules"}
    if r["needs_ai"] and _has_key():
        try:
            await _admit(req)
            from . import agents
            out = await agents.repair(r["message"], det["code"], body.rejectReason)
            result = {"message": out.message, "changes": r["changes"] + [c.model_dump() for c in out.changes],
                      "unresolved": [u.model_dump() for u in out.unresolved], "summary": out.summary, "engine": "ai"}
        except Exception as e:  # noqa: BLE001 — keep the rule-based fixes
            log.warning("AI repair unavailable: %s", type(e).__name__)
    after = checks.validate(result["message"])
    if after.get("std") == "MT":
        hdr = mappings.header_findings(result["message"])
        if hdr:
            after["findings"] = after["findings"] + hdr
            after["valid"] = False
    declared = [c["after"] for c in result["changes"]] + [c["before"] for c in result["changes"]]
    fidelity = checks.compare_values(body.source, result["message"], declared=declared)
    return {
        "ok": True, "kind": "repair", "engine": result["engine"], "sourceType": det["code"],
        "message": result["message"], "changes": result["changes"], "unresolved": result["unresolved"],
        "summary": result["summary"] or (f"{len(result['changes'])} fix{'es' if len(result['changes']) != 1 else ''} by rule." if result["changes"] else "Nothing could be fixed by rule."),
        "sameType": checks.detect(result["message"])["code"] in (None, det["code"]),
        "validationBefore": before, "validation": after, "fidelity": fidelity,
        "ms": int((time.monotonic() - t0) * 1000),
    }
