---
title: "Customer Transfer: One Payment, Every Family, Start to Finish"
level: 500
category: Case Studies
summary: "You've met the families one at a time. Now watch a single ordinary payment — one person paying one invoice — pull every message you've learned into a single, traceable journey from tap to reconciled."
minutes: 9
updated: 2026-06-29
tags: [case-study, customer-transfer, pain.001, pacs.008, camt.054, end-to-end]
related: [501-customer-transfer, 305-message-lifecycle, 301-pain-family, 302-pacs-family]
earnedSkill: "Walk a single domestic customer credit transfer end-to-end — naming the pain, pacs, and camt message at each step, the four parties that touch it, and the two references that keep it one payment — and read the whole thing as a sequence rather than a pile of acronyms."
num: 501
status: published
---

> **The problem first.** Bob owes Sweety ₹33,000 for Invoice 0042. He opens his banking app, types her account, taps send — and a second later sees a tick. To Bob that was one action. But between his tap and the moment Sweety's accountant ticks the invoice as paid, four institutions passed half a dozen instructions back and forth, money settled across a central system, and two ledgers were rewritten. This is the case study that puts every family you've learned into one motion. What actually happened in that second — and the hours after it?

This is the simplest real payment there is: one customer, one beneficiary, same country, same currency, no intermediaries. Every later case study is this one with something added — more payments (payroll), more borders (cross-border), something gone wrong (the exceptions). Get this flow solid and the rest are variations on a theme.

## The cast

Four parties, no more:

- **Bob** — the *debtor*. He starts the payment.
- **Bob's bank** — the *debtor agent*. It holds Bob's money and instructs the move.
- **Sweety's bank** — the *creditor agent*. It receives the money and credits her.
- **Sweety** — the *creditor*. The money is for her.

Bob and Sweety bank at different institutions, but both are reachable on the same domestic real-time rail. That single shared system is what lets their banks pay each other without ever having met.

## The flow, message by message

{{flow:One payment, four hands|Bob ~ The debtor — he starts it|-> instructs|Bob's bank ~ The debtor agent|-> pays across the shared rail|Clearing & settlement ~ The system both banks trust|-> credits|Sweety's bank ~ The creditor agent|-> notifies|Sweety ~ The creditor — it's for her}}

Follow the ₹33,000. Each step is exactly one message you already know.

1. **pain.001 — Bob instructs his bank.** His app builds a *Customer Credit Transfer Initiation*: pay ₹33,000 to Sweety's account, reference `BOB-INV0042`. This is the only message a customer ever touches directly. *(Family: pain.)*
2. **pain.002 — the receipt.** Bob's bank validates the instruction — Bob has the funds, Sweety's account details are well-formed — and replies *accepted*. Bob sees his tick. **No money has moved yet.** *(Family: pain.)*
3. **pacs.008 — the bank moves it.** Bob's bank becomes the debtor agent, turns the accepted instruction into an *interbank* credit transfer, stamps it with a `UETR`, and sends it to Sweety's bank over the shared rail. *This is the handoff: pain ends, pacs begins.* *(Family: pacs.)*
4. **pacs.002 — confirmation.** Sweety's bank receives the pacs.008, applies the funds to her account, and sends a status report back: settled. Now the money has genuinely moved — Bob's bank is down ₹33,000 across the settlement system, Sweety's bank is up the same. *(Family: pacs.)*
5. **camt.054 — Sweety is told.** Sweety's bank fires a credit notification: "₹33,000 arrived, reference `BOB-INV0042`." Her accounting system matches it to Invoice 0042 instantly and marks it paid. *(Family: camt.)*
6. **camt.053 — the books close.** At end of day, the authoritative statement records the credit alongside every other entry. Reconciliation — the final stage of the payment lifecycle — is complete. *(Family: camt.)*

That's the whole payment. One instruction, one execution, one confirmation, one notification, one statement — pain, pacs, camt, in order.

{{embed:explorer:PACS.008|Open the pacs.008 that moved the money}}

## What kept it one payment

Six messages crossed four institutions, yet it was unmistakably *one* payment. Two references did that:

- **`EndToEndId` (`BOB-INV0042`)** — Bob's own reference. He set it in the pain.001; the pacs.008 carried it untouched; it surfaced again in Sweety's camt.054. It's why "Invoice 0042" was recognisable from the first tap to the closing statement.
- **`UETR`** — the globally-unique transaction reference stamped on the interbank leg. It's the answer to "where is my payment right now?" — every bank that touches the pacs.008 quotes the same `UETR`.

Set a reference at the start, preserve it to the end, and a payment touched by four institutions still reads as a single journey.

## The two moments that matter

Two instants inside that flow are worth separating, because confusing them causes most payment misunderstandings:

- **Acceptance (step 2)** — Bob's bank *agreed* to make the payment. Bob got a tick. No money had moved.
- **Settlement (step 4)** — the money *actually moved* between the banks across the shared system.

Bob experiences acceptance as "done." The payment is only truly done at settlement — and Sweety only finds out at notification. The gap between those moments is small on a real-time rail and large on a batch one, but it's always there.

{{embed:playground|Take this pacs.008 into the Playground and edit it live}}

## So, what can you now do?

You can walk a single domestic customer credit transfer from tap to reconciled — naming the message at each step (pain.001 instruct, pain.002 receipt, pacs.008 execute, pacs.002 confirm, camt.054 notify, camt.053 state), the four parties that touch it (debtor, debtor agent, creditor agent, creditor), and the `EndToEndId` and `UETR` that hold it together. You can tell acceptance apart from settlement — the tick is not the money — and you can see why this one flow is the spine every other case study hangs off.

{{check:In the classic Bob-pays-Sweety story, the customer’s instruction and the interbank move are…|Two different messages on two different legs of the journey|The same message forwarded twice|Optional — banks can skip either one}}

{{check:Sweety knows the money arrived before any statement. How?|Her bank sends a real-time credit notification the moment the funds book|Bob calls her bank every evening|The clearing house emails her directly}}
