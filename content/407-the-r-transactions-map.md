---
title: "The R-transactions: One Map of Every Way a Payment Fails"
level: 400
num: 407
summary: "Reject, return, recall, reversal, refusal: five R-words that sound interchangeable and absolutely aren't. Two questions sort every failure into its place, and once you have the map, you'll never confuse them again."
minutes: 6
updated: 2026-07-04
tags: [r-transactions, reject, return, recall, reversal, exceptions]
related: [401-reject, 402-return, 403-recall, 404-reversal]
earnedSkill: "Classify any failed payment with two questions (settled yet? who acts?), name the message each R-transaction uses, and see the whole exceptions shelf as one system instead of five separate stories."
status: published
---

> **Five words, one angry customer.** A payment has gone wrong, and on the ops floor five words start flying: reject, return, recall, reversal, refusal. They sound like synonyms. They are not. Each one names a different failure, at a different moment, initiated by a different party, fixed by a different message, and using the wrong word on a bank-to-bank call sends the other side hunting in the wrong system. The industry even has a collective name for this family: the R-transactions. What single map sorts all of them?

This shelf has walked you through the exceptions one at a time. This article is the map you'd want taped to the wall: the frame the individual chapters hang on. And like every good map, it needs only two axes.

## The two questions

Every R-transaction is located by asking:

1. **Has the payment settled yet?** Before settlement, no money has moved, so a failure is just information. After settlement, money sits in the wrong place, so fixing it requires *moving money again*.
2. **Who acts: the receiver of the payment, or its sender?** The party that spots the problem determines which R-transaction fires and what it's allowed to assume.

Two questions, a two-by-two-ish map, five residents:

- **Reject: before settlement, receiver refuses.** Any party in the chain says no before value moves: bad account format, failed screening, no funds. Carried as a status (`RJCT` in a pacs.002 or pain.002). Nothing to give back, because nothing moved.
- **Refusal: before settlement, the debtor's side declines a pull.** The niche cousin of the reject, living in the direct-debit world: the debtor (or their bank) declines the collection *before* it settles. Same "no money moved" comfort, different initiator.
- **Return: after settlement, receiver sends it back.** The funds arrived but cannot be applied (account closed, mismatch). The receiving bank acts on its own and sends the money home in a pacs.004. Nobody asked; the receiver decides.
- **Recall: after settlement, sender asks.** The sending side made the mistake (duplicate, wrong beneficiary, fraud) and the money landed exactly where instructed. The sender can only *request*: a camt.056 asks, a camt.029 answers, and only a yes produces the pacs.004 that moves money back.
- **Reversal: after settlement, originator undoes by right.** The direct-debit mirror-image: the collector who pulled the funds reverses their own collection with a pacs.007. No permission needed, because the originator is correcting an instruction that was theirs to begin with.

{{flow:Two questions sort everything|A payment fails ~ something is wrong|-> settled yet?|No ~ reject or refusal: information only, no money to move|-> yes, settled|Who acts? ~ receiver returns · sender asks (recall) · originator reverses|-> resolution|pacs.004 or pacs.007 ~ money physically travels back}}

## The line that splits the map

Notice how much work question one does. Settlement is the moment a payment stops being a promise and becomes a fact, and the map splits exactly there. Left of the line, exceptions are cheap: a status message, a resubmission, done. Right of the line, every fix is itself a payment, with its own settlement, its own references pointing back at the original (`OrgnlTxId`, `OrgnlUETR`), and its own chance to fail. This is why the finality chapter of the Fundamentals matters so much here: **the cost of fixing a payment is determined by which side of settlement you're standing on.**

And notice what question two encodes: *entitlement*. The receiver returns because it holds funds it cannot apply. The sender must ask, because the money it wants back is sitting legitimately in someone's account. The originator reverses by right, because a pull was theirs to make and theirs to unmake. Who acts is never arbitrary; it tracks who is entitled to move the money without permission.

## Using the map on a live call

"The beneficiary bank says the account is closed" → settled, receiver acts → *expect a pacs.004 return, no request needed.*
"We paid the same invoice twice" → settled, sender erred → *send a camt.056 recall, prepare for a possible no.*
"The debit run charged the wrong amounts" → settled, originator's own pull → *pacs.007 reversal, no permission required.*
"It bounced before value date" → not settled → *read the reason code on the pacs.002 and resubmit.*

Ten seconds, every time. That is what the map is for.

## What breaks

- **Recall treated as a right.** An ops team "recalls" a payment and books the incoming funds before the camt.029 answer arrives. The answer is no. Now their books are wrong twice.
- **A return without the original references.** A pacs.004 whose `OrgnlUETR` is missing or mangled arrives as an unidentifiable credit: money with no story, feeding straight into an investigation.
- **Refusal and reject conflated in reporting.** Metrics that lump them together hide whether problems live on the debtor side or in the chain, and the fix lands in the wrong place.
- **Fixing the fix.** A return can itself be returned (wrong account on the way back). Teams that don't realize R-transactions are payments too get lost exactly here.

The phrase to keep: **settled or not; asking or acting.** Two questions, five R-words, one map, and every chapter in this shelf is now a region on it.

{{embed:article:401-reject|Region one, in full: the reject}}
{{embed:article:403-recall|The one that can be refused: the recall}}

{{check:What two questions locate any R-transaction on the map?|Has it settled yet, and who acts: receiver, sender, or originator|What currency and which country|Which network carried it and how large it was}}
{{check:Why is a recall only a request while a return is not?|The recalled money sits legitimately in an account, so the sender must ask; a return moves funds the receiver cannot apply anyway|Recalls are newer than returns|Because camt messages are always optional}}
{{check:Which R-transactions physically move money?|Return (pacs.004) and reversal (pacs.007), because they happen after settlement|Reject and refusal|All five of them}}
