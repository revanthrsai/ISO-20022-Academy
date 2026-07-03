---
title: "Reversal: Undoing a Payment You Had the Right to Make"
level: 400
category: Exceptions
summary: "A reversal is neither a request nor a failure. It's the originator undoing its own settled payment by right, most often a direct debit it should never have collected."
minutes: 7
updated: 2026-06-29
tags: [reversal, pacs.007, direct debit, pain.007, R-transactions]
related: [404-reversal, 403-recall, 402-return, 302-pacs-family]
earnedSkill: "Explain what a reversal is and how it differs from a recall, name the message that performs it (pacs.007, with pain.007 on the customer side), describe why a reversal needs no permission, and connect reversals to the direct-debit world where they live."
num: 404
status: published
---

> **₹20,000 instead of ₹2,000.** Sweety runs a gym and collects ₹2,000 a month from members by direct debit: she *pulls* the money rather than waiting for them to push it. This month a glitch charged Bob ₹20,000 instead of ₹2,000. The money already left Bob's account and settled in Sweety's. Bob didn't make a mistake; Sweety did, and she pulled funds she had every right to pull, just the wrong amount. She doesn't need to *ask* anyone to fix it. How does the party who *collected* a payment cleanly undo its own settled collection?

You've now seen three exceptions. A **reject** stops a payment before settlement. A **return** is the receiver sending settled money back because it can't apply it. A **recall** is the sender *asking* for settled money back after its own mistake. A **reversal** is the fourth and most often misunderstood: the **originator undoing its own settled payment, by right, not by request.**

The key difference from a recall: a recall is a **question** the receiver can refuse. A reversal is a **statement**: the party that initiated the payment is entitled to reverse it, and does.

## Where reversals live: the pull world

Reversals almost always belong to **direct debits**, payments where the *creditor pulls* money rather than the debtor pushing it. (You met the puller, pacs.003, in the pacs family.) Pull payments carry a built-in risk the push world doesn't: the person taking the money decides the amount, so they're the one who can get it wrong: a duplicate collection, the wrong figure, a debit run that fired twice.

When that happens, the collector, who initiated the whole thing, is the natural party to put it right. They don't need the debtor's bank to volunteer a return, and they don't need to beg for a recall. They simply **reverse** their own collection.

## What triggers a reversal

- A **direct debit collected in error**: wrong amount, wrong day, duplicate run.
- A **mandate problem** discovered after collection (the authorisation was invalid).
- A **technical double-collection** the originator must unwind.

In each case the *originator of the original payment* is the one acting, and the original payment was theirs to make.

## Which messages perform a reversal

- **pacs.007, FI to FI Payment Reversal.** The interbank message that reverses a previously-settled payment between banks, carrying a reversal reason and references to the original. It sends the money back the way it came, but on the originator's own authority.
- **pain.007, Customer Payment Reversal.** The customer-side equivalent: the creditor's system telling its bank to reverse a collection it initiated.

A pacs.007 *moves money* (like a pacs.004 return), but the trigger is different: a return answers a delivery failure on the receiving side, while a reversal answers a mistake on the **originating** side, with no permission needed.

## The resolution flow

1. **Sweety's system collected** ₹20,000 from Bob by direct debit; it settled.
2. **Sweety's bank spots the error** (or Bob complains and the scheme rules kick in).
3. **Sweety's bank originates a pacs.007** reversing the original collection, with a reversal reason (e.g. wrong amount, duplicate).
4. **The reversal settles back** to Bob's bank, which **re-credits Bob**. The original collection and its reversal both reference the same payment, so the two cancel out cleanly on everyone's books.

```xml
<FIToFIPmtRvsl>
  <GrpHdr>
    <MsgId>HDFCINBB-RVS-7781</MsgId>
    <CreDtTm>2026-06-29T14:20:00+05:30</CreDtTm>
    <NbOfTxs>1</NbOfTxs>
  </GrpHdr>
  <TxInf>
    <RvslId>HDFCINBB-RVS-7781-01</RvslId>
    <OrgnlEndToEndId>GYM-DD-2026-06</OrgnlEndToEndId>
    <OrgnlUETR>9f1c2a44-77de-4c0b-8a2e-5b3d6e9011aa</OrgnlUETR>
    <RvsdIntrBkSttlmAmt Ccy="INR">20000.00</RvsdIntrBkSttlmAmt>
    <RvslRsnInf>
      <Rsn><Cd>AM09</Cd></Rsn>
      <AddtlInf>Wrong amount collected, direct debit reversed</AddtlInf>
    </RvslRsnInf>
  </TxInf>
</FIToFIPmtRvsl>
```

Note the `RvsdIntrBkSttlmAmt`: like a return, a reversal carries a real amount, because money genuinely moves back. What it does *not* carry is any sense of asking permission: there is no resolution message to wait for, the way a recall waits on a camt.029.

## Reversal vs. recall: the one that trips everyone

Both happen after settlement; both are initiated by the *originating* side; both can put money back. The difference is **authority**:

- **Recall (camt.056 → camt.029)**: the sender *asks*. The receiver can say no. Money moves only if granted.
- **Reversal (pacs.007)**: the originator *acts*. No one is asked. The reversal stands on the originator's own right to undo what it initiated, which is why it lives in the direct-debit (pull) world, where the originator pulled the money in the first place.

Rule of thumb: if you **pushed** money to someone and want it back, you **recall** (and hope). If you **pulled** money and got it wrong, you **reverse** (because it was yours to pull).

## So, what can you now do?

You can explain what a reversal is, name the message that performs it (`pacs.007`, with `pain.007` on the customer side), describe why a reversal needs no permission while a recall does, connect reversals to the direct-debit world where the originator pulled the funds, and place all four Level 400 exceptions on one timeline: reject (before settlement), then return, recall, and reversal (all after).

{{check:What does a reversal fix?|The sender’s own mistake — such as a duplicate — by undoing a payment already made|The receiver’s wrong invoice number|A temporary network outage}}

{{check:Reversal vs return — the key difference?|A reversal starts from the sending side; a return comes from the receiving side|They are exactly the same thing|A return happens before settlement, a reversal never does}}
