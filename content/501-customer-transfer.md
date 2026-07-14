---
title: "Customer Transfer: One Payment, Every Family, Start to Finish"
level: 500
category: Case Studies
summary: "You've met the families one at a time. Now watch a single ordinary payment — one person paying one invoice — pull every message you've learned into one traceable journey from tap to reconciled."
minutes: 9
updated: 2026-07-13
tags: [case-study, customer-transfer, pain.001, pacs.008, camt.054, end-to-end]
related: [305-message-lifecycle, 301-pain-family, 302-pacs-family, 502-payroll]
earnedSkill: "Walk a domestic customer credit transfer end-to-end, naming the pain, pacs, and camt message at each step, the four parties, and the two references that keep it one payment — and read the whole thing as a sequence, not a pile of acronyms."
num: 501
status: published
---

> **The problem first.** Bob owes Sweety ₹33,000 for Invoice 0042. He opens his app, types her account, taps send, and a second later sees a tick. To Bob that was one action. But between his tap and the moment Sweety's accountant ticks the invoice paid, four institutions passed half a dozen instructions back and forth, money settled across a central system, and two ledgers were rewritten.

This is the simplest real payment there is — one customer, one beneficiary, same country, same currency, no intermediaries. Every later case study is this one with something added. And before we play it back, you can assemble it yourself.

## What has to happen in that second?

{{think}}
Bob taps once and sees a tick. But four institutions and a shared settlement system are between his tap and Sweety's accountant marking the invoice paid.

List the *distinct* things that must happen across that whole span — and, for each, which message family you've met would own it.
{{reveal}}
Six beats, in order:

1. **Instruct** — Bob tells his own bank. *(pain.001)*
2. **Receipt** — his bank says "accepted." *(pain.002)* — still no money moved.
3. **Execute** — his bank sends the interbank transfer to Sweety's bank. *(pacs.008)*
4. **Confirm** — Sweety's bank applies the funds and reports "settled." *(pacs.002)*
5. **Notify** — her bank tells her the money arrived. *(camt.054)*
6. **State** — the end-of-day statement closes the books. *(camt.053)*

One instruction, one execution, one confirmation, one notification, one statement — pain, pacs, camt, in order.
{{/think}}

## The cast, and the flow

Four parties, no more: **Bob** (the debtor, who starts it), **Bob's bank** (the debtor agent, holds his money and instructs the move), **Sweety's bank** (the creditor agent, receives and credits), and **Sweety** (the creditor). Bob and Sweety bank at different institutions, but both are reachable on the same domestic real-time rail — the shared system that lets their banks pay each other without ever having met.

{{flow:One payment, four hands|Bob ~ The debtor — he starts it|-> instructs|Bob's bank ~ The debtor agent|-> pays across the shared rail|Clearing & settlement ~ The system both banks trust|-> credits|Sweety's bank ~ The creditor agent|-> notifies|Sweety ~ The creditor — it's for her}}

Follow the ₹33,000, and each step is exactly one message you already know:

1. **pain.001 — Bob instructs his bank.** *Pay ₹33,000 to Sweety, reference `BOB-INV0042`.* The only message a customer ever touches directly.
2. **pain.002 — the receipt.** His bank validates (funds present, account well-formed) and replies *accepted*. Bob's tick. No money has moved.
3. **pacs.008 — the bank moves it.** His bank becomes the debtor agent, turns the instruction into an interbank transfer, stamps a `UETR`, and sends it over the shared rail. *The handoff: pain ends, pacs begins.*
4. **pacs.002 — confirmation.** Sweety's bank applies the funds and reports *settled*. Now the money genuinely moved: Bob's bank down ₹33,000 across the settlement system, Sweety's up the same.
5. **camt.054 — Sweety is told.** A credit notification: *₹33,000 arrived, ref `BOB-INV0042`.* Her accounting system matches Invoice 0042 instantly.
6. **camt.053 — the books close.** The end-of-day statement records the credit; reconciliation is complete.

{{embed:explorer:PACS.008|Open the pacs.008 that moved the money}}

## What kept it one payment

Six messages, four institutions — yet unmistakably *one* payment. Two references did that: **`EndToEndId` (`BOB-INV0042`)**, Bob's own reference, set in the pain.001, carried untouched through the pacs.008, surfacing in Sweety's camt.054; and the **`UETR`**, the globally-unique reference stamped on the interbank leg, quoted by every bank that touches the pacs.008, which is what answers "where is my payment right now?" Set a reference at the start, preserve it to the end, and a payment touched by four institutions still reads as one journey.

## The tick isn't the money

{{think}}
Bob saw his tick at step 2. Was the money moved at that moment? If not, when was the payment *actually* done — and who found out, and when?
{{reveal}}
No — the tick was **acceptance**, not settlement. At step 2 Bob's bank merely *agreed* to make the payment. The money actually moved at **settlement** (step 4), between the banks, across the shared system. And Sweety only learned at **notification** (step 5).

Bob experiences acceptance as "done." The payment is only truly done at settlement. On a real-time rail that gap is a second or two; on a batch rail it's hours. But it's always there — and confusing the two causes most payment misunderstandings.
{{/think}}

{{aside:model|The mental model}}
**One domestic transfer = pain → pacs → camt: six messages, four parties, held together by two references (`EndToEndId` + `UETR`).** This flow is the spine every other case study hangs off — payroll adds volume, cross-border adds a chain, the exceptions add a failure.
{{/aside}}

{{aside:chair|From the engineer's chair}}
The seam to watch is the pain → pacs handoff (step 3): carry `EndToEndId`/`UETR` across it or the far-end reconciliation breaks. And design around the acceptance-vs-settlement gap: the customer's confirmation (`pain.002` accepted) is *not* proof of settlement — mark a payment complete only on the settled status (`ACSC`/`ACCC`), not the tick.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Treating the tick as "money moved."** Acceptance ≠ settlement — build onward actions on the settled status, not the customer's confirmation.
- **Losing the thread.** Drop `EndToEndId`/`UETR` at the handoff and six messages stop being one trackable payment.
- **Expecting one message to do everything.** No single message spans instruct/execute/notify — each leg has its own speaker and job.
{{/aside}}

{{aside:map|The map}}
The base case and its variations:

- The families in general → {{link:article:305-message-lifecycle|the message lifecycle}}.
- This flow at scale → {{link:article:502-payroll|payroll}}.
- This flow across a border → {{link:article:503-cross-border-payment|cross-border}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Six messages, in order:** pain.001 → pain.002 → pacs.008 → pacs.002 → camt.054 → camt.053.
- **Four parties:** debtor → debtor agent → creditor agent → creditor.
- **Held together by** `EndToEndId` (customer thread) + `UETR` (global tracking).
- **Acceptance (tick) ≠ settlement (money moved) ≠ notification (payee told).**
- **The base case** — every other case study is this plus one twist.
{{/aside}}

{{embed:playground|Take this pacs.008 into the Playground and edit it live}}

## So what can you do now?

You can walk a domestic customer credit transfer from tap to reconciled, naming the message at each step, the four parties, and the `EndToEndId` and `UETR` that hold it together. You can tell acceptance from settlement (the tick is not the money), and see why this one flow is the spine every other case study hangs off.

{{check:In the classic Bob-pays-Sweety story, the customer's instruction and the interbank move are…|Two different messages on two different legs of the journey|The same message forwarded twice|Optional — banks can skip either one}}

{{check:Sweety knows the money arrived before any statement. How?|Her bank sends a real-time credit notification the moment the funds book|Bob calls her bank every evening|The clearing house emails her directly}}
