"""API tests: the rules engine runs for real; the AI is replaced by a stub, so no key or network is needed."""
import pytest
from fastapi.testclient import TestClient

from app import engine, main
from app.engine.io import Out
from app.models import Change, Filled, RepairOutput, TranslateOutput
from tests.test_checks import MT103 as MT103_OLD_RULES, PACS008
from tests.test_mappings import GOOD as MT103  # follows the pacs.008 → MT103 field rules


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    main._hits.clear()
    main._engine_hits.clear()
    main._check_hits.clear()
    main._day.update(total=0)
    main._day["per_ip"].clear()
    yield


@pytest.fixture
def client():
    return TestClient(main.app)


calls = []


def stub(monkeypatch, translate=None, repair=None):
    from app import agents
    calls.clear()

    async def t(source, st, target, fix=False):
        calls.append(("translate", fix))
        if isinstance(translate, Exception):
            raise translate
        return translate

    async def r(source, st, reason):
        calls.append(("repair",))
        return repair

    monkeypatch.setattr(agents, "translate", t)
    monkeypatch.setattr(agents, "repair", r)


def engine_declines(monkeypatch):
    def no(*a, **k):
        raise engine.Decline("test: not covered")
    monkeypatch.setattr(engine, "translate", no)


def test_health(client):
    assert client.get("/api/health").json()["ok"] is True


# ── the rules engine answers first ──────────────────────────────────────────
def test_engine_translates_without_the_ai(client, monkeypatch):
    stub(monkeypatch, translate=RuntimeError("the AI must not be called"))
    j = client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).json()
    assert j["ok"] and j["engine"] == "rules" and calls == []
    assert j["outputType"] == "MT103" and j["validation"]["valid"] and j["fidelity"]["ok"]
    assert {"kind": "amount", "value": "400 USD"} in j["carried"]


def test_engine_works_without_a_key(client, monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY")
    j = client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).json()
    assert j["ok"] and j["engine"] == "rules"


def test_engine_has_its_own_generous_limit(client, monkeypatch):
    stub(monkeypatch, translate=RuntimeError("no"))
    codes = [client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).status_code for _ in range(main.ENGINE_PER_MINUTE + 1)]
    assert set(codes[:-1]) == {200} and codes[-1] == 429
    assert main._day["total"] == 0  # none of them used the AI budget


# ── the AI only when the engine can't ───────────────────────────────────────
def test_ai_takes_over_when_the_engine_declines(client, monkeypatch):
    engine_declines(monkeypatch)
    stub(monkeypatch, translate=TranslateOutput(message=MT103))
    j = client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).json()
    assert j["engine"] == "ai" and "not covered" in j["fallbackReason"] and calls == [("translate", False)]
    assert j["validation"]["valid"] and j["fidelity"]["ok"]


def test_ai_takes_over_when_the_engine_breaks_a_rule(client, monkeypatch):
    def bad(*a, **k):
        o = Out()
        o.message = MT103.replace("400,00", "4000,00")
        return o
    monkeypatch.setattr(engine, "translate", bad)
    stub(monkeypatch, translate=TranslateOutput(message=MT103))
    j = client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).json()
    assert j["engine"] == "ai" and "broke a rule" in j["fallbackReason"]


def test_ai_answers_are_checked_like_any_other(client, monkeypatch):
    engine_declines(monkeypatch)
    stub(monkeypatch, translate=TranslateOutput(message=MT103.replace("400,00", "4000,00")))
    j = client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).json()
    assert j["fidelity"]["ok"] is False and {"kind": "amount", "value": "4000 USD"} in j["fidelity"]["invented"]
    stub(monkeypatch, translate=TranslateOutput(message=MT103_OLD_RULES))  # :20: and :70: break the rules
    j = client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).json()
    assert j["validation"]["valid"] is False and {"Field 20", "Field 70"} <= {f["rule"] for f in j["validation"]["findings"]}


def test_engine_result_survives_an_ai_outage(client, monkeypatch):
    def flawed(*a, **k):
        o = Out()
        o.message = MT103.replace(":23B:CRED", ":23B:XXXX")
        return o
    monkeypatch.setattr(engine, "translate", flawed)

    class Quota(Exception):
        code = 429
    stub(monkeypatch, translate=Quota("RESOURCE_EXHAUSTED"))
    j = client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).json()
    assert j["ok"] and j["engine"] == "rules" and "usage limit" in j["notes"] and not j["validation"]["valid"]


def test_no_engine_and_no_key(client, monkeypatch):
    engine_declines(monkeypatch)
    monkeypatch.delenv("GOOGLE_API_KEY")
    r = client.post("/api/translate", json={"source": PACS008, "target": "MT103"})
    assert r.status_code == 422 and "not covered" in r.json()["message"]


