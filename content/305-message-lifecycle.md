---
title: "The Message Lifecycle: How the Families Move One Payment Together"
level: 300
category: Message Deep Dives
summary: "You've met the families one at a time. Now watch them work as a single chain (pain, pacs, camt, and the head envelope around all of them) carrying one payment from a tap in Dubai to a confirmed arrival in Bangalore."
minutes: 8
updated: 2026-06-29
tags: [message-lifecycle, pain, pacs, camt, head, end-to-end, EndToEndId, UETR]
related: [301-pain-family, 302-pacs-family, 303-camt-family, 304-head-admi]
earnedSkill: "Trace one payment end-to-end through the pain, pacs, and camt families inside their head envelopes, name which family owns each step, and explain how a single reference threads the whole journey so the same payment can be tracked across every hop."
num: 305
status: published
---

> **The problem first.** You now know four families of instruction on their own: one initiates, one settles, one reports, one wraps the rest. But a real payment doesn't use them one at a time, in isolation. Bob taps "send" once, and a relay race begins: each family takes the baton, runs its leg, and hands off to the next, until ₹33,000 reaches Sweety and everyone has been told it arrived. So what does the *whole* chain look like, in order? And what makes a payment that a dozen banks touched still readable as one journey?

This page is the map. Every message family in Level 300 exists to own one stretch of a payment's life. Put them in order and the standard stops being a pile of acronyms and becomes a single, legible story.

The shape to hold in your head: **a customer instructs (pain), banks settle (pacs), everyone is told (camt), and every message travels inside an envelope (head).**

## One payment, family by family

Follow Bob's ₹33,000 from his kitchen in Dubai to Sweety's account in Bangalore. Each numbered step belongs to exactly one family.

1. **pain.001, the instruction.** Bob's app builds a Customer Credit Transfer Initiation and sends it to *his own bank*. This is the only step a customer touches directly. *(Family: pain.)*
2. **pain.002, the receipt.** Bob's bank validates it and replies: accepted. Bob sees a tick. Still, no money has moved. *(Family: pain.)*
3. **pacs.008, the execution.** Bob's bank becomes the debtor agent, turns the accepted instruction into an interbank credit transfer, and sends it toward Sweety's bank, through intermediaries if the two banks have never met. *This is the handoff: pain ends, pacs begins.* *(Family: pacs.)*
4. **pacs.002, the confirmation.** Sweety's bank applies the funds and sends a status report back up the chain: settled. *(Family: pacs.)* *(Had her account been closed, a **pacs.004** return would send the money home instead.)*
5. **camt.054, the notification.** Sweety's bank fires a single-event credit notification: "₹33,000 just arrived." Her accounting system matches it to Invoice 0042 on the spot. *(Family: camt.)*
6. **camt.053, the statement.** At day's end, the authoritative statement closes the books, and reconciliation, the last stage of the lifecycle, is complete. *(Family: camt.)*

And wrapping **every single one** of those messages on the wire: a **head.001 Business Application Header**, the envelope telling the network who sent each message, to whom, and what's inside, while **admi** messages quietly keep the rails open underneath.

{{embed:explorer:PACS.008|Inspect the pacs.008 that carries the money}}

## The thread that ties it together

Six messages, several banks, two countries. And yet it's *one* payment. What makes that true is a small set of references that survive every hop:

- **`EndToEndId`, Bob's own reference** (`BOB-INV0042`). Bob's app set it in the pain.001; the pacs.008 carried it untouched; it surfaced again inside the camt.054 entry. It's why Sweety's "Invoice 0042" is recognisable from the first tap to the final statement.
- **`UETR`, the unique end-to-end transaction reference.** A globally unique id stamped on the interbank leg, the engine behind "where is my payment right now?" tracking across every bank in the chain.

A reference set at the start and preserved to the end is what lets a payment touched by a dozen institutions still be tracked, matched, and reconciled as a single journey. Lose the thread and you have six unrelated messages; keep it and you have one payment.

## The map, in one line per family

- **pain** is the customer's side of the glass: instruct (pain.001), get a receipt (pain.002).
- **pacs** is the interbank engine room: move the money (pacs.008), confirm or return it (pacs.002 / pacs.004).
- **camt** closes the loop: notify (camt.054), then state and reconcile (camt.053).
- **head & admi** are the envelope around every message, and the housekeeping that keeps the network alive.

Read those four lines top to bottom and you've read the life of a payment. Want to go deeper on any leg? Each family's own page is one tap away below, and when you're ready to stop reading and start *handling* messages, the Playground has a live one waiting.

{{embed:playground|Take a live message into the Playground}}

## So, what can you now do?

You can trace one payment end-to-end through pain, pacs, and camt, naming which family owns each step and where one hands off to the next, explain that every message rides inside a head.001 envelope over admi-maintained rails, and point to the `EndToEndId` and `UETR` as the threads that let a payment crossing many banks still be read, tracked, and reconciled as a single journey. That completes Level 300.

{{check:Across one payment’s life, the families appear in which order?|Initiation (customer to bank), settlement (bank to bank), then reporting (bank to customer)|Reporting first, then initiation, then settlement|All three fire at the same moment}}

{{check:Why does one payment produce several different messages?|Each leg has a different speaker, listener, and job — no single message fits them all|Networks charge less for many small messages|Legacy rules require everything in triplicate}}
