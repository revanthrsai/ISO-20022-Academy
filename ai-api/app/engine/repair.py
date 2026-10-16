"""
Rule-based repair: only fixes that are provably right, each one listed.

Anything that only the sender can know (a wrong IBAN checksum, a missing name,
an amount with too many decimals that aren't zeros) is left alone and reported
as unresolved. `needs_ai` says whether what's left is the kind of damage an AI
might sort out (broken XML, a garbled field layout), as opposed to missing facts.
"""
from __future__ import annotations

import re
from datetime import date
from decimal import Decimal

from lxml import etree

from .. import checks, mappings

# Errors an AI could plausibly untangle (layout / syntax), as opposed to facts only the sender has.
AI_CAN_HELP = {"Malformed XML", "MT format", "Namespace", "Unrecognised", "Schema", "Field 32A", "Field 32B",
               "Field 33B", "Block 1", "Block 2", "Charges", "Bank operation code"}
SENDER_ONLY = {
    "IBAN": "The IBAN's check digits don't match, so a character is wrong. Only the sender knows the right account.",
    "BIC": "The BIC isn't valid and can't be worked out from the message. Confirm it with the sender.",
    "Reference": "References are limited to 16 characters. Cutting one changes it, so the sender should choose.",
    "Mandatory field": "The value isn't in the message, so it can't be filled in without the sender.",
    "Amount precision": "The amount has more decimals than the currency allows, and they aren't zeros. The sender must confirm the amount.",
    "Date": "The date can't be read one way only. Confirm it with the sender.",
    "UETR": "The UETR isn't a valid UUID. It identifies the payment end to end, so it can't be invented.",
    "Amount": "The amount can't be read. Confirm it with the sender.",
    "NbOfTxs": "The transaction count couldn't be recalculated.",
    "CtrlSum": "The control sum couldn't be recalculated.",
}


def _change(field, before, after, reason):
    return {"field": field, "before": before, "after": after, "reason": reason}


def _fix_date(val: str) -> tuple[str, str] | None:
    """(iso, reason) when exactly one reading of the date is a real date."""
    v = val.strip()
    cands = []
    for rx, order in ((r"(\d{4})-(\d{2})-(\d{2})", "ydm"), (r"(\d{4})/(\d{2})/(\d{2})", "ymd"), (r"(\d{4})(\d{2})(\d{2})", "ymd"),
                      (r"(\d{2})[-/.](\d{2})[-/.](\d{4})", "dmy|mdy")):
        m = re.fullmatch(rx, v)
        if not m:
            continue
        a, b, c = m.groups()
        for o in order.split("|"):
            y, mo, d = {"ymd": (a, b, c), "ydm": (a, c, b), "dmy": (c, b, a), "mdy": (c, a, b)}[o]
            try:
                date(int(y), int(mo), int(d))
                cands.append(f"{y}-{mo}-{d}")
            except ValueError:
                pass
    cands = sorted(set(cands))
    if len(cands) == 1 and cands[0] != v:
        return cands[0], "Written in another date layout; ISO 20022 dates are YYYY-MM-DD." if re.fullmatch(r"\d{4}-\d{2}-\d{2}", v) is None \
            else "Day and month were swapped; this is the only reading that is a real date."
    return None


def _fix_amount(val: str, ccy: str) -> tuple[str, str] | None:
    v = val.strip()
    new, why = v, ""
    if re.fullmatch(r"\d{1,3}(,\d{3})+(\.\d+)?", v):
        new, why = v.replace(",", ""), "Thousands separators aren't allowed in amounts."
    elif re.fullmatch(r"\d+,\d+", v):
        new, why = v.replace(",", "."), "ISO 20022 amounts use a dot for decimals."
    allowed = checks.CCY_DECIMALS.get(ccy)
    if allowed is not None and "." in new:
        whole, frac = new.split(".")
        if len(frac) > allowed and set(frac[allowed:]) <= {"0"}:
            new = whole + ("." + frac[:allowed] if allowed else "")
            why = (why + " " if why else "") + f"{ccy} has {allowed} decimals; the extra ones were zeros."
    return (new, why.strip()) if new != v else None


