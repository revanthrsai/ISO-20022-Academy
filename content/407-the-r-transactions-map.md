---
title: "The R-transactions: One Map of Every Way a Payment Fails"
level: 400
category: Exceptions
num: 407
summary: "Reject, return, recall, reversal, refusal: five R-words that sound interchangeable and absolutely aren't. Two questions sort every failure into its place, and once you have the map, you'll never confuse them again."
minutes: 6
updated: 2026-07-13
tags: [r-transactions, reject, return, recall, reversal, exceptions]
related: [401-reject, 402-return, 403-recall, 404-reversal]
earnedSkill: "Classify any failed payment with two questions (settled yet? who acts?), name the message each R-transaction uses, and see the whole exceptions shelf as one system instead of five separate stories."
status: published
---

> **Five words, one angry customer.** A payment has gone wrong, and on the ops floor five words start flying: reject, return, recall, reversal, refusal. They sound like synonyms. They are not. Each names a different failure, at a different moment, by a different party, fixed by a different message — and the wrong word on a bank-to-bank call sends the other side hunting in the wrong system.

This shelf walked you through the exceptions one at a time. This is the map you'd tape to the wall. And you can derive it, because it needs only the smallest possible set of questions.

## Find the two questions

{{think}}
Five R-words, and memorising five definitions is how you mix them up under pressure. Instead, find the *fewest questions* that place any failed payment into exactly one bucket.

What are they? (Hint: think about what changes the *cost* of a fix, and about *who* is even allowed to act.)
{{reveal}}
Two questions do it:

1. **Has the payment settled yet?** Before settlement, no money moved — a failure is just *information*. After settlement, money sits in the wrong place — fixing it means *moving money again*.
2. **Who acts: the receiver, the sender, or the originator?** The party entitled to act determines which R-transaction fires and what it may assume.

Two questions, five residents. That's the whole map.
{{/think}}

## The five residents

- **Reject — before settlement, receiver refuses.** Any party says no before value moves (bad account, failed screening, no funds). A status (`RJCT` in a pacs.002/pain.002). Nothing to give back.
- **Refusal — before settlement, the debtor's side declines a pull.** The niche cousin of the reject, in the direct-debit world: the debtor (or their bank) declines a collection before it settles. Same "no money moved," different initiator.
- **Return — after settlement, receiver sends it back.** Funds arrived but can't be applied. The receiving bank acts on its own with a `pacs.004`. Nobody asked.
- **Recall — after settlement, sender asks.** The sender erred and the money landed correctly. It can only *request*: `camt.056` asks, `camt.029` answers, and only a yes produces the `pacs.004`.
- **Reversal — after settlement, originator undoes by right.** The direct-debit mirror-image: the collector reverses its own pull with a `pacs.007`. No permission needed.

{{flow:Two questions sort everything|A payment fails ~ something is wrong|-> settled yet?|No ~ reject or refusal: information only, no money to move|-> yes, settled|Who acts? ~ receiver returns · sender asks (recall) · originator reverses|-> resolution|pacs.004 or pacs.007 ~ money physically travels back}}

## The line that splits the map

Question one does most of the work. Settlement is the moment a payment stops being a promise and becomes a fact, and the map splits exactly there. Left of the line, exceptions are cheap: a status message, a resubmission, done. Right of the line, every fix is itself a payment — its own settlement, its own references back to the original (`OrgnlTxId`, `OrgnlUETR`), its own chance to fail. The cost of fixing a payment is decided by which side of settlement you're standing on.

## Why can a recall be refused but a return can't?

{{think}}
Return and recall both happen after settlement, and both can put money back. Yet a return just happens, while a recall is a request the other side can refuse. What deeper thing does question two ("who acts?") actually encode, that explains the difference?
{{reveal}}
**Entitlement.** The *receiver* returns funds it can't apply — that money was never going to stay with it, so it needs no one's permission. The *sender* recalls money that's now sitting *legitimately* in someone else's account — so it must ask. And the *originator* reverses by right because a pull was theirs to make and theirs to unmake.

"Who acts" is never arbitrary; it tracks *who is entitled to move the money without permission.* That's why recall is the only one where the answer can be "no."
{{/think}}

On a live call, the map answers in ten seconds: *"beneficiary bank says the account is closed"* → settled, receiver acts → expect a `pacs.004`, no request. *"We paid the same invoice twice"* → settled, sender erred → send a `camt.056` recall, prepare for a no. *"The debit run charged wrong amounts"* → settled, originator's own pull → `pacs.007` reversal, no permission. *"It bounced before value date"* → not settled → read the reason on the `pacs.002` and resubmit.

{{aside:model|The mental model}}
**Settled or not; asking or acting.** Two questions, five R-words, one map. Before settlement → reject/refusal (information only). After settlement → return (receiver acts), recall (sender asks), reversal (originator undoes by right). Who acts tracks who's entitled to move money without permission.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Everything right of the settlement line is *itself a payment*: a return (`pacs.004`) and a reversal (`pacs.007`) settle, carry `Orgnl*` references, and can themselves fail. So model R-transactions as payments with a back-reference, not as flags on the original — and remember a return can be returned (wrong account on the way home).
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Recall treated as a right.** Booking incoming funds before the `camt.029` says yes — then the answer is no and the books are wrong twice.
- **A return without the original references.** A `pacs.004` with a missing `OrgnlUETR` arrives as an unidentifiable credit — money with no story, straight into an investigation.
- **Refusal and reject conflated in reporting.** Lumping them hides whether problems live debtor-side or in the chain.
- **Fixing the fix.** R-transactions are payments too; teams that forget get lost when a return itself bounces.
{{/aside}}

{{aside:map|The map}}
The whole shelf, on two axes:

- Region one, in full → {{link:article:401-reject|reject}}.
- The one that can be refused → {{link:article:403-recall|recall}}.
- The four letters that explain each → {{link:article:408-reason-codes|reason codes}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Two questions:** settled yet? · who acts (receiver / sender / originator)?
- **Before settlement:** reject (receiver refuses) · refusal (debtor declines a pull). Information only.
- **After settlement:** return (`pacs.004`, receiver) · recall (`camt.056`→`camt.029`, sender asks) · reversal (`pacs.007`, originator by right).
- **The split is settlement;** the "who" is entitlement to move money without permission.
- **Only reject/refusal move no money;** returns and reversals settle.
{{/aside}}

{{embed:article:401-reject|Region one, in full: the reject}}
{{embed:article:403-recall|The one that can be refused: the recall}}

{{check:What two questions locate any R-transaction on the map?|Has it settled yet, and who acts: receiver, sender, or originator|What currency and which country|Which network carried it and how large it was}}
{{check:Why is a recall only a request while a return is not?|The recalled money sits legitimately in an account, so the sender must ask; a return moves funds the receiver cannot apply anyway|Recalls are newer than returns|Because camt messages are always optional}}
{{check:Which R-transactions physically move money?|Return (pacs.004) and reversal (pacs.007), because they happen after settlement|Reject and refusal|All five of them}}
