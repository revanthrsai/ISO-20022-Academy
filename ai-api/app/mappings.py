"""
Field rules for each translation pair, plus the checks that enforce the most
important ones.

The rules go into every prompt for that pair, so the agent follows the
standard mapping instead of improvising. The rule checks below run on every
answer; a broken rule counts as a problem, so the agent gets one retry with
the exact rule it broke, and anything still wrong is shown to the visitor.

This is how the AI is "taught" here: not by retraining the model, but by giving
it the rules each time and refusing answers that break them.
"""
from __future__ import annotations

import re

from lxml import etree

from . import checks

# ── header blocks: shared by every MT output ─────────────────────────────────
MT_HEADERS = """MT header blocks:
- Block 1: {1:F01<sender LT address>0000000000}. The LT address is 12 characters: the sender's
  8-character BIC, then the terminal letter A, then the branch code (the last 3 characters of an
  11-character BIC, or XXX when the BIC has 8). Never invent a branch code.
- Block 2: {2:I<MT number><receiver address>N}. The receiver address is the receiver's 8-character
  BIC, then X, then the branch code (or XXX).
- Sender = the instructing agent (InstgAgt), else the debtor agent. Receiver = the instructed agent
  (InstdAgt), else the creditor agent.
- Block 3: {3:{121:<UETR>}} whenever the source has a UETR. Copy it exactly, lowercase.
- Block 4 starts with {4: on its own line and ends with -}."""