# ── ISO 20022 ───────────────────────────────────────────────────────────────
def repair_mx(text: str) -> tuple[str, list[dict]]:
    root, _ = checks._parse_xml(text)
    if root is None:
        return text, []
    changes = []
    for el in root.iter():
        if not isinstance(el.tag, str):
            continue
        name, val, where = checks.local(el.tag), (el.text or ""), checks.path_of(el)
        sval = val.strip()
        if not sval:
            continue
        if name == "IBAN":
            new = re.sub(r"\s+", "", sval).upper()
            if new != sval:
                el.text = new
                changes.append(_change(where, sval, new, "IBANs are written without spaces, in capitals."))
        elif name in ("BICFI", "AnyBIC", "BIC"):
            new = re.sub(r"\s+", "", sval).upper()
            if new != sval and checks.BIC_RE.fullmatch(new):
                el.text = new
                changes.append(_change(where, sval, new, "BICs are written in capitals, without spaces."))
        elif name in ("UETR", "OrgnlUETR"):
            new = sval.lower()
            if new != sval and checks.UUID_RE.fullmatch(new):
                el.text = new
                changes.append(_change(where, sval, new, "A UETR is written in lowercase."))
        elif name.endswith("Dt") and not name.endswith("DtTm") and not checks.real_date(sval):
            fx = _fix_date(sval)
            if fx:
                el.text = fx[0]
                changes.append(_change(where, sval, fx[0], fx[1]))
        ccy = el.get("Ccy")
        if ccy is not None:
            if ccy != ccy.upper():
                el.set("Ccy", ccy.upper())
                changes.append(_change(where + " @Ccy", ccy, ccy.upper(), "Currency codes are capitals."))
                ccy = ccy.upper()
            fx = _fix_amount(el.text or "", ccy)
            if fx:
                changes.append(_change(where, (el.text or "").strip(), fx[0], fx[1]))
                el.text = fx[0]

    # Counts and control sums, recalculated after the amount fixes.
    txs = [e for e in root.iter() if isinstance(e.tag, str) and checks.local(e.tag) in ("CdtTrfTxInf", "DrctDbtTxInf")]
    for grp in [e for e in root.iter() if isinstance(e.tag, str) and checks.local(e.tag) in ("GrpHdr", "PmtInf")]:
        kids = {checks.local(c.tag): c for c in grp if isinstance(c.tag, str)}
        scope = txs if checks.local(grp.tag) == "GrpHdr" else [e for e in grp.iter() if isinstance(e.tag, str) and checks.local(e.tag) in ("CdtTrfTxInf", "DrctDbtTxInf")]
        if not scope:
            continue
        if "NbOfTxs" in kids and (kids["NbOfTxs"].text or "").strip() != str(len(scope)):
            before = (kids["NbOfTxs"].text or "").strip()
            kids["NbOfTxs"].text = str(len(scope))
            changes.append(_change(checks.path_of(kids["NbOfTxs"]), before, str(len(scope)), f"The message carries {len(scope)} transaction{'s' if len(scope) != 1 else ''}."))
        if "CtrlSum" in kids:
            total, ok = Decimal(0), True
            for tx in scope:
                a = next((x for x in tx.iter() if isinstance(x.tag, str) and checks.local(x.tag) in ("IntrBkSttlmAmt", "InstdAmt")), None)
                if a is None or checks.norm_amount(a.text or "") is None:
                    ok = False
                    break
                total += Decimal(checks.norm_amount(a.text))
            before = (kids["CtrlSum"].text or "").strip()
            if ok and (checks.norm_amount(before) is None or Decimal(checks.norm_amount(before)) != total):
                places = max((len((a.text or "").split(".")[1]) for tx in scope for a in tx.iter()
                              if isinstance(a.tag, str) and checks.local(a.tag) in ("IntrBkSttlmAmt", "InstdAmt") and "." in (a.text or "")), default=0)
                after = f"{total:.{places}f}"
                kids["CtrlSum"].text = after
                changes.append(_change(checks.path_of(kids["CtrlSum"]), before, after, "The control sum is the total of the transaction amounts."))
    if not changes:
        return text, []
    decl = re.match(r"\s*(<\?xml[^>]*\?>)", text)
    body = etree.tostring(root, encoding="unicode")
    return ((decl.group(1) + "\n") if decl else "") + body, changes


# ── SWIFT MT ────────────────────────────────────────────────────────────────
_CHRG = {"SHAR": "SHA", "DEBT": "OUR", "CRED": "BEN"}


def _mt_amount(raw: str) -> str:
    v = raw.strip()
    if re.fullmatch(r"\d{1,3}(,\d{3})+(\.\d+)?", v):  # 1,000.00
        v = v.replace(",", "")
    if "." in v and "," not in v:
        v = v.replace(".", ",")
    if "," not in v:
        v += ","
    return v