def test_ai_failure_is_a_plain_message(client, monkeypatch):
    engine_declines(monkeypatch)
    stub(monkeypatch, translate=ValueError("model said nonsense"))
    r = client.post("/api/translate", json={"source": PACS008, "target": "MT103"})
    assert r.status_code == 502 and "nonsense" not in r.text


def test_quota_and_key_errors_say_what_happened(client, monkeypatch):
    engine_declines(monkeypatch)

    class ApiErr(Exception):
        def __init__(self, code, msg):
            super().__init__(msg)
            self.code = code

    for code, text, word in [(429, "RESOURCE_EXHAUSTED", "usage limit"), (400, "API_KEY_INVALID", "key"), (404, "NOT_FOUND", "model")]:
        stub(monkeypatch, translate=ApiErr(code, text))
        r = client.post("/api/translate", json={"source": PACS008, "target": "MT103"})
        assert r.status_code == 503 and word in r.json()["message"]


def test_ai_rate_limit_counts_only_ai_calls(client, monkeypatch):
    engine_declines(monkeypatch)
    stub(monkeypatch, translate=TranslateOutput(message=MT103))
    codes = [client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).status_code for _ in range(main.PER_MINUTE + 1)]
    assert codes[-1] == 429 and set(codes[:-1]) == {200}


# ── fix, then translate ─────────────────────────────────────────────────────
def test_fix_by_rule_then_translate_by_rule(client, monkeypatch):
    stub(monkeypatch, translate=RuntimeError("no"))
    bad = PACS008.replace("<NbOfTxs>1</NbOfTxs>", "<NbOfTxs>2</NbOfTxs>")
    j = client.post("/api/translate", json={"source": bad, "target": "MT103", "fix": True}).json()
    assert j["engine"] == "rules" and calls == []
    assert j["fixed"][0]["after"] == "1" and "<NbOfTxs>1</NbOfTxs>" in j["repairedSource"]
    assert j["validation"]["valid"] and j["fidelity"]["ok"]


def test_fix_that_needs_the_ai(client, monkeypatch):
    stub(monkeypatch, translate=TranslateOutput(message=MT103, fixed=[Change(field="32A", before="x", after="y", reason="z")]))
    broken = MT103_OLD_RULES.replace(":32A:", ":32A:garbled")
    r = client.post("/api/translate", json={"source": broken, "target": "pacs.008", "fix": True})
    j = r.json()
    assert j["engine"] == "ai" and calls == [("translate", True)] and "rule-based fix" in j["fallbackReason"]


# ── validation and inputs ───────────────────────────────────────────────────
def test_only_the_direct_equivalent_is_accepted(client):
    r = client.post("/api/translate", json={"source": MT103_OLD_RULES, "target": "pain.001"})
    assert r.status_code == 422 and "pacs.008" in r.json()["message"]
    r = client.post("/api/translate", json={"source": ":20:X\n:79:hello there", "target": "pacs.002"})
    assert r.status_code == 422 and "no structured equivalent" in r.json()["message"]


