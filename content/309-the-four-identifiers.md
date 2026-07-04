---
title: "The Four Identifiers: MsgId, EndToEndId, TxId & UETR"
level: 300
num: 309
summary: "Four references ride every payment, and mixing them up is the single most common confusion in the field. Four IDs, four different jobs, four different lifespans. Sort them once and payments investigations get dramatically shorter."
minutes: 6
updated: 2026-07-04
tags: [msgid, endtoendid, txid, uetr, identifiers, tracing]
related: [306-anatomy-of-a-message, 302-pain-001, 301-pacs-008]
earnedSkill: "Name the four identifiers, state each one's owner, scope, and lifespan without hesitating, and pick the right one to quote in any operational situation."
status: published
---

> **Which reference do you want?** A corporate treasurer calls her bank about a missing payment. "What's the reference?" asks the service desk. She reads out the one from her ERP. Wrong one; that never left her building. The desk quotes theirs back; means nothing to her system. Eleven minutes of two professionals reading numbers at each other before someone finally asks for the one reference every bank in the chain can actually look up. Four identifiers ride every payment, and knowing which is which is the difference between an eleven-minute call and an eleven-second one.

The confusion is understandable, because the four look alike: strings of letters and digits sitting near each other in the same block of the same message. The cure is to stop reading them as strings and start reading them as **jobs**. Each identifier answers a different question, for a different audience, over a different lifespan.

## The four, sorted

- **`MsgId`: "which envelope is this?"** Set by whoever creates *each message*, identifying that transmission and nothing else. It changes at every hop, because every hop creates a new message. Its job is humble and vital: duplicate detection. If the same MsgId arrives twice, the second one is a resend, not a second payment. Lifespan: one hop.
- **`EndToEndId`: "which payment is this, in the customer's words?"** Set by the *customer* at initiation (`BOB-INV0042`), and carried unchanged by every agent to the very end, where it surfaces on the creditor's statement. It is the customer's thread through the machine. No bank may rewrite it. Lifespan: the whole journey, customer to customer.
- **`TxId`: "which transaction is this, in the banks' words?"** Set by the *first instructing agent* when the payment enters the interbank space. Where EndToEndId belongs to the customer, TxId belongs to the banks: it identifies the interbank transaction for clearing, settlement, and any later R-transaction that must point back at it. Lifespan: the interbank leg, end to end.
- **`UETR`: "which journey is this, globally?"** The Unique End-to-end Transaction Reference: a UUID stamped when the payment enters the interbank chain and never changed after. Its superpower is being *globally unique*, not just unique between two parties, which is what lets a tracker show one payment's position across many banks. Lifespan: the whole interbank journey, and it's the reference the whole industry can look up.

{{flow:Four threads through one payment|Customer ~ sets EndToEndId in the pain.001|-> first bank|Debtor agent ~ stamps TxId and UETR, new MsgId|-> each hop|Intermediaries ~ new MsgId every hop, other three untouched|-> arrival|Creditor's statement ~ EndToEndId surfaces back to a human}}

## The mental model: postcards in a pilgrimage

A pilgrim walks a long route, carrying one **passport** (UETR: globally checkable, never reissued) and wearing one **name tag** written by her family (EndToEndId: how the people at home know her). The hostels along the route log her in their own **guest registers** (TxId: the institutions' shared record), and every leg of the journey has its own **bus ticket** (MsgId: valid for that ride only, a new one each time).

Ask "which reference?" and the model answers: family asking about her? Name tag. Two hostels reconciling? Register. Anyone anywhere locating her right now? Passport. Proving you didn't board the same bus twice? Ticket.

## Choosing the right one, operationally

- Customer says "where is my payment?" → look up **UETR** (and give them their **EndToEndId** back in the answer, because that's the word they recognize).
- Reconciling a statement line to an instruction → **EndToEndId**.
- Returning or recalling a settled payment → the R-message quotes **TxId** and **UETR** of the original (as `OrgnlTxId`, `OrgnlUETR`), because banks are talking to banks.
- Suspecting a duplicate file or message → **MsgId**.

## What breaks

- **EndToEndId rewritten mid-chain.** A legacy system replaces the customer's reference with its own. The payment settles fine; reconciliation at the far end dies, and the creditor's ERP books nothing automatically. The one rule: it travels untouched.
- **`NOTPROVIDED`.** The standard's shrug: when the initiating channel supplies no EndToEndId, some systems fill in the literal word NOTPROVIDED. Legal, and operationally miserable: thousands of payments all "identified" by the same non-identifier.
- **MsgId reused across different messages.** A sender's sequence generator resets after a crash and yesterday's MsgIds reappear on today's messages. Receivers reject them as duplicates, and perfectly good payments bounce.
- **Investigating with the wrong id.** Quoting a MsgId to a bank three hops away is quoting a bus ticket from a bus they were never on. Cross-chain questions need the passport: UETR.

The phrase to keep: **four IDs, four jobs: the envelope, the customer's thread, the banks' record, the global passport.** Say the job, not the string, and you'll never mix them again.

{{embed:article:302-pain-001|Where three of the four are born: pain.001 field by field}}
{{embed:explorer:PACS.008|See all four riding a live pacs.008}}

{{check:Which identifier may never be altered by any agent in the chain?|EndToEndId, the customer's reference, plus the UETR stamped at entry|MsgId, which must stay constant across hops|Whichever one is longest}}
{{check:Why does MsgId change at every hop?|Each hop creates a new message, and MsgId identifies the message, not the payment|Because banks like generating references|It doesn't; it's fixed end to end}}
{{check:A bank three hops away is asked to locate a payment. Which reference actually helps?|The UETR, because it is globally unique across the whole chain|The sender's MsgId from the first hop|The creditor's account number}}
