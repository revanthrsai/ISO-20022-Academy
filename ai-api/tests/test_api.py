"""API tests with the AI replaced by a stub, so they run without a key or network."""
import pytest
from fastapi.testclient import TestClient

from app import main
from app.models import Change, Filled, FieldMap, RepairOutput, TranslateOutput
from tests.test_checks import MT103 as MT103_OLD_RULES, PACS008
from tests.test_mappings import GOOD as MT103  # follows the pacs.008 → MT103 field rules


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    main._hits.clear()
    main._day.update(total=0)
    main._day["per_ip"].clear()
    yield


@pytest.fixture
def client():
    return TestClient(main.app)


def stub(monkeypatch, translate=None, repair=None):
    from app import agents

    async def t(source, st, target):
        return translate

    async def r(source, st, reason):
        return repair

    monkeypatch.setattr(agents, "translate", t)
    monkeypatch.setattr(agents, "repair", r)


def test_health(client):
    assert client.get("/api/health").json()["ok"] is True


def test_translate_clean(client, monkeypatch):
    stub(monkeypatch, translate=TranslateOutput(message=MT103, mapping=[FieldMap(source_field="IntrBkSttlmAmt", target_field=":32A:", value="400,00")]))
    j = client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).json()
    assert j["ok"] and j["sourceType"] == "pacs.008" and j["outputType"] == "MT103" and j["direct"] is True
    assert j["validation"]["valid"] and j["fidelity"]["ok"]


def test_translate_flags_invented_values(client, monkeypatch):
    stub(monkeypatch, translate=TranslateOutput(message=MT103.replace("400,00", "4000,00")))
    j = client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).json()
    assert j["fidelity"]["ok"] is False
    assert {"kind": "amount", "value": "4000 USD"} in j["fidelity"]["invented"]


def test_only_the_direct_equivalent_is_accepted(client, monkeypatch):
    stub(monkeypatch, translate=TranslateOutput(message=MT103))
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


def test_no_key_means_503(client, monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY")
    r = client.post("/api/translate", json={"source": PACS008, "target": "MT103"})
    assert r.status_code == 503 and r.json()["ok"] is False


def test_repair_declared_vs_undeclared(client, monkeypatch):
    broken = PACS008.replace("<IntrBkSttlmDt>2026-06-27", "<IntrBkSttlmDt>2026-27-06")
    fixed = PACS008
    stub(monkeypatch, repair=RepairOutput(message=fixed, changes=[Change(field="IntrBkSttlmDt", before="2026-27-06", after="2026-06-27", reason="Day and month swapped.")]))
    j = client.post("/api/repair", json={"source": broken, "rejectReason": "DT01"}).json()
    assert j["ok"] and not j["validationBefore"]["valid"] and j["validation"]["valid"] and j["fidelity"]["ok"] and j["sameType"]

    sneaky = fixed.replace("400.00", "4000.00")
    stub(monkeypatch, repair=RepairOutput(message=sneaky, changes=[Change(field="IntrBkSttlmDt", before="2026-27-06", after="2026-06-27", reason="x")]))
    j = client.post("/api/repair", json={"source": broken}).json()
    assert j["fidelity"]["ok"] is False


def test_rate_limit(client, monkeypatch):
    stub(monkeypatch, translate=TranslateOutput(message=MT103))
    codes = [client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).status_code for _ in range(main.PER_MINUTE + 1)]
    assert codes[-1] == 429 and set(codes[:-1]) == {200}


def test_ai_failure_is_a_plain_message(client, monkeypatch):
    from app import agents

    async def boom(*a):
        raise ValueError("model said nonsense")

    monkeypatch.setattr(agents, "translate", boom)
    r = client.post("/api/translate", json={"source": PACS008, "target": "MT103"})
    assert r.status_code == 502 and "nonsense" not in r.text


def test_agents_build():
    from app import agents
    assert agents.translator_agent.output_schema is TranslateOutput
    assert not agents.translator_agent.tools  # the check-and-retry loop runs in code
    assert agents.repair_agent.output_schema is RepairOutput


def test_rule_breaks_make_the_result_invalid(client, monkeypatch):
    stub(monkeypatch, translate=TranslateOutput(message=MT103_OLD_RULES))  # :20: and :70: break the rules
    j = client.post("/api/translate", json={"source": PACS008, "target": "MT103"}).json()
    assert j["validation"]["valid"] is False
    assert {"Field 20", "Field 70"} <= {f["rule"] for f in j["validation"]["findings"]}


def test_quota_and_key_errors_say_what_happened(client, monkeypatch):
    from app import agents

    class ApiErr(Exception):
        def __init__(self, code, msg):
            super().__init__(msg)
            self.code = code

    for code, text, word in [(429, "RESOURCE_EXHAUSTED", "usage limit"), (400, "API_KEY_INVALID", "key"), (404, "NOT_FOUND", "model")]:
        async def boom(*a, _c=code, _t=text):
            raise ApiErr(_c, _t)
        monkeypatch.setattr(agents, "translate", boom)
        r = client.post("/api/translate", json={"source": PACS008, "target": "MT103"})
        assert r.status_code == 503 and word in r.json()["message"]


def test_unreadable_first_answer_gets_a_second_try(monkeypatch):
    import asyncio
    from app import agents
    calls = []

    async def fake_run(kind, prompt):
        calls.append(prompt)
        if len(calls) == 1:
            raise RuntimeError("The AI returned no answer.")
        return {"message": MT103}

    monkeypatch.setattr(agents, "_run", fake_run)
    out = asyncio.run(agents.translate(PACS008, "pacs.008", "MT103"))
    assert out.message == MT103 and len(calls) == 2