RULES: dict[tuple[str, str], str] = {
    ("pacs.008", "MT103"): """pacs.008 → MT103 field rules:
- :20: = CdtTrfTxInf/PmtId/InstrId, cut to 16 characters. Only if InstrId is absent, use EndToEndId.
- :23B: = CRED.
- :32A: = IntrBkSttlmDt as YYMMDD + IntrBkSttlmAmt@Ccy + amount with a comma decimal (400.00 → 400,00).
- :33B: only when InstdAmt is present: its currency and amount.
- :50K: = DbtrAcct (IBAN or Othr/Id) on the first line as /account, then Dbtr/Nm and address lines (max 35 characters each).
- :52A: = DbtrAgt/FinInstnId/BICFI.
- :56A: = IntrmyAgt1 BIC when present.
- :57A: = CdtrAgt/FinInstnId/BICFI.
- :59: = CdtrAcct on the first line as /account, then Cdtr/Nm and address lines.
- :70: = /ROC/<EndToEndId> on the first line when EndToEndId is present and not NOTPROVIDED,
  then RmtInf/Ustrd (4 lines of 35 characters in total; cut, never drop silently).
- :71A: = ChrgBr: SHAR → SHA, DEBT → OUR, CRED → BEN.
- GrpHdr/MsgId and CreDtTm have no place in MT103: list them under "dropped".""",

    ("MT103", "pacs.008"): """MT103 → pacs.008 field rules:
- GrpHdr/MsgId: generate a new one (list it under "filled"). CreDtTm: now, with offset (filled). NbOfTxs = 1.
- GrpHdr/SttlmInf/SttlmMtd = INDA unless the message shows otherwise.
- InstgAgt = sender BIC from block 1; InstdAgt = receiver BIC from block 2 (8 or 11 characters, never an LT address).
- PmtId/InstrId = :20:.
- PmtId/EndToEndId = the value after /ROC/ in :70: when present, otherwise NOTPROVIDED (list it under "filled").
- PmtId/UETR = {121:} from block 3, exactly. If missing, generate a UUID v4 (filled).
- IntrBkSttlmAmt@Ccy and IntrBkSttlmDt from :32A: (comma becomes a dot; YYMMDD becomes YYYY-MM-DD).
- InstdAmt from :33B: when present.
- ChrgBr from :71A:: SHA → SHAR, OUR → DEBT, BEN → CRED.
- Dbtr/Nm and address from :50a:; DbtrAcct from its /account line (IBAN when it is one, else Othr/Id).
- DbtrAgt = :52A: BIC, else the sender BIC. CdtrAgt = :57A: BIC, else the receiver BIC.
- Cdtr/Nm and address from :59a:; CdtrAcct from its /account line.
- RmtInf/Ustrd = :70: without the /ROC/ part, lines joined with a space.""",

    ("pacs.004", "MT103 RETN"): """pacs.004 → MT103 (return) field rules:
- :20: = TxInf/RtrId, cut to 16 characters.
- :23B: = CRED.
- :32A: = IntrBkSttlmDt + RtrdIntrBkSttlmAmt (currency + comma amount).
- :50K: / :59: = the original creditor / debtor (the parties swap in a return), with accounts when given.
- :72: = /RETN/99 on line 1, then /<return reason code from RtrRsnInf/Rsn/Cd>/ plus short text on line 2,
  then /MREF/<original sender's reference: OrgnlInstrId, else OrgnlEndToEndId> on line 3.
- :71A: = SHA unless the return charges say otherwise.
- {121:} = OrgnlUETR.""",

    ("MT103 RETN", "pacs.004"): """MT103 (return) → pacs.004 field rules:
- TxInf/RtrId = :20:. OrgnlInstrId = the value after /MREF/ in :72:.
- RtrRsnInf/Rsn/Cd = the code on the second line of :72: (between slashes).
- RtrdIntrBkSttlmAmt and IntrBkSttlmDt from :32A:. OrgnlUETR = {121:}.
- OrgnlGrpInf/OrgnlMsgNmId = pacs.008.001.08; OrgnlMsgId = NOTPROVIDED unless known (filled).""",

    ("pain.001", "MT101"): """pain.001 → MT101 field rules:
- Sequence A: :20: = GrpHdr/MsgId (16 characters). :28D: = 1/1.
  :50H: = /DbtrAcct on line 1, then Dbtr/Nm and address. :52A: = DbtrAgt BIC.
  :30: = PmtInf/ReqdExctnDt (YYMMDD).
- Sequence B, one per CdtTrfTxInf: :21: = PmtId/EndToEndId (16 characters). :32B: = InstdAmt currency + comma amount.
  :57A: = CdtrAgt BIC. :59: = /CdtrAcct then Cdtr/Nm and address. :70: = RmtInf/Ustrd.
  :71A: from ChrgBr (SHAR → SHA, DEBT → OUR, CRED → BEN; SLEV → SHA).""",

    ("MT101", "pain.001"): """MT101 → pain.001 field rules:
- GrpHdr/MsgId = :20:. NbOfTxs and CtrlSum = count and sum of the :32B: amounts. InitgPty/Nm = the :50H: name.
- PmtInf/PmtInfId = :20:. PmtMtd = TRF. ReqdExctnDt/Dt = :30: as YYYY-MM-DD.
- Dbtr/Nm and DbtrAcct from :50H:; DbtrAgt = :52A:.
- One CdtTrfTxInf per sequence B: EndToEndId = :21:, InstdAmt from :32B:, CdtrAgt = :57A:,
  Cdtr and CdtrAcct from :59a:, RmtInf/Ustrd = :70:, ChrgBr from :71A:.""",

    ("pain.008", "MT104"): """pain.008 → MT104 field rules:
- :20: = GrpHdr/MsgId. :30: = PmtInf/ReqdColltnDt (YYMMDD).
- One sequence B per DrctDbtTxInf: :21: = EndToEndId. :32B: = InstdAmt.
  :50K: = the creditor (/CdtrAcct, Cdtr/Nm). :57A: = DbtrAgt BIC. :59: = the debtor (/DbtrAcct, Dbtr/Nm).
  :70: = RmtInf/Ustrd. :71A: = SHA.
- Sequence C: :32B: = the total; :19: = the sum when there is more than one transaction.""",

    ("MT104", "pain.008"): """MT104 → pain.008 field rules:
- GrpHdr/MsgId = :20:. PmtInf/ReqdColltnDt = :30:. PmtMtd = DD.
- Cdtr and CdtrAcct from :50K:. Each sequence B becomes a DrctDbtTxInf: EndToEndId = :21:,
  InstdAmt = :32B:, DbtrAgt = :57A:, Dbtr and DbtrAcct = :59:, RmtInf/Ustrd = :70:.
- MndtRltdInf/MndtId: NOTPROVIDED unless the message gives one (filled).""",

    ("camt.053", "MT940"): """camt.053 → MT940 field rules:
- :20: = Stmt/Id (16 characters), else GrpHdr/MsgId. :25: = Stmt/Acct/Id/IBAN (or Othr/Id).
- :28C: = Stmt/LglSeqNb or ElctrncSeqNb, as <number>/1.
- :60F: = the OPBD balance: C or D (from CdtDbtInd), its date YYMMDD, currency, comma amount.
- One :61: per Ntry: value date YYMMDD + booking date MMDD + C or D + comma amount + N + transaction code
  (NTRF by default) + reference (EndToEndId, else AcctSvcrRef, else NONREF, 16 characters).
  Then :86: with the counterparty name and remittance information.
- :62F: = the CLBD balance, same format. :64: = the CLAV balance when present.""",

    ("MT940", "camt.053"): """MT940 → camt.053 field rules:
- Stmt/Id = :20:. Stmt/Acct/Id = :25: (IBAN when it is one, else Othr/Id). ElctrncSeqNb from :28C:.
- Bal OPBD from :60F:, CLBD from :62F:, CLAV from :64: (CdtDbtInd CRDT for C, DBIT for D; amount with a dot).
- One Ntry per :61:: Amt and CdtDbtInd, ValDt and BookgDt from the dates, Sts/Cd = BOOK,
  NtryDtls/TxDtls/Refs from the reference, AddtlNtryInf or RmtInf from the :86: that follows.""",

    ("camt.054", "MT900 / MT910"): """camt.054 → MT900 / MT910 field rules:
- CdtDbtInd DBIT → MT900 (confirmation of debit); CRDT → MT910 (confirmation of credit). Use block 2 type 900 or 910.
- :20: = Ntfctn/Id (16 characters), else GrpHdr/MsgId. :21: = the entry's EndToEndId, else InstrId, else NONREF.
- :25: = Ntfctn/Acct/Id. :32A: = ValDt (YYMMDD) + currency + comma amount.
- MT910 only: :50K: = the debtor name when present, or :52A: = the debtor agent BIC.""",

    ("MT900 / MT910", "camt.054"): """MT900 / MT910 → camt.054 field rules:
- Ntfctn/Id = :20:. Acct/Id = :25:. One Ntry: Amt and ValDt from :32A:, CdtDbtInd = DBIT for MT900, CRDT for MT910,
  Sts/Cd = BOOK, Refs/EndToEndId = :21:.""",

    ("camt.056", "MT192"): """camt.056 → MT192 field rules:
- :20: = Assgnmt/Id (16 characters).
- :21: = the original message's :20:, so OrgnlInstrId, else OrgnlEndToEndId (16 characters).
- :11S: = 103 on line 1, then the original's date as YYMMDD (OrgnlIntrBkSttlmDt, else Assgnmt/CreDtTm).
- :79: = /<cancellation reason code>/ then a short reason; include the original amount and currency when given.
- Block 3 {121:} = OrgnlUETR.""",

    ("MT192", "camt.056"): """MT192 → camt.056 field rules:
- Assgnmt/Id = :20:. Assgnr/Assgne agents from blocks 1 and 2.
- Undrlyg/TxInf/OrgnlInstrId = :21:. OrgnlGrpInf/OrgnlMsgNmId = pacs.008.001.08 when :11S: starts with 103.
- OrgnlIntrBkSttlmDt from the :11S: date. CxlRsnInf/Rsn/Cd from the /code/ in :79:. OrgnlUETR = {121:}.""",

    ("pacs.002", "MT199"): """pacs.002 → MT199 field rules:
- :20: = GrpHdr/MsgId (16 characters). :21: = OrgnlInstrId, else OrgnlEndToEndId.
- :79: = plain-English status: the TxSts (ACSC, ACCP, RJCT, PDNG...), the reason code and AddtlInf,
  the original references and UETR. Lines of at most 50 characters.""",

    ("pain.002", "MT199"): """pain.002 → MT199 field rules:
- :20: = GrpHdr/MsgId. :21: = OrgnlPmtInfId, else OrgnlEndToEndId.
- :79: = the group and transaction statuses with reason codes, in plain English. Lines of at most 50 characters.""",
}

