---
title: "camt.056: Calling a Payment Back"
level: 400
category: Exceptions
summary: "Sometimes a payment is sent in error and has to be recalled. camt.056 is the polite, structured way one bank asks another to cancel: field by field, and why it only ever asks, never takes."
minutes: 7
updated: 2026-07-13
tags: [camt.056, cancellation, recall, R-transactions]
related: [403-recall, 402-return, 405-investigations, 407-the-r-transactions-map]
earnedSkill: "Read a camt.056 field by field, name its three structural parts, pick the right cancellation reason code, trace how the camt.029 answer decides whether a pacs.004 return follows, and state the one distinction: a camt.056 requests, a pacs.004 returns."
num: 406
status: published
---

> **The problem first.** Bob's bank just sent ₹33,000 to Sweety, then realised it sent it **twice**. The duplicate settled too. The money is sitting safely in Sweety's account, where it has every right to be — nobody on her side did anything wrong. There is no "undo" button on a settled payment.

The recall chapter tells the story of the flow; this is the field-by-field read of the request itself, the first of the R-transactions. And you can reason out its shape from Bob's bank's predicament.

## What can Bob's bank actually do?

{{think}}
The duplicate has settled. The money is legitimately in Sweety's account — she's done nothing wrong and there's no button to claw it back. Bob's bank wants it returned.

Given all that, what *kind* of message can Bob's bank send, and — crucially — what can that message not do?
{{reveal}}
It can only **ask**. A structured, bank-to-bank *request to cancel* — the **camt.056** (FI to FI Payment Cancellation Request) — carrying a reason and references to the original so the receiver can find it.

What it can't do: move money, or guarantee anything. It's a question, not a transfer. Sweety's bank might say no. The one line to hold: **a camt.056 is a question, not a transfer.**
{{/think}}

## What camt.056 is, precisely

A bank-to-bank request to cancel a payment already sent (usually already settled), carrying a reason and the original references — and nothing else. Three parts, outer to inner: **Assignment (`Assgnmt`)** — who's asking whom, and when (the envelope of the *request*: assigner, assignee, request id, timestamp); **Case (`Case`)** — the case id that threads this request and its future answer into one investigation; **Underlying (`Undrlyg` → `TxInf`)** — *which* payment to cancel, by its original references and amount, plus the **cancellation reason**.

That reason is the whole point — the receiver's decision hinges on *why* you're asking, so it's structured, not free text: `DUPL` (duplicate — Bob's case), `FRAD` (fraud suspected — freeze and return), `CUST` (customer requested), `TECH` (technical error), `AGNT` (wrong agent/routing), `UPAY` (undue payment). Structured reasons let the receiver triage automatically — a `FRAD` recall routes to fraud ops instantly; a `DUPL` is often a quick "are the funds still there?" check.

```xml
<FIToFIPmtCxlReq>
  <Assgnmt>
    <Id>EBILAEAD-CXL-0042</Id>
    <Assgnr><Agt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></Agt></Assgnr>
    <Assgne><Agt><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></Agt></Assgne>
    <CreDtTm>2026-07-01T12:00:00+04:00</CreDtTm>
  </Assgnmt>
  <Case>
    <Id>CASE-EBIL-0042</Id>
    <Cretr><Agt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></Agt></Cretr>
  </Case>
  <Undrlyg>
    <TxInf>
      <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>
      <OrgnlUETR>eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4</OrgnlUETR>
      <OrgnlIntrBkSttlmAmt Ccy="INR">33000.00</OrgnlIntrBkSttlmAmt>
      <CxlRsnInf>
        <Rsn><Cd>DUPL</Cd></Rsn>
        <AddtlInf>Duplicate instruction sent in error</AddtlInf>
      </CxlRsnInf>
    </TxInf>
  </Undrlyg>
</FIToFIPmtCxlReq>
```

Read what's there and what isn't: there's an `OrgnlIntrBkSttlmAmt` (the amount being recalled) but no *new* amount to settle — nothing moves on this message. The `OrgnlEndToEndId`/`OrgnlUETR` are the same references Bob's original pain.001/pacs.008 carried, so the receiver can find the exact payment among millions. The `Case` id reappears on every message in this thread.

