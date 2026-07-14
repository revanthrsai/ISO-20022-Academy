---
title: "The Message Lifecycle: How the Families Move One Payment Together"
level: 300
category: Message Deep Dives
summary: "You've met the families one at a time. Now watch them work as a single chain — pain, pacs, camt, and the head envelope around all of them — carrying one payment from a tap in Dubai to a confirmed arrival in Bangalore."
minutes: 8
updated: 2026-07-13
tags: [message-lifecycle, pain, pacs, camt, head, end-to-end, EndToEndId, UETR]
related: [301-pain-family, 302-pacs-family, 303-camt-family, 304-head-admi]
earnedSkill: "Trace one payment end-to-end through pain, pacs, and camt inside their head envelopes, name which family owns each step, and explain how one reference threads the whole journey so a payment crossing many banks reads as one."
num: 305
status: published
---

> **The problem first.** You now know four families of message on their own: one initiates, one settles, one reports, one wraps the rest. But a real payment doesn't use them one at a time. Bob taps "send" once, and a relay begins — each family takes the baton, runs its leg, and hands off — until ₹33,000 reaches Sweety and everyone's been told it arrived.

This is the page that turns a pile of acronyms into one story. And you can assemble the story yourself before reading the answer.

## Put the families in order

{{think}}
You've got four families: **pain** (a customer instructs their bank), **pacs** (banks move money between themselves), **camt** (reports what happened), and **head** (the envelope around every message). Bob taps send once.

Lay out the messages in the order they'd fire, and say who's talking to whom at each step.
{{reveal}}
1. **pain.001** — Bob's app instructs *his own bank*. The only step a customer touches. *(pain)*
2. **pain.002** — his bank validates and replies "accepted." A tick, no money moved yet. *(pain)*
3. **pacs.008** — his bank becomes the debtor agent and sends the interbank transfer toward Sweety's bank. *The handoff: pain ends, pacs begins.* *(pacs)*
4. **pacs.002** — Sweety's bank applies the funds and reports "settled" back up the chain. (Or a **pacs.004** return, if her account was closed.) *(pacs)*
5. **camt.054** — her bank fires "₹33,000 just arrived," which her ERP matches to Invoice 0042 on the spot. *(camt)*
6. **camt.053** — at day's end, the statement closes the books and reconciliation is done. *(camt)*

And wrapping *every one* of those on the wire: a **head.001** envelope, over rails that **admi** messages keep open.
{{/think}}

{{embed:explorer:PACS.008|Inspect the pacs.008 that carries the money}}

## What makes six messages one payment?

{{think}}
Six messages. Several banks. Two countries. Two message families that never speak to each other directly. And yet everyone agrees it's *one* payment, trackable and reconcilable as a single thing. What single mechanism makes that true?
{{reveal}}
A small set of references, set at the start and preserved to the end:

- **`EndToEndId`** — Bob's own reference (`BOB-INV0042`). Set in the pain.001, carried untouched by the pacs.008, surfacing again inside the camt.054 entry. It's why "Invoice 0042" is recognisable from the first tap to the final statement.
- **`UETR`** — the globally unique id stamped on the interbank leg, the engine behind "where is my payment right now?"

Lose the thread and you have six unrelated messages. Keep it and you have one payment. That preservation *is* the lifecycle's spine.
{{/think}}

## The map, one line per family

- **pain** — the customer's side of the glass: instruct (pain.001), get a receipt (pain.002).
- **pacs** — the interbank engine room: move the money (pacs.008), confirm or return (pacs.002 / pacs.004).
- **camt** — closing the loop: notify (camt.054), then state and reconcile (camt.053).
- **head & admi** — the envelope around every message, and the housekeeping that keeps the network alive.

Read those four lines top to bottom and you've read the life of a payment.

{{aside:model|The mental model}}
**A customer instructs (pain), banks settle (pacs), everyone is told (camt), and every message travels inside an envelope (head).** Four families, one relay, each owning one leg — stitched into a single payment by a reference that survives every hop.
{{/aside}}

{{aside:chair|From the engineer's chair}}
The two handoffs are where bugs live. pain → pacs happens when the bank builds the pacs.008 from the accepted pain.001 — carry `EndToEndId`/`UETR` across it or reconciliation dies downstream. And the pacs.002-vs-pacs.004 fork (confirmed vs returned) is the branch your processing has to handle explicitly; a returned payment isn't a failed one, it's money coming back that must be matched to the original via `Orgnl*` references.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Expecting one message to do it all.** No single message fits every leg — different speaker, listener, and job each time. A system that models a payment as one message can't represent its real life.
- **Losing the thread.** Drop or rewrite `EndToEndId`/`UETR` at a hop and the six messages stop being one trackable payment.
- **Assuming a fixed order without the fork.** Step 4 can be a confirmation *or* a return; treating "no pacs.002 yet" as failure (or a pacs.004 as success) both mislead.
{{/aside}}

{{aside:map|The map}}
Each leg's own deep dive:

- The customer side → {{link:article:301-pain-family|the pain family}}.
- The interbank side → {{link:article:302-pacs-family|the pacs family}}.
- The reporting side → {{link:article:303-camt-family|the camt family}}, wrapped by {{link:article:304-head-admi|head & admi}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Order:** pain.001 → pain.002 → pacs.008 → pacs.002 (or pacs.004) → camt.054 → camt.053.
- **Who talks:** pain = customer↔bank; pacs = bank↔bank; camt = bank→customer; head wraps all.
- **The handoff:** pain → pacs when the bank builds the pacs.008.
- **The thread:** `EndToEndId` (customer) + `UETR` (global) survive every hop — that's what makes it one payment.
- **admi** keeps the rails open underneath.
{{/aside}}

{{embed:playground|Take a live message into the Playground}}

## So what can you do now?

You can trace one payment end-to-end through pain, pacs, and camt, name which family owns each step and where one hands off to the next, explain that every message rides inside a head.001 envelope over admi-maintained rails, and point to `EndToEndId` and `UETR` as the threads that let a payment crossing many banks still read as a single journey. That completes Level 300.

{{check:Across one payment's life, the families appear in which order?|Initiation (customer to bank), settlement (bank to bank), then reporting (bank to customer)|Reporting first, then initiation, then settlement|All three fire at the same moment}}

{{check:Why does one payment produce several different messages?|Each leg has a different speaker, listener, and job — no single message fits them all|Networks charge less for many small messages|Legacy rules require everything in triplicate}}
