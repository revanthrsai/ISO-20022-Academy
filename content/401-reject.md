---
title: "Reject: When a Payment Is Turned Away Before It Settles"
level: 400
category: Exceptions
summary: "Not every payment makes it through. A reject is the cleanest failure there is: caught before any money moves, answered with a single status message and a reason code."
minutes: 7
updated: 2026-06-29
tags: [reject, RJCT, pacs.002, pain.002, status, R-transactions]
related: [401-reject, 402-return, 302-pacs-family, 301-pain-family, 310-status-reports]
earnedSkill: "Tell a reject apart from a return, name the message that carries a reject (pain.002 to the customer, pacs.002 between banks), read the RJCT status and its reason code, and explain why a reject never needs money sent back."
num: 401
status: published
---

> **The problem first.** Bob taps send on ₹33,000 to Sweety. A second later his app shows a red cross: *payment not processed*. No money left his account. Somewhere between his bank and Sweety's, something said *no* before a single rupee moved. How does a bank say "no" in a way Bob's app, or another bank's computer, can act on automatically, and why is this the easiest payment failure to live with?

Welcome to **Level 400**. Everything you've read so far has been the happy path: the instruction goes in, the money moves, the receipt comes back. This level is about the four ways a payment goes *wrong*, and the messages built to handle each one. The four to keep straight are **reject, return, recall, and reversal**, and the difference between them comes down to one question: **has the money settled yet?**

A **reject** is the failure that happens *before* settlement. Nothing has moved, so nothing needs to come back. It's the cheapest, cleanest exception there is.

## What triggers a reject

A payment is rejected when a bank receives it, checks it, and decides it cannot, or must not, be processed. The checks come in two flavours:

- **Technical / validation failures.** The message is malformed, a mandatory field is missing, an amount is negative, a date is impossible, the structure doesn't match the schema.
- **Business failures.** The structure is perfect but the content fails a rule: the debtor has insufficient funds, the account doesn't exist, a sanctions screen flags a name, the currency isn't supported on that rail.

Either way the bank stops, and instead of forwarding the payment, it sends back a **status report** that says *rejected*.

## Which messages carry a reject

A reject is never its own dedicated message. It's a **status** carried inside the status-report messages from the {{link:article:310-status-reports|status-reports deep-dive}} in Level 300:

- **pain.002, Customer Payment Status Report.** When Bob's *own* bank rejects his instruction, it answers his pain.001 with a pain.002 carrying status `RJCT`. This is the red cross in Bob's app.
- **pacs.002, FI Payment Status Report.** When a payment is rejected *between banks*, say an intermediary or Sweety's bank refuses the pacs.008, that bank sends a pacs.002 back up the chain carrying the same `RJCT` status.

The single most important field in either is the **status code**. The three you'll see constantly:

- `RJCT` means **rejected**. The end of the road for this attempt.
- `ACSP` means accepted, settlement in process.
- `ACCC` means accepted and settlement completed.

A reject is always `RJCT`, and it never travels alone; it carries a **reason code** explaining *why*.

{{embed:explorer:PACS.002|See the status report, pacs.002, that carries a reject}}

## The resolution flow

Because nothing settled, the resolution is the simplest in all of Level 400: **there is no money to send back.**

1. The receiving bank validates the payment and finds a problem.
2. It builds a status report, **pain.002** if answering a customer or **pacs.002** if answering another bank, with status `RJCT` and a **reason code** (e.g. `AC04` account closed, `AM04` insufficient funds, `RR04` regulatory reason).
3. That report travels back to the sender. The payment is dead; no debit, no credit, no settlement to unwind.
4. **The sender fixes and resubmits.** Bob corrects Sweety's account number and taps send again, a brand-new payment with a new identifier. The old one simply never happened.

Here's a pacs.002 carrying a reject. Notice there's no amount being returned, only a status and a reason:

```xml
<FIToFIPmtStsRpt>
  <GrpHdr>
    <MsgId>HDFCINBB-STS-0042</MsgId>
    <CreDtTm>2026-06-29T09:31:00+05:30</CreDtTm>
  </GrpHdr>
  <TxInfAndSts>
    <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>
    <OrgnlUETR>eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4</OrgnlUETR>
    <TxSts>RJCT</TxSts>
    <StsRsnInf>
      <Rsn><Cd>AC04</Cd></Rsn>
      <AddtlInf>Creditor account closed</AddtlInf>
    </StsRsnInf>
  </TxInfAndSts>
</FIToFIPmtStsRpt>
```

The `OrgnlEndToEndId` (`BOB-INV0042`) and `OrgnlUETR` point straight back at the payment being rejected, the same references that threaded the pain.001 → pacs.008 chain. That's how the rejection finds its way home to the exact instruction that caused it.

## Reject vs. the others: the one rule

The whole of Level 400 hinges on this: **a reject happens before settlement, so no money moves and nothing comes back.** Compare that with the next chapter, a **return**, where the money *did* settle and now has to be physically sent back with a pacs.004. If you ever catch yourself asking "do we owe them the money back?", the answer for a reject is always *no*. There was never any money to owe.

## So, what can you now do?

You can tell a reject apart from the other three exceptions by the single question *has it settled yet?*, name the message that carries a reject (pain.002 to the customer, pacs.002 between banks), read the `RJCT` status and its reason code, point to the `OrgnlEndToEndId` that ties a rejection back to the payment it killed, and explain why a reject is the only Level 400 exception that never sends money back.

{{check:What is a reject?|A payment turned away before settlement — no money has moved|Money sent back after it settled|A customer cancelling a subscription}}

{{embed:article:310-status-reports|The full status vocabulary a reject lives inside: pain.002 & pacs.002}}

{{check:What should a reject always carry?|A reason code that says exactly why it was refused|The sender’s current account balance|An automatic replacement payment}}
