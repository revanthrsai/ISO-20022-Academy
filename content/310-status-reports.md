---
title: "Status Reports: pain.002 & pacs.002, the Answer to Every Payment"
level: 300
category: Message Deep Dives
num: 310
summary: "Every payment message has a reply you rarely think about: the status report. pain.002 answers the customer, pacs.002 answers the bank. Learn the status vocabulary once — ACSP, ACSC, RJCT and the rest — and every 'what happened to my payment?' becomes a field you can read."
minutes: 9
updated: 2026-07-06
tags: [pacs.002, pain.002, status report, ACSP, ACSC, RJCT, gpi, confirmation]
related: [302-pain-001, 301-pacs-008, 401-reject, 408-reason-codes, 309-the-four-identifiers]
earnedSkill: "Read a pain.002 and a pacs.002, tell group-level status from transaction-level status, name the common status codes (RCVD, ACTC, ACCP, ACSP, ACSC, ACWP, PDNG, RJCT, PART) and what each one means for the money, follow the Orgnl* references back to the payment being reported on, and explain how status confirmations feed gpi tracking."
status: published
---

> **The problem first.** Bob's pain.001 has left his phone. His company's payroll file — four hundred transactions — has left the treasury system. In both cases the sender is now staring at a screen asking one question: *did it work?* Not "did the money arrive" yet — earlier than that. Was it even accepted? Is it moving? Did one of the four hundred fail while the rest went through? Fire-and-forget is fine for a tweet. For money, every instruction needs an answer. What message carries that answer, and how does it say "yes," "no," and the surprisingly large space in between?

You have met these messages in passing — the pain.002 that put a tick in Bob's app, the pacs.002 that carried a reject between banks. This chapter finally gives them their own deep-dive, because the **status report is the acknowledgement layer of the entire standard**, and reading one fluently is the difference between "the payment vanished" and "the payment is sitting at ACWP because the creditor bank hasn't posted it yet."

## Two reports, same job, different leg

There is one status-report *idea* and two messages that carry it, split by which conversation they answer:

- **pain.002 — Customer Payment Status Report.** The bank-to-customer answer. It replies to a **pain.001**: *"I received your instruction, here's what happened to it."* This is the tick, the pending spinner, or the red cross Bob sees.
- **pacs.002 — FI-to-FI Payment Status Report.** The bank-to-bank answer. It replies to a **pacs.008** (or pacs.009, pacs.003): *"I received your interbank payment, here's its status."* This travels between institutions, up and down the chain.

Same skeleton, same status vocabulary. The only real difference is who's talking to whom. Learn one and you can read both.

## The status vocabulary (the part worth memorising)

A status report's whole meaning lives in one coded field. The reject chapter showed you `RJCT`; that's one word in a much richer vocabulary drawn from an **external code set** the industry shares. The ones you'll actually meet:

- **`RCVD`** — Received. The message arrived; nothing checked yet.
- **`ACTC`** — Accepted Technical Validation. The structure is valid: schema passed, mandatory fields present.
- **`ACCP`** — Accepted Customer Profile. Technical checks *and* customer-profile checks passed (a pain.002 favourite).
- **`ACSP`** — Accepted, Settlement In Process. The instruction is good and settlement is underway. The workhorse "it's moving" status.
- **`ACWP`** — Accepted Without Posting. Accepted, but not yet credited to the creditor's account — common cross-border, where a later leg still has to complete.
- **`ACSC`** — Accepted, Settlement Completed. Settlement on the debtor side is done.
- **`ACCC`** — Accepted, Settlement Completed, **Creditor Account Credited**. The strongest "yes": the money is in the beneficiary's account. This is the one everyone actually wants.
- **`ACWC`** — Accepted With Change. Accepted, but the bank altered something (a corrected date, a repaired field).
- **`PDNG`** — Pending. Accepted but waiting — a cut-off, a check, a business hour.
- **`PART`** — Partially Accepted. **Crucial for batches:** some transactions in the file were accepted, some rejected. The report then tells you *which*.
- **`RJCT`** — Rejected. Refused; carries a reason code (see the reject and reason-code chapters).

Notice these aren't just "yes/no." They are a **timeline**: RCVD → ACTC → ACCP → ACSP → ACSC/ACCC, with RJCT possible at any step and PDNG/ACWP as holding states. A status report is a snapshot of *where on that timeline* your payment currently sits.

## Group status vs transaction status (the batch trap)

Here is the nuance that separates people who've read the spec from people who've run a payroll. A status report can report at **two levels**:

- **Group level (`GrpSts`, inside `OrgnlGrpInfAndSts`)** — one status for the *whole original message*. "All four hundred accepted" (ACSP) or "the entire file rejected" (RJCT, e.g. the control sum didn't match).
- **Transaction level (`TxSts`, inside each `TxInfAndSts`)** — one status *per payment*, keyed by its original references.

The trap is a **`PART`** at group level. It means: don't trust a single headline status — go read the per-transaction statuses, because 397 went through and 3 didn't, and only the transaction level tells you which three. A processor that reads only the group status and ignores `PART` will silently drop failed payments. This is a real operational incident, not a hypothetical.

## Reading one, field by field

A pacs.002 reporting a healthy, credited payment:

```xml
<FIToFIPmtStsRpt>
  <GrpHdr>
    <MsgId>HDFCINBB-STS-0091</MsgId>
    <CreDtTm>2026-07-01T09:32:10+05:30</CreDtTm>
  </GrpHdr>
  <OrgnlGrpInfAndSts>
    <OrgnlMsgId>BNKAUS33-20260701-000400</OrgnlMsgId>   <!-- which message this answers -->
    <OrgnlMsgNmId>pacs.008.001.08</OrgnlMsgNmId>          <!-- and which type/version -->
    <GrpSts>ACSC</GrpSts>                                 <!-- headline status -->
  </OrgnlGrpInfAndSts>
  <TxInfAndSts>
    <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>        <!-- ties back to the payment -->
    <OrgnlUETR>eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4</OrgnlUETR>
    <TxSts>ACCC</TxSts>                                   <!-- credited to Sweety -->
  </TxInfAndSts>
</FIToFIPmtStsRpt>
```

Two things to see. First, the `Orgnl*` references — `OrgnlMsgId`, `OrgnlEndToEndId`, `OrgnlUETR` — are how a status report **finds its way home**. It doesn't repeat the payment; it *points* at it, using the same identifiers from the [four-identifiers chapter](#/library). Second, `OrgnlMsgNmId` names the exact message and version being reported on — which is why the version awareness from the ISO 20022 chapter matters even here.

When the status is `RJCT`, one more block appears — the `StsRsnInf` carrying a reason code — which is exactly the reject chapter's territory.

## Why status reports matter more than they used to: gpi

For years, a sender knew a payment left and hoped it landed. The blind spot in the middle — is it stuck at a correspondent? was it credited? — is what **Swift gpi** set out to close, and status confirmations are the fuel. Under gpi's **universal confirmations**, banks confirm when they credit the beneficiary, and those confirmations — the same "settlement completed, creditor credited" meaning as an `ACCC`/`ACSC` — feed the **gpi Tracker** so the payment's `UETR` shows a live, end-to-end status the whole chain can see.

In other words, the humble status report stopped being a private receipt between two parties and became a **network-wide tracking signal**. "Where is my payment?" is answerable today largely because every hop now reports its status against a shared UETR. That is also the thread the new [investigations model](#/library) pulls on when a payment goes quiet.

## What breaks

- **Reading only the group status on a batch.** A `PART` headline hides individual failures. Always drop to `TxSts` when the group status isn't a clean accept.
- **Treating ACSP as "done."** ACSP means *in process*, not *arrived*. ACWP means accepted but **not yet posted**. The money isn't the beneficiary's until ACSC/ACCC. Confusing these is how a payment gets marked complete while the customer is still waiting.
- **Losing the Orgnl\* thread.** A status report with a mangled or missing `OrgnlEndToEndId`/`OrgnlUETR` can't be automatically matched to its payment, so a machine hands it to a human. The whole value of the message is the reference that ties it home.
- **Assuming one status code list fits every rail.** The set is external and extensible; a scheme or usage guideline may restrict which codes are valid. As ever: standard plus rulebook.

## So, what can you now do?

You can read a **pain.002** and a **pacs.002** and say which conversation each answers; place a payment on the RCVD → ACTC → ACCP → ACSP → ACSC/ACCC timeline; tell a **group** status from a **transaction** status and know why a `PART` forces you down to the transaction level; follow the `Orgnl*` references back to the exact payment being reported on; distinguish "accepted and moving" (ACSP) from "accepted but not posted" (ACWP) from "credited" (ACCC); and explain how these status confirmations became the signal that powers gpi tracking.

{{embed:explorer:PACS.002|Open pacs.002, the status report, in the Message Explorer}}
{{embed:article:401-reject|The most important status of all, up close: Reject (RJCT)}}

{{check:A payroll status report shows a group status of PART. What must you do?|Read the per-transaction (TxSts) statuses — some payments were accepted and some rejected|Treat the whole file as rejected|Treat the whole file as accepted}}
{{check:A payment's status is ACSP. Is the money in the beneficiary's account?|Not necessarily — ACSP means settlement is in process; ACSC/ACCC is when it's actually credited|Yes, ACSP means credited|No, ACSP means rejected}}
{{check:How does a status report tie itself back to the payment it's about?|Through the Orgnl* references (OrgnlMsgId, OrgnlEndToEndId, OrgnlUETR)|By repeating the entire original message|By arriving on the same day}}