GENERAL = """General rules for every pair:
- Dates: ISO YYYY-MM-DD ↔ MT YYMMDD. Amounts: dot ↔ comma; never change the value or the number of decimals
  beyond what the currency allows.
- MT text lines are at most 35 characters (50 in :79:). Cut long names and remittance text; never drop them silently.
- BICs keep their branch: an 11-character BIC stays 11 characters, an 8-character BIC stays 8 (or XXX in headers)."""


def rules_for(src: str | None, tgt: str) -> str:
    parts = []
    pair = RULES.get((src or "", tgt))
    if pair:
        parts.append(pair)
    else:
        parts.append(f"There are no fixed rules for {src or 'this message'} → {tgt}: it is a rebuild. Map each value to the "
                     f"{tgt} field with the same business meaning, and explain the change in meaning in \"notes\".")
    if tgt.startswith("MT"):
        parts.append(MT_HEADERS)
    parts.append(GENERAL)
    return "\n\n".join(parts)


# ── rule checks ──────────────────────────────────────────────────────────────
def _mx_first(xml: str, *names: str) -> str:
    root, _ = checks._parse_xml(xml)
    if root is None:
        return ""
    for name in names:
        for el in root.iter():
            if isinstance(el.tag, str) and checks.local(el.tag) == name and (el.text or "").strip():
                return el.text.strip()
    return ""


