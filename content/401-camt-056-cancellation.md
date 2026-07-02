---
title: "camt.056: Calling a Payment Back"
level: 400
category: Exceptions
summary: "Sometimes a payment is sent in error and has to be recalled. camt.056 is the polite, structured way one bank asks another to cancel — field by field, and why it only ever asks, never takes."
minutes: 7
updated: 2026-07-01
tags: [camt.056, cancellation, recall, R-transactions]
related: [401-camt-056-cancellation, 403-recall, 402-return, 405-investigations]
earnedSkill: "Read a camt.056 field by field, name its three structural parts (Assignment, Case, Underlying), pick the right cancellation reason code, trace how the camt.029 answer decides whether a pacs.004 return follows, and state the one distinction that matters most: a camt.056 requests, a pacs.004 returns."
num: 406
status: published
---

> **The problem first.** Bob's bank just sent ₹33,000 to Sweety — and then realised it sent it **twice**. The duplicate settled too. The money is sitting safely in Sweety's account, where it has every right to be; nobody on her side did anything wrong. There is no "undo" button on a settled payment. So how does Bob's bank *ask* Sweety's bank to give it back — in a structured request the receiver can act on automatically, knowing the answer might be **no**?

That message is **camt.056** — *FI to FI Payment Cancellation Request*. The **recall chapter** told the story of the flow; this is the **field-by-field** read of the request itself, the first of the **R-transactions**.

The one line to hold onto: **a camt.056 is a question, not a transfer.** No money moves on it. It asks.

## What camt.056 is, precisely

It is a bank-to-bank **request to cancel** a payment that has already been sent — and usually already settled. It carries a reason, references to the original payment so the receiver can find it, and nothing else. It does not move funds and it does not guarantee anything comes back.

Its structure has three parts, outer to inner:

- **Assignment (`Assgnmt`)** — who is asking whom, and when. The envelope of the *request*: assigner, assignee, a request id, a timestamp.
- **Case (`Case`)** — the case id that ties this request (and its future answer) into one investigation thread. Every later message about this recall quotes the same case.
- **Underlying (`Undrlyg` → `TxInf`)** — *which* payment to cancel: the original references and amount, plus the **cancellation reason**.

## The reason code is the whole point

The receiver's decision hinges on **why** you're asking. camt.056 carries a structured reason, not free text:

- **`DUPL`** — duplicate payment (Bob's case).
- **`FRAD`** — fraud suspected; freeze and return.
- **`CUST`** — the customer requested the cancellation.
- **`TECH`** — a technical error in the original instruction.
- **`AGNT`** — wrong agent / routing error.
- **`UPAY`** — undue payment (shouldn't have been made).

A structured reason lets the receiving bank triage automatically: a `FRAD` recall routes to fraud ops instantly; a `DUPL` can often be resolved with a quick check that the funds are still there.

## A sample camt.056

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

Read what's there and what isn't. There's an **`OrgnlIntrBkSttlmAmt`** — the amount of the payment being recalled — but no new amount to settle: **nothing moves on this message.** The `OrgnlEndToEndId` and `OrgnlUETR` are the *same* references Bob's original pain.001/pacs.008 carried, so the receiver can find the exact payment among millions. The `Case` id will reappear on every message in this thread.

## How the answer comes back — and when money moves

A camt.056 opens a two-message conversation:

1. **Bob's bank sends the camt.056** (above): *please cancel `BOB-INV0042`, reason `DUPL`.*
2. **Sweety's bank investigates** — is the money still there, will the customer consent — and replies with a **camt.029 (Resolution of Investigation)**, quoting the same `Case`:
   - **Accepted** → it agrees, then performs an actual **pacs.004 Payment Return** to physically send ₹33,000 back to Bob's bank. *Only now does money move.*
   - **Rejected** → a camt.029 declining, with a reason (funds withdrawn, no consent). Bob's bank gets **nothing** back and must escalate.

So the camt.056 never returns money by itself. It asks; the camt.029 answers; a pacs.004 does the actual returning — but only if the answer was yes.

{{embed:explorer:PACS.004|Open the pacs.004 that returns the funds, in the Explorer}}

## camt.056 vs pacs.004 — the distinction that matters most

If you remember one thing, remember this pair:

- **camt.056 = the *request*.** Sender-driven, sent because the sender erred. Carries a reason. Moves no money. Can be refused.
- **pacs.004 = the *return*.** The actual transfer of funds back. It happens either because the *receiver* couldn't apply the payment (a plain return), or because a recall was *granted* (a camt.029-accepted camt.056 leads to one).

A recall that is refused produces a camt.029 and no pacs.004 — the money stays put. That asymmetry — request may fail, return moves funds — is where real-world payment operations live.

## So, what can you now do?

You can read a camt.056 field by field; name its three parts (`Assgnmt`, `Case`, `Undrlyg`); choose the right cancellation reason code (`DUPL`, `FRAD`, `CUST`, `TECH`, `AGNT`, `UPAY`); trace how a camt.029 answer decides whether a `pacs.004` return follows; and state the one distinction that matters most — a **camt.056 requests, a pacs.004 returns**, and only a granted request ever moves money.

{{check:What does camt.056 ask for?|Cancellation of a payment already in flight — please don’t process it|The automatic return of settled funds|A copy of the account statement}}

{{check:Why is a cancellation request not a guarantee?|The payment may already have settled — then getting funds back needs the receiver’s consent|The network deletes requests after an hour|Cancellations only work on weekends}}
