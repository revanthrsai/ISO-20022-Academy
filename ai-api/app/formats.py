"""
The message formats the Translator offers, with just enough of each format's
shape for the agent to anchor on: which version to write, the root element,
the fields that must be there, and the field each money-critical value lives in.

Versions follow the CBPR+ / HVPS+ usage in force for cross-border payments.
This is guidance for the model, not a schema: real validation happens in
checks.validate(), and against the official XSDs when they are in /schemas.
"""

FORMATS = {
    # ── ISO 20022 (MX) ──────────────────────────────────────────────────────
    "pacs.008": {
        "std": "MX", "name": "FI-to-FI customer credit transfer", "equivalent": "MT103",
        "version": "pacs.008.001.08", "root": "FIToFICstmrCdtTrf",
        "role": "a bank-to-bank customer credit transfer",
        "key_fields": [
            "GrpHdr/MsgId", "GrpHdr/CreDtTm", "GrpHdr/NbOfTxs", "GrpHdr/SttlmInf/SttlmMtd (INDA|INGA|CLRG|COVE)",
            "CdtTrfTxInf/PmtId/InstrId", "CdtTrfTxInf/PmtId/EndToEndId", "CdtTrfTxInf/PmtId/UETR",
            "CdtTrfTxInf/IntrBkSttlmAmt@Ccy", "CdtTrfTxInf/IntrBkSttlmDt", "CdtTrfTxInf/ChrgBr (DEBT|CRED|SHAR)",
            "CdtTrfTxInf/Dbtr/Nm", "CdtTrfTxInf/DbtrAcct/Id/IBAN or Othr/Id", "CdtTrfTxInf/DbtrAgt/FinInstnId/BICFI",
            "CdtTrfTxInf/CdtrAgt/FinInstnId/BICFI", "CdtTrfTxInf/Cdtr/Nm", "CdtTrfTxInf/CdtrAcct/Id/IBAN or Othr/Id",
            "CdtTrfTxInf/RmtInf/Ustrd (optional)",
        ],
    },
    "pacs.004": {
        "std": "MX", "name": "Payment return", "equivalent": "MT103 RETN",
        "version": "pacs.004.001.09", "root": "PmtRtr",
        "role": "a payment return",
        "key_fields": ["GrpHdr/MsgId", "GrpHdr/CreDtTm", "GrpHdr/NbOfTxs", "GrpHdr/SttlmInf/SttlmMtd",
                       "TxInf/RtrId", "TxInf/OrgnlGrpInf/OrgnlMsgId", "TxInf/OrgnlGrpInf/OrgnlMsgNmId",
                       "TxInf/OrgnlEndToEndId", "TxInf/OrgnlUETR", "TxInf/RtrdIntrBkSttlmAmt@Ccy", "TxInf/IntrBkSttlmDt",
                       "TxInf/RtrRsnInf/Rsn/Cd (e.g. AC04, AC06, AM05)"],
    },
    "pacs.002": {
        "std": "MX", "name": "FI-to-FI payment status report", "equivalent": "MT199",
        "version": "pacs.002.001.10", "root": "FIToFIPmtStsRpt",
        "role": "a bank-to-bank status report",
        "key_fields": ["GrpHdr/MsgId", "GrpHdr/CreDtTm", "OrgnlGrpInfAndSts/OrgnlMsgId", "OrgnlGrpInfAndSts/OrgnlMsgNmId",
                       "TxInfAndSts/OrgnlEndToEndId", "TxInfAndSts/OrgnlUETR", "TxInfAndSts/TxSts (ACCP|ACSC|RJCT|PDNG...)",
                       "TxInfAndSts/StsRsnInf/Rsn/Cd (when RJCT)"],
    },
    "pain.001": {
        "std": "MX", "name": "Customer credit transfer initiation", "equivalent": "MT101",
        "version": "pain.001.001.09", "root": "CstmrCdtTrfInitn",
        "role": "a customer-to-bank payment instruction",
        "key_fields": ["GrpHdr/MsgId", "GrpHdr/CreDtTm", "GrpHdr/NbOfTxs", "GrpHdr/CtrlSum", "GrpHdr/InitgPty/Nm",
                       "PmtInf/PmtInfId", "PmtInf/PmtMtd (TRF)", "PmtInf/ReqdExctnDt/Dt", "PmtInf/Dbtr/Nm",
                       "PmtInf/DbtrAcct/Id/IBAN", "PmtInf/DbtrAgt/FinInstnId/BICFI",
                       "PmtInf/CdtTrfTxInf/PmtId/EndToEndId", "PmtInf/CdtTrfTxInf/Amt/InstdAmt@Ccy",
                       "PmtInf/CdtTrfTxInf/CdtrAgt/FinInstnId/BICFI", "PmtInf/CdtTrfTxInf/Cdtr/Nm",
                       "PmtInf/CdtTrfTxInf/CdtrAcct/Id/IBAN", "PmtInf/CdtTrfTxInf/RmtInf/Ustrd"],
    },
    "pain.002": {
        "std": "MX", "name": "Customer payment status report", "equivalent": "MT199",
        "version": "pain.002.001.10", "root": "CstmrPmtStsRpt",
        "role": "a bank-to-customer status report",
        "key_fields": ["GrpHdr/MsgId", "GrpHdr/CreDtTm", "OrgnlGrpInfAndSts/OrgnlMsgId", "OrgnlGrpInfAndSts/OrgnlMsgNmId",
                       "OrgnlPmtInfAndSts/OrgnlPmtInfId", "OrgnlPmtInfAndSts/TxInfAndSts/OrgnlEndToEndId",
                       "OrgnlPmtInfAndSts/TxInfAndSts/TxSts", "OrgnlPmtInfAndSts/TxInfAndSts/StsRsnInf/Rsn/Cd"],
    },
    "pain.008": {
        "std": "MX", "name": "Customer direct debit initiation", "equivalent": "MT104",
        "version": "pain.008.001.08", "root": "CstmrDrctDbtInitn",
        "role": "a customer direct debit instruction",
        "key_fields": ["GrpHdr/MsgId", "GrpHdr/CreDtTm", "GrpHdr/NbOfTxs", "GrpHdr/CtrlSum", "GrpHdr/InitgPty/Nm",
                       "PmtInf/PmtInfId", "PmtInf/PmtMtd (DD)", "PmtInf/ReqdColltnDt", "PmtInf/Cdtr/Nm",
                       "PmtInf/CdtrAcct/Id/IBAN", "PmtInf/CdtrAgt/FinInstnId/BICFI",
                       "PmtInf/DrctDbtTxInf/PmtId/EndToEndId", "PmtInf/DrctDbtTxInf/InstdAmt@Ccy",
                       "PmtInf/DrctDbtTxInf/DrctDbtTx/MndtRltdInf/MndtId", "PmtInf/DrctDbtTxInf/DbtrAgt/FinInstnId/BICFI",
                       "PmtInf/DrctDbtTxInf/Dbtr/Nm", "PmtInf/DrctDbtTxInf/DbtrAcct/Id/IBAN"],
    },
    "camt.053": {
        "std": "MX", "name": "Bank-to-customer statement", "equivalent": "MT940",
        "version": "camt.053.001.08", "root": "BkToCstmrStmt",
        "role": "an end-of-day account statement",
        "key_fields": ["GrpHdr/MsgId", "GrpHdr/CreDtTm", "Stmt/Id", "Stmt/ElctrncSeqNb", "Stmt/Acct/Id/IBAN",
                       "Stmt/Bal (Tp/CdOrPrtry/Cd OPBD and CLBD, Amt@Ccy, CdtDbtInd, Dt/Dt)",
                       "Stmt/Ntry (Amt@Ccy, CdtDbtInd, Sts/Cd BOOK, BookgDt/Dt, ValDt/Dt, BkTxCd, NtryDtls/TxDtls/Refs)"],
    },
    "camt.054": {
        "std": "MX", "name": "Debit / credit notification", "equivalent": "MT900 / MT910",
        "version": "camt.054.001.08", "root": "BkToCstmrDbtCdtNtfctn",
        "role": "a debit or credit notification",
        "key_fields": ["GrpHdr/MsgId", "GrpHdr/CreDtTm", "Ntfctn/Id", "Ntfctn/Acct/Id/IBAN",
                       "Ntfctn/Ntry (Amt@Ccy, CdtDbtInd, Sts/Cd, BookgDt/Dt, ValDt/Dt, NtryDtls/TxDtls/Refs)"],
    },
    "camt.056": {
        "std": "MX", "name": "Payment cancellation request", "equivalent": "MT192",
        "version": "camt.056.001.08", "root": "FIToFIPmtCxlReq",
        "role": "a cancellation request",
        "key_fields": ["Assgnmt/Id", "Assgnmt/Assgnr/Agt/FinInstnId/BICFI", "Assgnmt/Assgne/Agt/FinInstnId/BICFI",
                       "Assgnmt/CreDtTm", "Undrlyg/TxInf/OrgnlGrpInf/OrgnlMsgId", "Undrlyg/TxInf/OrgnlGrpInf/OrgnlMsgNmId",
                       "Undrlyg/TxInf/OrgnlEndToEndId", "Undrlyg/TxInf/OrgnlUETR", "Undrlyg/TxInf/OrgnlIntrBkSttlmAmt@Ccy",
                       "Undrlyg/TxInf/OrgnlIntrBkSttlmDt", "Undrlyg/TxInf/CxlRsnInf/Rsn/Cd (DUPL, FRAD, TECH, CUST...)"],
    },
    # ── SWIFT MT ────────────────────────────────────────────────────────────
    "MT103": {"std": "MT", "name": "Single customer credit transfer", "equivalent": "pacs.008",
              "role": "a bank-to-bank customer credit transfer",
              "key_fields": [":20: sender's reference (16x)", ":23B: CRED", ":32A: YYMMDD + CCY + amount (comma decimal)",
                             ":33B: instructed currency/amount (optional)", ":50K: /account + name/address (or 50A/50F)",
                             ":52A: ordering institution BIC", ":57A: account-with institution BIC",
                             ":59: /account + beneficiary name/address (or 59A/59F)", ":70: remittance info (4x35)",
                             ":71A: OUR|BEN|SHA", "block 3 {121:UETR}"]},
    "MT103 RETN": {"std": "MT", "name": "Customer transfer used as a return", "equivalent": "pacs.004",
                   "role": "an MT103 used to return a payment",
                   "key_fields": ["as MT103", ":72:/RETN/ + field reference + /reason code/ + /MREF/original reference"]},
    "MT101": {"std": "MT", "name": "Request for transfer", "equivalent": "pain.001",
              "role": "a customer-to-bank request for transfer",
              "key_fields": ["Seq A: :20: :28D:1/1 :50H: or :50C: ordering customer :30: requested execution date (YYMMDD)",
                             "Seq B per transaction: :21: :32B: CCY+amount :57A: :59: :70: :71A:"]},
    "MT104": {"std": "MT", "name": "Direct debit and request for debit transfer", "equivalent": "pain.008",
              "role": "a direct debit instruction",
              "key_fields": ["Seq A: :20: :30: requested execution date", "Seq B: :21: :32B: :50K: debtor :52A: :59: creditor",
                             "Seq C: :32B: total (and :19: sum when several)"]},
    "MT940": {"std": "MT", "name": "Customer statement", "equivalent": "camt.053",
              "role": "an end-of-day account statement",
              "key_fields": [":20:", ":25: account", ":28C: statement/sequence number", ":60F: opening balance C|D YYMMDD CCY amount",
                             ":61: statement lines", ":86: information to account owner", ":62F: closing balance", ":64: available balance"]},
    "MT900 / MT910": {"std": "MT", "name": "Confirmation of debit / credit", "equivalent": "camt.054",
                      "role": "a debit or credit confirmation",
                      "key_fields": [":20:", ":21: related reference", ":25: account", ":32A: value date, currency, amount",
                                     "MT910 also :50a: ordering customer or :52a: ordering institution"]},
    "MT192": {"std": "MT", "name": "Request for cancellation", "equivalent": "camt.056",
              "role": "a cancellation request",
              "key_fields": [":20:", ":21: reference of the original message", ":11S: MT number + date of the original",
                             ":79: narrative/reason (optional)"]},
    "MT199": {"std": "MT", "name": "Free format message", "equivalent": None,
              "role": "a free-text message", "key_fields": [":20:", ":21: (optional)", ":79: narrative (35x50)"]},
}