def repair_mt(text: str) -> tuple[str, list[dict]]:
    changes = []
    t = text or ""
    # Header blocks: an LT address is BIC8 + terminal letter + branch.
    def fix_b1(m):
        addr = m.group(1)
        if re.fullmatch(r"[A-Z]{6}[A-Z0-9]{2}", addr):
            new = addr + "AXXX"
        elif re.fullmatch(r"[A-Z]{6}[A-Z0-9]{5}", addr):
            new = addr[:8] + "A" + addr[8:]
        else:
            return m.group(0)
        changes.append(_change("Block 1", addr, new, "The sender's LT address is the BIC8, the terminal letter A, then the branch (XXX when none)."))
        return "{1:F01" + new + m.group(2) + "}"
    t = re.sub(r"\{1:F01([A-Z0-9]{8,11}?)(\d{10})\}", fix_b1, t, count=1)

    def fix_b2(m):
        addr = m.group(2)
        if re.fullmatch(r"[A-Z]{6}[A-Z0-9]{2}", addr):
            new = addr + "XXXX"
        elif re.fullmatch(r"[A-Z]{6}[A-Z0-9]{5}", addr):
            new = addr[:8] + "X" + addr[8:]
        else:
            return m.group(0)
        changes.append(_change("Block 2", addr, new, "The receiver's address is the BIC8, X, then the branch (XXX when none)."))
        return "{2:I" + m.group(1) + new + (m.group(3) or "N") + "}"
    t = re.sub(r"\{2:I(\d{3})([A-Z0-9]{8}|[A-Z0-9]{11})([NUS]?)\}", fix_b2, t, count=1)

    fields = checks.mt_fields(t)
    if not fields:
        return text, []
    det = checks.detect(t)
    new_fields = []
    for tag, val in fields:
        lines = val.split("\n")
        first = lines[0].strip()
        fixed = first
        why = ""
        if tag == "32A":
            m = re.fullmatch(r"(\d{8}|\d{6})([A-Za-z]{3})([\d.,]+)", first)
            if m:
                d = m.group(1)[2:] if len(m.group(1)) == 8 else m.group(1)
                fixed = d + m.group(2).upper() + _mt_amount(m.group(3))
                why = "32A is YYMMDD + currency + amount with a comma decimal."
        elif tag in ("32B", "33B"):
            m = re.fullmatch(r"([A-Za-z]{3})([\d.,]+)", first)
            if m:
                fixed = m.group(1).upper() + _mt_amount(m.group(2))
                why = f"{tag} is currency + amount with a comma decimal."
        elif tag == "71A":
            fixed = _CHRG.get(first.upper(), first.upper())
            why = "71A is OUR, BEN or SHA."
        elif tag == "23B":
            fixed = first.upper()
            why = "23B is written in capitals."
        elif tag == "30":
            if re.fullmatch(r"\d{8}", first):
                fixed = first[2:]
                why = "30 is a YYMMDD date."
        elif tag[:2] in ("50", "59") and first.startswith("/"):
            acct = re.sub(r"\s+", "", first[1:])
            if acct != first[1:] and re.fullmatch(r"[A-Za-z]{2}\d{2}[A-Za-z0-9]+", acct):
                fixed = "/" + acct.upper()
                why = "IBANs are written without spaces, in capitals."
        if fixed != first and why:
            changes.append(_change(f":{tag}:", first, fixed, why))
            lines[0] = fixed
        new_fields.append((tag, "\n".join(lines)))
    if det["code"] in ("MT103", "MT103 RETN") and not any(tg == "23B" for tg, _ in new_fields):
        i = next((k + 1 for k, (tg, _) in enumerate(new_fields) if tg == "20"), 0)
        new_fields.insert(i, ("23B", "CRED"))
        changes.append(_change(":23B:", "", "CRED", "23B is mandatory in an MT103; CRED is the code for a normal credit transfer."))
    if not changes:
        return text, []
    body = "\n".join(f":{tg}:{v}" for tg, v in new_fields)
    b4 = re.search(r"\{4:\s*(.*?)-\}", t, re.S)
    if b4:
        t = t[:b4.start()] + "{4:\n" + body + "\n-}" + t[b4.end():]
    else:
        t = body
    return t, changes


# ── both ────────────────────────────────────────────────────────────────────
def repair(text: str) -> dict:
    """{message, changes, unresolved, needs_ai, valid}."""
    det = checks.detect(text)
    fixed, changes = (repair_mx(text) if det["std"] == "MX" else repair_mt(text) if det["std"] == "MT" else (text, []))
    v = checks.validate(fixed)
    if v.get("std") == "MT":
        hdr = mappings.header_findings(fixed)
        if hdr:
            v["findings"] += hdr
            v["valid"] = False
    errors = [f for f in v["findings"] if f["severity"] == "error"]
    unresolved = [{"issue": f"{f['rule']}: {f['message']}", "reason": SENDER_ONLY.get(f["rule"], "This needs a closer look before the message can go.")}
                  for f in errors]
    return {"message": fixed, "changes": changes, "unresolved": unresolved,
            "needs_ai": any(f["rule"] in AI_CAN_HELP for f in errors), "valid": not errors}