def test_check_endpoint_needs_no_key_and_finds_errors(client, monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY")
    bad = PACS008.replace("<NbOfTxs>1</NbOfTxs>", "<NbOfTxs>2</NbOfTxs>")
    j = client.post("/api/check", json={"source": bad}).json()
    assert j["sourceType"] == "pacs.008" and j["equivalent"] == "MT103" and j["version"] == "pacs.008.001.08"
    assert j["validation"]["valid"] is False and j["validation"]["findings"][0]["rule"] == "NbOfTxs"


def test_rejects_bad_input(client):
    assert client.post("/api/translate", json={"source": "hello", "target": "MT103"}).status_code == 422
    assert client.post("/api/translate", json={"source": PACS008, "target": "pacs.008"}).status_code == 422
    assert client.post("/api/translate", json={"source": PACS008, "target": "MT101"}).status_code == 422
    assert client.post("/api/translate", json={"source": PACS008, "target": "MT103", "sourceType": "MT101"}).status_code == 422
    assert client.post("/api/translate", json={"source": "x" * 20001, "target": "MT103"}).status_code == 422


# ── repair ──────────────────────────────────────────────────────────────────
def test_repair_by_rule(client, monkeypatch):
    stub(monkeypatch, repair=RuntimeError("no"))
    broken = PACS008.replace("<IntrBkSttlmDt>2026-06-27", "<IntrBkSttlmDt>2026-27-06")
    j = client.post("/api/repair", json={"source": broken, "rejectReason": "DT01"}).json()
    assert j["ok"] and j["engine"] == "rules" and calls == []
    assert not j["validationBefore"]["valid"] and j["validation"]["valid"] and j["fidelity"]["ok"] and j["sameType"]


def test_repair_falls_back_to_the_ai_for_broken_structure(client, monkeypatch):
    stub(monkeypatch, repair=RepairOutput(message=PACS008, changes=[Change(field="XML", before="", after="", reason="closed the tags")]))
    broken = PACS008[: PACS008.index("</CdtTrfTxInf>")]
    j = client.post("/api/repair", json={"source": broken}).json()
    assert j["engine"] == "ai" and calls == [("repair",)] and j["validation"]["valid"]


def test_agents_build():
    from app import agents
    assert agents.translator_agent.output_schema is TranslateOutput
    assert not agents.translator_agent.tools  # the check-and-retry loop runs in code
    assert agents.repair_agent.output_schema is RepairOutput


def test_unreadable_first_answer_gets_a_second_try(monkeypatch):
    import asyncio
    from app import agents
    seen = []

    async def fake_run(kind, prompt):
        seen.append(prompt)
        if len(seen) == 1:
            raise RuntimeError("The AI returned no answer.")
        return {"message": MT103}

    monkeypatch.setattr(agents, "_run", fake_run)
    out = asyncio.run(agents.translate(PACS008, "pacs.008", "MT103"))
    assert out.message == MT103 and len(seen) == 2


def test_sample_answers_are_reused_but_visitor_messages_are_not(monkeypatch):
    import asyncio, json
    from pathlib import Path
    from app import agents
    samples = Path(__file__).parents[2] / "samples"
    if not samples.exists():
        pytest.skip("samples folder not next to ai-api")
    sample = json.loads((samples / "pacs.008.json").read_text())["xml"]
    good = json.loads((samples / "MT103.json").read_text())["message"]
    seen = []

    async def fake_run(kind, prompt):
        seen.append(prompt)
        return {"message": good}

    monkeypatch.setattr(agents, "_run", fake_run)
    agents._sample_cache.clear()
    for _ in range(3):
        asyncio.run(agents.translate(sample.replace("\n", "\r\n"), "pacs.008", "MT103"))
    assert len(seen) == 1
    own = sample.replace("400.00", "401.00")
    asyncio.run(agents.translate(own, "pacs.008", "MT103"))
    assert all(k[0] in agents._SAMPLE_HASHES for k in agents._sample_cache)


def test_fix_mode_sends_the_errors_in_one_call(monkeypatch):
    import asyncio
    from app import agents
    seen = []

    async def fake_run(kind, prompt):
        seen.append(prompt)
        return {"message": MT103, "fixed": [{"field": "NbOfTxs", "before": "2", "after": "1", "reason": "one transaction"}]}

    monkeypatch.setattr(agents, "_run", fake_run)
    bad = PACS008.replace("<NbOfTxs>1</NbOfTxs>", "<NbOfTxs>2</NbOfTxs>")
    out = asyncio.run(agents.translate(bad, "pacs.008", "MT103", fix=True))
    assert "Fix the source first" in seen[0] and "NbOfTxs" in seen[0] and out.fixed[0].after == "1"


def test_fix_checks_the_result_against_the_fixed_message(client, monkeypatch):
    stub(monkeypatch, translate=RuntimeError("no"))
    bad = PACS008.replace("<NbOfTxs>1</NbOfTxs>", "<NbOfTxs>2</NbOfTxs>").replace("<IntrBkSttlmDt>2026-06-27", "<IntrBkSttlmDt>2026-27-06")
    j = client.post("/api/translate", json={"source": bad, "target": "MT103", "fix": True}).json()
    assert j["engine"] == "rules" and calls == [] and j["validation"]["valid"] and j["fidelity"]["ok"], j["validation"]


def test_several_transactions_are_split_by_the_engine(client, monkeypatch):
    stub(monkeypatch, translate=RuntimeError("no"))
    i, j = PACS008.index("<CdtTrfTxInf>"), PACS008.index("</CdtTrfTxInf>") + len("</CdtTrfTxInf>")
    tx = PACS008[i:j]
    two = PACS008.replace(tx, tx + tx.replace("400.00", "50.00")).replace("<NbOfTxs>1</NbOfTxs>", "<NbOfTxs>2</NbOfTxs>")
    j = client.post("/api/translate", json={"source": two, "target": "MT103"}).json()
    assert j["engine"] == "rules" and calls == [] and j["message"].count(":32A:") == 2
    assert j["validation"]["valid"] and j["fidelity"]["ok"], (j["validation"], j["fidelity"])


def test_decline_with_the_ai_out_says_why(client, monkeypatch):
    engine_declines(monkeypatch)

    class Quota(Exception):
        code = 429
    stub(monkeypatch, translate=Quota("RESOURCE_EXHAUSTED"))
    r = client.post("/api/translate", json={"source": PACS008, "target": "MT103"})
    assert r.status_code == 503 and "not covered" in r.json()["message"] and "usage limit" in r.json()["message"]
