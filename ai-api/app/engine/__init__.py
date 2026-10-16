"""
The rules engine: translates and repairs payment messages by fixed rules.

It runs first for every request. The AI is the fallback, called only when the
engine declines (a structure it doesn't cover, a message it can't read) or its
result breaks a rule that the source didn't already break.
"""
from __future__ import annotations

from . import mt_to_mx, mx_to_mt
from .io import Decline, Out
from .repair import repair

TRANSLATORS = {
    ("pacs.008", "MT103"): mx_to_mt.pacs008_mt103,
    ("pacs.004", "MT103 RETN"): mx_to_mt.pacs004_mt103retn,
    ("pain.001", "MT101"): mx_to_mt.pain001_mt101,
    ("pain.008", "MT104"): mx_to_mt.pain008_mt104,
    ("camt.053", "MT940"): mx_to_mt.camt053_mt940,
    ("camt.054", "MT900 / MT910"): mx_to_mt.camt054_mt9x0,
    ("camt.056", "MT192"): mx_to_mt.camt056_mt192,
    ("pacs.002", "MT199"): mx_to_mt.pacs002_mt199,
    ("pain.002", "MT199"): mx_to_mt.pain002_mt199,
    ("MT103", "pacs.008"): mt_to_mx.mt103_pacs008,
    ("MT103 RETN", "pacs.004"): mt_to_mx.mt103retn_pacs004,
    ("MT101", "pain.001"): mt_to_mx.mt101_pain001,
    ("MT104", "pain.008"): mt_to_mx.mt104_pain008,
    ("MT940", "camt.053"): mt_to_mx.mt940_camt053,
    ("MT900 / MT910", "camt.054"): mt_to_mx.mt9x0_camt054,
    ("MT192", "camt.056"): mt_to_mx.mt192_camt056,
}


def supports(src: str | None, tgt: str) -> bool:
    return (src or "", tgt) in TRANSLATORS


def translate(source: str, src: str, tgt: str) -> Out:
    """Raises Decline when the engine can't do this one faithfully."""
    fn = TRANSLATORS.get((src, tgt))
    if fn is None:
        raise Decline(f"The rules engine has no rules for {src} → {tgt}.")
    try:
        return fn(source)
    except Decline:
        raise
    except Exception as e:  # noqa: BLE001 — an engine bug must fall back, not crash
        raise Decline(f"The rules engine couldn't read this message ({type(e).__name__}).") from e


__all__ = ["Decline", "Out", "TRANSLATORS", "repair", "supports", "translate"]