## When does money actually move?

{{think}}
Bob's bank has sent the camt.056: *please cancel `BOB-INV0042`, reason `DUPL`.* Trace it forward: at what exact point, if any, does the ₹33,000 actually travel back — and what messages carry each step?
{{reveal}}
The camt.056 opens a two-message conversation. Sweety's bank investigates (is the money still there? will the customer consent?) and replies with a **camt.029 (Resolution of Investigation)**, quoting the same `Case`:

- **Accepted** → it agrees, then performs an actual **pacs.004 Payment Return** to physically send ₹33,000 back. *Only now does money move.*
- **Rejected** → a camt.029 declining, with a reason (funds withdrawn, no consent). Bob's bank gets **nothing** back and must escalate.

So: the camt.056 *asks*, the camt.029 *answers*, and a pacs.004 does the actual returning — but only if the answer was yes.
{{/think}}

{{aside:model|The mental model}}
**camt.056 requests; pacs.004 returns.** The cancellation request moves no money and can be refused. Money moves only when the request is *granted* — a camt.029 acceptance, followed by a pacs.004. A refused recall produces a camt.029 and no pacs.004; the money stays put.
{{/aside}}

{{aside:chair|From the engineer's chair}}
The `Case` id is the thread — every message in the recall (camt.056 → camt.029 → any pacs.004) quotes it, so you correlate the conversation on `Case` and the underlying payment on `OrgnlEndToEndId`/`OrgnlUETR`. Route on the `CxlRsnInf` code: `FRAD` straight to fraud ops, `DUPL` to a funds-still-there check. And never read `OrgnlIntrBkSttlmAmt` as something to settle — it identifies the payment, it doesn't instruct a transfer.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Expecting camt.056 to move money.** It's a request; only a granted one (→ pacs.004) returns funds.
- **Omitting or mis-picking the reason code.** The receiver triages on `CxlRsnInf`; a wrong or missing code slows or misroutes the whole recall.
- **Losing the `Case` or `Orgnl*` references.** Break the thread and the answer can't be tied to the request, or the request to the payment.
- **Assuming yes.** A recall can be refused — design the "no" path (escalation), not just the happy one.
{{/aside}}

{{aside:map|The map}}
The request that starts a recall:

- The story of the flow → {{link:article:403-recall|recall}}.
- The message that actually returns the funds → {{link:article:402-return|return (pacs.004)}}.
- Where recalls escalate when refused → {{link:article:405-investigations|investigations}}.
{{/aside}}

{{aside:ref|Reference card}}
- **camt.056** = FI-to-FI cancellation *request*. A question, not a transfer — moves no money.
- **Three parts:** `Assgnmt` (who asks whom) · `Case` (the thread id) · `Undrlyg` (which payment + reason).
- **Reason codes:** `DUPL`, `FRAD`, `CUST`, `TECH`, `AGNT`, `UPAY` — they drive the receiver's triage.
- **The conversation:** camt.056 asks → camt.029 answers → pacs.004 returns (only if accepted).
- **camt.056 requests, pacs.004 returns** — and only a granted request moves money.
{{/aside}}

{{embed:explorer:PACS.004|Open the pacs.004 that returns the funds, in the Explorer}}

## So what can you do now?

You can read a camt.056 field by field; name its three parts (`Assgnmt`, `Case`, `Undrlyg`); choose the right cancellation reason code (`DUPL`, `FRAD`, `CUST`, `TECH`, `AGNT`, `UPAY`); trace how a camt.029 answer decides whether a `pacs.004` return follows; and state the one distinction that matters most — a **camt.056 requests, a pacs.004 returns**, and only a granted request ever moves money.

{{check:What does camt.056 ask for?|Cancellation of a payment already in flight — please don't process it|The automatic return of settled funds|A copy of the account statement}}

{{check:Why is a cancellation request not a guarantee?|The payment may already have settled — then getting funds back needs the receiver's consent|The network deletes requests after an hour|Cancellations only work on weekends}}
