---
title: "Reject: When a Payment Is Turned Away Before It Settles"
level: 400
category: Exceptions
summary: "Not every payment makes it through. A reject is the cleanest failure there is: caught before any money moves, answered with a single status message and a reason code."
minutes: 7
updated: 2026-07-13
tags: [reject, RJCT, pacs.002, pain.002, status, R-transactions]
related: [402-return, 302-pacs-family, 301-pain-family, 310-status-reports]
earnedSkill: "Tell a reject from a return, name the message that carries a reject (pain.002 to the customer, pacs.002 between banks), read the RJCT status and its reason code, and explain why a reject never needs money sent back."
num: 401
status: published
---

> **The problem first.** Bob taps send on ₹33,000 to Sweety. A second later his app shows a red cross: *payment not processed*. No money left his account. Somewhere between his bank and Sweety's, something said *no* before a single rupee moved.

Welcome to **Level 400**. Everything so far has been the happy path. This level is the four ways a payment goes *wrong* — **reject, return, recall, reversal** — and one question sorts all four: **has the money settled yet?** We start with the one that happens first.

## Say "no" before anything moves

{{think}}
A bank receives Bob's payment, checks it, and decides it can't (or won't) process it — before any money has moved. It has to say "no" in a way Bob's app, or another bank's computer, can act on automatically.

What does that "no" need to carry? And the key question of the whole level: does anything have to be sent *back*?
{{reveal}}
The "no" is a **status message** carrying a rejected status, a **reason code** for why, and the original payment's references so it finds its way home. That's it.

And nothing is sent back — because nothing settled. No debit, no credit, no money in flight to unwind. That's what makes a reject the cheapest, cleanest exception there is: it's a failure caught before it cost anything.
{{/think}}

## What triggers a reject

A bank rejects when it checks a payment and decides it cannot or must not process it. Two flavours: **technical/validation** failures (malformed message, missing mandatory field, negative amount, impossible date, schema mismatch) and **business** failures (structure perfect, but insufficient funds, a non-existent account, a sanctions hit, an unsupported currency on that rail). Either way the bank stops and, instead of forwarding, sends back a status report that says *rejected*.

## Which messages carry a reject

A reject is never its own message — it's a **status** inside the status reports from {{link:article:310-status-reports|the status-reports deep dive}}: a **pain.002** when Bob's *own* bank rejects his pain.001 (the red cross in his app), or a **pacs.002** when a payment is rejected *between banks* (an intermediary or Sweety's bank refusing the pacs.008). The one field that matters is the status code: `RJCT` (rejected — end of the road for this attempt), versus `ACSP` (in process) or `ACCC` (completed and credited). A reject is always `RJCT`, and it never travels without a **reason code**.

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

Notice there's no amount being returned — only a status and a reason. The `OrgnlEndToEndId` (`BOB-INV0042`) and `OrgnlUETR` point straight back at the payment being rejected, the same references that threaded the pain.001 → pacs.008 chain. That's how the rejection finds its way home to the exact instruction that caused it. The fix is the simplest in Level 400: the sender corrects the problem and resubmits as a brand-new payment with a new id. The old one simply never happened.

## The question that separates a reject from everything else

{{think}}
You're triaging a failed payment and you catch yourself asking the operational question that runs all of Level 400: *do we owe them the money back?*

For a reject, what's the answer — and why is it always the same?
{{reveal}}
Always *no*. A reject happened *before* settlement, so there was never any money on the other side to owe. Compare the next chapter — a **return** — where the money *did* settle and now has to be physically sent back with a pacs.004. The dividing line is settlement: before it, a status message ends the matter; after it, cash has to travel. Ask "has it settled?" first, every time.
{{/think}}

{{aside:model|The mental model}}
**The whole of Level 400 hinges on one question: has it settled yet?** A reject is the "not yet" answer — caught before settlement, so no money moves and nothing comes back. It's a status (`RJCT`) plus a reason, not a transfer.
{{/aside}}

{{aside:chair|From the engineer's chair}}
A reject rides in a `pain.002` (to the customer) or `pacs.002` (between banks) as `TxSts` = `RJCT`, always with a `StsRsnInf` reason code (`AC04` account closed, `AM04` insufficient funds, `RR04` regulatory…). It ties back to the dead payment via `OrgnlEndToEndId`/`OrgnlUETR` — so your handler matches the rejection to the original by reference, never by re-parsing.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Treating a reject like a return.** There's no money to send back — building a pacs.004 for a rejected (unsettled) payment invents a transfer that shouldn't exist.
- **Dropping the reason code.** A bare `RJCT` with no reason leaves the sender guessing why, so they can't fix and resubmit cleanly.
- **Losing the `Orgnl*` thread.** Without the original references, the rejection can't be auto-matched to the instruction it killed, and a human has to hunt for it.
{{/aside}}

{{aside:map|The map}}
The first and cheapest exception:

- The status vocabulary it lives in → {{link:article:310-status-reports|status reports}}.
- Its after-settlement counterpart → {{link:article:402-return|return}}.
- The codes that say why → {{link:article:408-reason-codes|reason codes}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Reject** = failure *before* settlement. No money moved, nothing comes back.
- **Carried as a status:** `pain.002` (to customer) / `pacs.002` (between banks), `TxSts` = `RJCT`.
- **Always carries a reason code** (`AC04`, `AM04`, `RR04`, …) and the `Orgnl*` references.
- **Resolution:** sender fixes and resubmits as a new payment. The old one never happened.
- **The test:** "has it settled?" → no → reject → nothing to return.
{{/aside}}

{{embed:explorer:PACS.002|See the status report, pacs.002, that carries a reject}}
{{embed:article:310-status-reports|The full status vocabulary a reject lives inside: pain.002 & pacs.002}}

## So what can you do now?

You can tell a reject from the other three exceptions by the single question *has it settled yet?*, name the message that carries it (pain.002 to the customer, pacs.002 between banks), read the `RJCT` status and its reason code, point to the `OrgnlEndToEndId` that ties a rejection back to the payment it killed, and explain why a reject is the only Level 400 exception that never sends money back.

{{check:What is a reject?|A payment turned away before settlement — no money has moved|Money sent back after it settled|A customer cancelling a subscription}}

{{check:What should a reject always carry?|A reason code that says exactly why it was refused|The sender's current account balance|An automatic replacement payment}}