def _mt_field(text: str, tag: str) -> str:
    for t, v in checks.mt_fields(text):
        if t == tag:
            return v.split("\n")[0].strip()
    return ""


def _f(rule, where, value, msg):
    return {"severity": "error", "rule": rule, "where": where, "value": value, "message": msg}


def header_findings(mt: str) -> list[dict]:
    """Block 1 and 2 addresses must be well formed."""
    out = []
    b1 = re.search(r"\{1:([^}]*)\}", mt or "")
    if b1 and not re.fullmatch(r"F01[A-Z]{6}[A-Z0-9]{2}[A-Z][A-Z0-9]{3}\d{10}", b1.group(1)):
        out.append(_f("Block 1", "{1:}", b1.group(1), "Block 1 must be F01 + a 12-character LT address (BIC8 + terminal letter + branch) + 10 digits."))
    b2 = re.search(r"\{2:([^}]*)\}", mt or "")
    if b2 and not re.fullmatch(r"I\d{3}[A-Z]{6}[A-Z0-9]{2}[A-Z][A-Z0-9]{3}[NUS]?(\d{1,3})?", b2.group(1)):
        out.append(_f("Block 2", "{2:}", b2.group(1), "Block 2 must be I + the MT number + a 12-character receiver address (BIC8 + X + branch) + priority."))
    return out


def pair_findings(src_type: str | None, tgt_type: str, source: str, output: str) -> list[dict]:
    """Checks for the rules that matter most. Each finding is an error."""
    out: list[dict] = []
    if tgt_type.startswith("MT"):
        out += header_findings(output)
    uetr = ""
    if src_type and checks.FORMATS.get(src_type, {}).get("std") == "MX":
        uetr = _mx_first(source, "UETR", "OrgnlUETR").lower()
    elif src_type:
        m = re.search(r"\{121:([0-9a-fA-F-]{36})\}", source or "")
        uetr = m.group(1).lower() if m else ""

    if (src_type, tgt_type) == ("pacs.008", "MT103"):
        instr = _mx_first(source, "InstrId")
        want = (instr or _mx_first(source, "EndToEndId"))[:16]
        got = _mt_field(output, "20")
        if want and got != want:
            out.append(_f("Field 20", ":20:", got, f":20: must be the InstrId cut to 16 characters ({want})."))
        e2e = _mx_first(source, "EndToEndId")
        f70 = next((v for t, v in checks.mt_fields(output) if t == "70"), "")
        if instr and e2e and e2e != "NOTPROVIDED" and f"/ROC/{e2e}"[:35] not in f70.replace("\n", ""):
            out.append(_f("Field 70", ":70:", f70.split("\n")[0] if f70 else "", f"The EndToEndId must be carried in :70: as /ROC/{e2e}."))
        dbtr_agt = _mx_first(_only(source, "DbtrAgt"), "BICFI")
        if dbtr_agt and _mt_field(output, "52A") != dbtr_agt:
            out.append(_f("Field 52A", ":52A:", _mt_field(output, "52A"), f":52A: must be the debtor agent BIC ({dbtr_agt})."))
    if (src_type, tgt_type) == ("MT103", "pacs.008"):
        f20 = _mt_field(source, "20")
        if f20 and _mx_first(output, "InstrId") != f20:
            out.append(_f("InstrId", "PmtId/InstrId", _mx_first(output, "InstrId"), f"InstrId must be the MT103 :20: ({f20})."))
    if uetr and checks.FORMATS.get(tgt_type, {}).get("std") == "MX":
        got = _mx_first(output, "UETR", "OrgnlUETR").lower()
        if got != uetr:
            out.append(_f("UETR", "UETR", got, f"The UETR must be carried over exactly ({uetr})."))
    elif uetr and tgt_type.startswith("MT"):
        m = re.search(r"\{121:([0-9a-fA-F-]{36})\}", output or "")
        if not m or m.group(1).lower() != uetr:
            out.append(_f("UETR", "{121:}", m.group(1) if m else "", f"Block 3 must carry the UETR exactly: {{121:{uetr}}}."))
    return out


def _only(xml: str, parent: str) -> str:
    """The XML of the first <parent> element, for scoped lookups."""
    root, _ = checks._parse_xml(xml)
    if root is None:
        return ""
    for el in root.iter():
        if isinstance(el.tag, str) and checks.local(el.tag) == parent:
            return etree.tostring(el, encoding="unicode")
    return ""