# Mandatory fields per MT type for checks.validate(). "50a" means any option of 50.
MT_MANDATORY = {
    "MT103": ["20", "23B", "32A", "50a", "59|59A|59F", "71A"],
    "MT103 RETN": ["20", "23B", "32A", "50a", "59|59A|59F", "71A", "72"],
    "MT101": ["20", "28D", "30", "21", "32B", "59|59A|59F", "71A"],
    "MT104": ["20", "30", "21", "32B"],
    "MT940": ["20", "25", "28C", "60F|60M", "62F|62M"],
    "MT900 / MT910": ["20", "21", "25", "32A"],
    "MT192": ["20", "21", "11S"],
    "MT199": ["20", "79"],
}


def spec(code: str) -> dict:
    f = FORMATS.get(code)
    if not f:
        return {"known": False, "code": code,
                "note": "Not in the Translator's list. Use the standard's current published structure for this message."}
    out = {"known": True, "code": code, **f}
    if f["std"] == "MX":
        out["namespace"] = f"urn:iso:std:iso:20022:tech:xsd:{f['version']}"
        out["shape"] = f"<Document xmlns=\"{out['namespace']}\"><{f['root']}>...</{f['root']}></Document>"
    else:
        out["shape"] = "{1:F01<sender BIC12>0000000000}{2:I<type><receiver BIC12>N}{3:{121:<UETR>}}{4:\n:20:...\n-}"
    return out


def is_direct(src: str, tgt: str) -> bool:
    s = FORMATS.get(src)
    return bool(s and s.get("equivalent") == tgt)
