---
title: "Status Reports: pain.002 & pacs.002, the Answer to Every Payment"
level: 300
category: Message Deep Dives
num: 310
summary: "Every payment message has a reply you rarely think about: the status report. pain.002 answers the customer, pacs.002 answers the bank. Learn the status vocabulary once — ACSP, ACSC, RJCT and the rest — and every 'what happened to my payment?' becomes a field you can read."
minutes: 9
updated: 2026-07-13
tags: [pacs.002, pain.002, status report, ACSP, ACSC, RJCT, gpi, confirmation]
related: [302-pain-001, 301-pacs-008, 401-reject, 408-reason-codes, 309-the-four-identifiers]
earnedSkill: "Read a pain.002 and a pacs.002, tell group-level from transaction-level status, name the common status codes and what each means for the money, follow the Orgnl* references back to the payment, and explain how status confirmations feed gpi tracking."
status: published
---

> **The problem first.** Bob's pain.001 has left his phone. His company's payroll file — four hundred transactions — has left the treasury system. In both cases the sender is now staring at a screen asking one question: *did it work?* Not "did the money arrive" yet — earlier than that. Was it even accepted? Is it moving? Did one of the four hundred fail while the rest went through?

You've met these messages in passing — the pain.002 that ticked Bob's app, the pacs.002 that carried a reject between banks. They finally get their own deep dive, because the status report is the acknowledgement layer of the whole standard. And you can reason out its shape from what the sender needs.

## What must come back — especially for a batch?

{{think}}
Fire-and-forget is fine for a tweet. For money, every instruction needs an answer. A single payment is easy: yes or no. But the payroll file has four hundred transactions in it, and three of them might fail while 397 sail through.

What must come back, and what's the hard part once it's a batch?
{{reveal}}
An acknowledgement message carrying a **status** — **pain.002** back to the customer, **pacs.002** back to the sending bank. Same idea, two audiences.

The hard part with a batch: a single headline status can't tell the truth. "Some passed, some failed" needs *two* levels — one status for the whole file, and one status *per transaction* — or you can't say *which* three of the four hundred failed. That two-level shape is the thing people miss.
{{/think}}

## Two reports, same job, different leg

One status-report *idea*, two messages, split by which conversation they answer. **pain.002 — Customer Payment Status Report** is the bank-to-customer answer to a pain.001: the tick, the spinner, or the red cross Bob sees. **pacs.002 — FI-to-FI Payment Status Report** is the bank-to-bank answer to a pacs.008 (or pacs.009/pacs.003), travelling up and down the interbank chain. Same skeleton, same vocabulary — learn one, read both.

## The status vocabulary — a timeline, not yes/no

A status report's whole meaning is one coded field, drawn from an external code set the industry shares. The ones you'll meet:

- **`RCVD`** — Received. Arrived, nothing checked yet.
- **`ACTC`** — Accepted Technical Validation. Structure valid: schema passed, mandatory fields present.
- **`ACCP`** — Accepted Customer Profile. Technical *and* customer-profile checks passed (a pain.002 favourite).
- **`ACSP`** — Accepted, Settlement In Process. Good, and settlement is underway. The workhorse "it's moving."
- **`ACWP`** — Accepted Without Posting. Accepted, but not yet credited to the creditor — common cross-border, a later leg still to complete.
- **`ACSC`** — Accepted, Settlement Completed. Settlement on the debtor side done.
- **`ACCC`** — Accepted, Settlement Completed, Creditor Account Credited. The strongest yes: the money is in the beneficiary's account.
- **`ACWC`** — Accepted With Change. Accepted, but the bank altered something (a corrected date, a repaired field).
- **`PDNG`** — Pending. Accepted but waiting — a cut-off, a check, a business hour.
- **`PART`** — Partially Accepted. Crucial for batches: some accepted, some rejected; the report tells you which.
- **`RJCT`** — Rejected. Refused, with a reason code.

These aren't yes/no — they're a **timeline**: RCVD → ACTC → ACCP → ACSP → ACSC/ACCC, with RJCT possible at any step and PDNG/ACWP as holding states. A status report is a snapshot of *where on that timeline* the payment sits.

## The batch trap, up close

{{think}}
Your payroll status report comes back with a group status of **`PART`**. Someone glances at it, sees "partially accepted," and moves on. What must you actually do — and what happens if you don't?
{{reveal}}
`PART` means *don't trust the headline* — drop to the per-transaction statuses. 397 went through; 3 didn't; only the transaction level (`TxSts`, one per payment, keyed by the original references) tells you which 3.

