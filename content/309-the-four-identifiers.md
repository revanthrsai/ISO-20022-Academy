---
title: "The Four Identifiers: MsgId, EndToEndId, TxId & UETR"
level: 300
category: Message Deep Dives
num: 309
summary: "Four references ride every payment, and mixing them up is the most common confusion in the field. Four IDs, four jobs, four lifespans. Sort them once and investigations get dramatically shorter."
minutes: 6
updated: 2026-07-13
tags: [msgid, endtoendid, txid, uetr, identifiers, tracing]
related: [306-anatomy-of-a-message, 302-pain-001, 301-pacs-008]
earnedSkill: "Name the four identifiers, state each one's owner, scope, and lifespan without hesitating, and pick the right one to quote in any operational situation."
status: published
---

> **Which reference do you want?** A treasurer calls her bank about a missing payment. "What's the reference?" She reads the one from her ERP — wrong one, it never left her building. The desk quotes theirs back — means nothing to her system. Eleven minutes of two professionals reading numbers at each other before someone asks for the one reference every bank in the chain can actually look up.

Four identifiers ride every payment, and they look identical — strings of letters and digits sitting near each other in the same block. The cure isn't to memorise which is which. It's to stop reading them as strings and derive what *jobs* a payment actually needs done.

## What jobs does a payment need its references to do?

{{think}}
Forget the names for a second. A payment travels from a customer, through several banks, to another customer. Along the way, different people need to point at it for different reasons.

List the *distinct* jobs a set of references has to cover across that whole journey. Don't name fields — name jobs.
{{reveal}}
Four jobs, and they're genuinely different:

1. **Catch a duplicate on one hop.** If the same message arrives twice on a link, the second is a resend, not a second payment. → **`MsgId`**, set fresh by whoever creates each message. Lifespan: one hop.
2. **Let the customer track their own payment, end to end.** A thread the customer sets and recognises, that no bank may rewrite. → **`EndToEndId`**, set at initiation, carried untouched to the creditor's statement. Lifespan: the whole journey.
3. **Let the banks identify the interbank transaction.** The banks' own handle for clearing, settlement, and any later return that must point back. → **`TxId`**, set by the first instructing agent. Lifespan: the interbank leg.
4. **Let anyone, anywhere, locate the payment.** A *globally* unique key so a tracker can show one payment's position across many banks. → **`UETR`**, a UUID stamped at entry, never changed. Lifespan: the whole interbank journey.

Four jobs, four identifiers. Read the job, not the string.
{{/think}}

{{flow:Four threads through one payment|Customer ~ sets EndToEndId in the pain.001|-> first bank|Debtor agent ~ stamps TxId and UETR, new MsgId|-> each hop|Intermediaries ~ new MsgId every hop, other three untouched|-> arrival|Creditor's statement ~ EndToEndId surfaces back to a human}}

## A pilgrim and her papers

A picture that makes them un-confusable: a pilgrim walks a long route carrying one **passport** (UETR — globally checkable, never reissued) and wearing one **name tag** written by her family (EndToEndId — how the people at home know her). The hostels log her in their own **guest registers** (TxId — the institutions' shared record), and every leg has its own **bus ticket** (MsgId — valid for that ride only, new one each time).

Family asking about her? Name tag. Two hostels reconciling? Register. Anyone anywhere locating her right now? Passport. Proving she didn't board the same bus twice? Ticket.

## Which one wins the phone call?

{{think}}
Back to the eleven-minute call. The treasurer, three hops upstream, gives the bank the `MsgId` from her first hop and asks them to find the payment. The bank can't. Why not — and what should she have quoted?
{{reveal}}
An `MsgId` identifies *a message on one link*. The bank three hops away never carried that message — it carried a *different* message, with its own `MsgId`, that happens to move the same payment. Quoting it is handing over a bus ticket from a bus they were never on.

The only reference that works across the whole chain is the one built to be globally unique: the **UETR** (the passport). Quote that, and any bank anywhere can look the payment up. Give the customer their **EndToEndId** back in the answer too, because that's the word *her* system recognises.
{{/think}}

Operationally: customer asks "where's my payment?" → look up **UETR** (hand back their **EndToEndId**). Reconciling a statement line to an instruction → **EndToEndId**. Returning or recalling a settled payment → the R-message quotes the original's **TxId** and **UETR** (as `OrgnlTxId`, `OrgnlUETR`). Suspecting a duplicate file → **MsgId**.

{{aside:model|The mental model}}
**Four IDs, four jobs: the envelope, the customer's thread, the banks' record, the global passport.** MsgId per hop (duplicate-catch), EndToEndId whole-journey customer thread (never rewritten), TxId the banks' interbank handle, UETR the globally-unique passport the whole industry can look up. Say the job, not the string.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Three of the four are *born* in specific places: the customer sets `EndToEndId` in the pain.001; the first agent stamps `TxId` and `UETR` as the payment enters the interbank space; `MsgId` is minted anew for every message on every hop. Open a live pacs.008 in the Playground and you can watch all four ride together — the UETR the one that never changes, the MsgId the one that always does.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **EndToEndId rewritten mid-chain.** A legacy system swaps the customer's reference for its own. The payment settles fine; reconciliation at the far end dies. The one rule: it travels untouched.
- **`NOTPROVIDED`.** When no EndToEndId is supplied, some systems fill in the literal word. Legal, and miserable — thousands of payments "identified" by the same non-identifier.
- **MsgId reused.** A sequence generator resets after a crash, yesterday's MsgIds reappear today, receivers reject them as duplicates, good payments bounce.
- **Investigating with the wrong id.** Quoting a MsgId to a bank three hops away is a bus ticket from a bus they were never on. Cross-chain questions need the UETR.
{{/aside}}

{{aside:map|The map}}
Where the identifiers live and travel:

- The block they sit in → {{link:article:306-anatomy-of-a-message|the three-block skeleton}}.
- Where three of them are born → {{link:article:302-pain-001|pain.001, field by field}}.
- Where all four ride between banks → {{link:article:301-pacs-008|pacs.008}}.
{{/aside}}

{{aside:ref|Reference card}}
- **MsgId** — the envelope. Per message, per hop. Job: duplicate detection.
- **EndToEndId** — the customer's thread. Set at initiation, never rewritten, surfaces on the statement.
- **TxId** — the banks' record. Set by the first agent, identifies the interbank transaction.
- **UETR** — the global passport. A UUID stamped at entry, globally unique, what a tracker follows.
- **Rule of thumb:** cross-chain question → UETR; customer reconciliation → EndToEndId; duplicate check → MsgId; return/recall → OrgnlTxId + OrgnlUETR.
{{/aside}}

{{embed:article:302-pain-001|Where three of the four are born: pain.001 field by field}}
{{embed:explorer:PACS.008|See all four riding a live pacs.008}}

{{check:Which identifier may never be altered by any agent in the chain?|EndToEndId, the customer's reference, plus the UETR stamped at entry|MsgId, which must stay constant across hops|Whichever one is longest}}
{{check:Why does MsgId change at every hop?|Each hop creates a new message, and MsgId identifies the message, not the payment|Because banks like generating references|It doesn't; it's fixed end to end}}
{{check:A bank three hops away is asked to locate a payment. Which reference actually helps?|The UETR, because it is globally unique across the whole chain|The sender's MsgId from the first hop|The creditor's account number}}
