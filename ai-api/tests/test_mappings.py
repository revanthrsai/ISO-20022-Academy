from app import mappings
from tests.test_checks import MT103, PACS008

GOOD = MT103.replace(":20:EBILAEAD-INSTR\n", ":20:EBILAEAD-INSTR-0\n").replace(":70:Invoice 0042 - June freelance", ":70:/ROC/BOB-INV0042\nInvoice 0042 - June freelance")


def test_rules_text_covers_pair_and_headers():
    t = mappings.rules_for("pacs.008", "MT103")
    assert "InstrId" in t and "/ROC/" in t and "Block 1" in t
    assert "rebuild" in mappings.rules_for("pacs.008", "pain.001")


def test_good_mt103_passes_rules():
    assert mappings.pair_findings("pacs.008", "MT103", PACS008, GOOD) == []


def test_wrong_field_20_and_missing_roc_are_caught():
    bad = MT103.replace(":20:EBILAEAD-INSTR\n", ":20:BOB-INV0042\n")
    rules = {f["rule"] for f in mappings.pair_findings("pacs.008", "MT103", PACS008, bad)}
    assert {"Field 20", "Field 70"} <= rules


def test_bad_header_and_lost_uetr_are_caught():
    bad = GOOD.replace("{1:F01EBILAEADAXXX0000000000}", "{1:F01EBILAEADXXX}").replace("{3:{121:eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4}}", "")
    rules = {f["rule"] for f in mappings.pair_findings("pacs.008", "MT103", PACS008, bad)}
    assert {"Block 1", "UETR"} <= rules


def test_missing_52a_is_caught():
    bad = GOOD.replace(":52A:EBILAEAD\n", "")
    assert "Field 52A" in {f["rule"] for f in mappings.pair_findings("pacs.008", "MT103", PACS008, bad)}
