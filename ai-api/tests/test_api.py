"""API tests with the AI replaced by a stub, so they run without a key or network."""
import pytest
from fastapi.testclient import TestClient

from app import main
from app.models import Change, Filled, FieldMap, RepairOutput, TranslateOutput
from tests.test_checks import MT103, PACS008


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


def test_rebuild_pair_is_allowed_but_not_direct(client, monkeypatch):
    stub(monkeypatch, translate=TranslateOutput(message=PACS008.replace("pacs.008.001.08", "pain.001.001.09")))
    j = client.post("/api/translate", json={"source": MT103, "target": "pain.001"}).json()
    assert j["ok"] and j["direct"] is False


def test_rejects_bad_input(client):
    assert client.post("/api/translate", json={"source": "hello", "target": "MT103"}).status_code == 422
    assert client.post("/api/translate", json={"source": PACS008, "target": "pacs.008"}).status_code == 422
    assert client.post("/api/translate", json={"source": PACS008, "target": "MT999"}).status_code == 422
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
    assert {t.__name__ for t in agents.translator_agent.tools} == {"get_format_spec", "validate_message", "compare_values"}