A processor that reads only the group status and ignores `PART` will silently drop three real payments and report success. That's not a hypothetical — it's a genuine operational incident. Always read to the transaction level when the group status isn't a clean accept.
{{/think}}

So a report speaks at two levels: **group** (`GrpSts`, in `OrgnlGrpInfAndSts`) — one status for the whole original message ("all 400 accepted," or "entire file rejected" if the control sum failed) — and **transaction** (`TxSts`, in each `TxInfAndSts`) — one status per payment.

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

The `Orgnl*` references — `OrgnlMsgId`, `OrgnlEndToEndId`, `OrgnlUETR` — are how a status report *finds its way home*. It doesn't repeat the payment; it *points* at it, using the same identifiers from {{link:article:309-the-four-identifiers|the four-identifiers chapter}}. And `OrgnlMsgNmId` names the exact message and version being reported on. When the status is `RJCT`, a `StsRsnInf` block appears carrying the reason code — the {{link:article:401-reject|reject chapter}}'s territory.

## Why status reports matter more than they used to: gpi

For years a sender knew a payment left and hoped it landed; the blind spot in the middle is what **Swift gpi** set out to close, and status confirmations are the fuel. Under gpi's universal confirmations, banks confirm when they credit the beneficiary — the same "settlement completed, creditor credited" meaning as an `ACCC`/`ACSC` — and those feed the **gpi Tracker**, so a payment's `UETR` shows a live, end-to-end status the whole chain can see. The humble receipt became a network-wide tracking signal, and it's the thread the new {{link:article:409-new-investigations|investigations model}} pulls on when a payment goes quiet.

{{aside:model|The mental model}}
**A status report is a snapshot of where a payment sits on the RCVD → ACTC → ACCP → ACSP → ACSC/ACCC timeline** — not a yes/no. pain.002 answers the customer, pacs.002 answers the bank. And it never repeats the payment; the `Orgnl*` references point back to it.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Three codes people conflate, at real cost: **ACSP** = in process (moving, not arrived); **ACWP** = accepted but *not yet posted* to the creditor; **ACSC/ACCC** = actually credited. Mark a payment "complete" at ACSP and your customer is still waiting. And on a batch, branch on `GrpSts` first, but when it's `PART`, iterate `TxSts` — never report the group status as the whole truth.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Reading only the group status on a batch.** A `PART` headline hides individual failures — always drop to `TxSts`.
- **Treating ACSP as "done."** ACSP is in-process; ACWP is accepted-not-posted; only ACSC/ACCC is credited.
- **Losing the `Orgnl*` thread.** A mangled `OrgnlEndToEndId`/`OrgnlUETR` can't be auto-matched to its payment, so a machine hands it to a human.
- **Assuming one code list fits every rail.** The set is external and extensible; a scheme may restrict which codes are valid. Standard plus rulebook, as ever.
{{/aside}}

{{aside:map|The map}}
The acknowledgement layer and its neighbours:

- The message being answered → {{link:article:301-pacs-008|pacs.008}}.
- The references it points back with → {{link:article:309-the-four-identifiers|the four identifiers}}.
- The most important status, up close → {{link:article:401-reject|reject (RJCT)}}.
{{/aside}}

{{aside:ref|Reference card}}
- **pain.002** answers the customer; **pacs.002** answers the bank. Same vocabulary.
- **Timeline:** RCVD → ACTC → ACCP → ACSP → ACSC → ACCC; RJCT any time; PDNG/ACWP hold.
- **ACSP ≠ ACWP ≠ ACSC/ACCC:** in-process vs not-posted vs credited.
- **Two levels:** `GrpSts` (whole file) + `TxSts` (per payment). `PART` → read the transaction level.
- **Ties home** via `OrgnlMsgId` / `OrgnlEndToEndId` / `OrgnlUETR`; feeds gpi tracking.
{{/aside}}

{{embed:explorer:PACS.002|Open pacs.002, the status report, in the Message Explorer}}
{{embed:article:401-reject|The most important status of all, up close: Reject (RJCT)}}

{{check:A payroll status report shows a group status of PART. What must you do?|Read the per-transaction (TxSts) statuses — some payments were accepted and some rejected|Treat the whole file as rejected|Treat the whole file as accepted}}
{{check:A payment's status is ACSP. Is the money in the beneficiary's account?|Not necessarily — ACSP means settlement is in process; ACSC/ACCC is when it's actually credited|Yes, ACSP means credited|No, ACSP means rejected}}
{{check:How does a status report tie itself back to the payment it's about?|Through the Orgnl* references (OrgnlMsgId, OrgnlEndToEndId, OrgnlUETR)|By repeating the entire original message|By arriving on the same day}}
