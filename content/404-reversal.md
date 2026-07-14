---
title: "Reversal: Undoing a Payment You Had the Right to Make"
level: 400
category: Exceptions
summary: "A reversal is neither a request nor a failure. It's the originator undoing its own settled payment by right, most often a direct debit it should never have collected."
minutes: 7
updated: 2026-07-13
tags: [reversal, pacs.007, direct debit, pain.007, R-transactions]
related: [403-recall, 402-return, 302-pacs-family, 407-the-r-transactions-map]
earnedSkill: "Explain what a reversal is and how it differs from a recall, name the message that performs it (pacs.007, with pain.007 on the customer side), describe why a reversal needs no permission, and connect reversals to the direct-debit world where they live."
num: 404
status: published
---

> **₹20,000 instead of ₹2,000.** Sweety runs a gym and collects ₹2,000 a month from members by direct debit — she *pulls* the money rather than waiting for them to push it. This month a glitch charged Bob ₹20,000. The money already left Bob's account and settled in Sweety's. Bob didn't make a mistake; Sweety did — and she pulled funds she had every right to pull, just the wrong amount.

You've seen three exceptions. This is the fourth and most misunderstood — and the way to grasp it is to notice what's different the instant the *puller* is the one who erred.

## Does Sweety have to ask?

{{think}}
Sweety's gym initiated the collection — it *pulled* Bob's money, as its mandate lets it. The pull was legitimate; only the amount was wrong. Now she needs to put ₹18,000 back.

With a recall, the sender has to ask the receiver's permission. Does Sweety have to ask anyone here? What's structurally different about her situation?
{{reveal}}
No — she doesn't ask. *She* initiated the payment, so she has the *right* to undo it. A recall is a question because the sender pushed money into someone else's account and needs it back. But Sweety pulled money *out*, on her own authority, so undoing it is also on her own authority.

A reversal is a **statement, not a question**: the party that initiated the payment is entitled to reverse it, and does. No camt.029 to wait on, no "no" to fear.
{{/think}}

## Where reversals live: the pull world

Reversals almost always belong to **direct debits** — payments where the *creditor pulls* rather than the debtor pushing (you met the puller, pacs.003, in the pacs family). Pull payments carry a risk the push world doesn't: the person *taking* the money decides the amount, so they're the one who can get it wrong — a duplicate collection, the wrong figure, a debit run that fired twice. When that happens, the collector who initiated it is the natural party to put it right. No volunteered return from the debtor's bank, no begging for a recall — they simply **reverse** their own collection. Triggers: a direct debit collected in error (wrong amount/day/duplicate), a mandate problem found after collection, a technical double-collection. In each, the *originator* of the original payment acts, and the original payment was theirs to make.

## The messages, and the flow

**pacs.007 (FI to FI Payment Reversal)** reverses a previously-settled payment between banks, carrying a reversal reason and the original references; **pain.007 (Customer Payment Reversal)** is the customer-side equivalent (the creditor's system telling its bank to reverse a collection it initiated). A pacs.007 *moves money* like a pacs.004 return — but the trigger differs: a return answers a *delivery failure on the receiving side*, a reversal answers a *mistake on the originating side*, with no permission needed. The flow: Sweety's system collected ₹20,000 and it settled; her bank spots the error (or Bob complains and scheme rules kick in); her bank originates a **pacs.007** with a reversal reason; the reversal settles back to Bob's bank, which re-credits Bob; the original collection and its reversal reference the same payment, so they cancel out cleanly on everyone's books.

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

The `RvsdIntrBkSttlmAmt` says money genuinely moves back (like a return). What it does *not* carry is any sense of asking: there's no resolution message to wait for, the way a recall waits on a camt.029.

## Reversal vs recall: the one that trips everyone

{{think}}
Both happen after settlement, both are started by the originating side, both can put money back. So what's the *one* difference that decides which you use — and what's a rule of thumb to never mix them up?
{{reveal}}
**Authority.** A recall *asks* (the receiver can say no); a reversal *acts* (no one is asked), standing on the originator's right to undo what it initiated. That's why a reversal lives in the pull world — the originator pulled the money in the first place.

Rule of thumb: if you **pushed** money to someone and want it back, you **recall** (and hope). If you **pulled** money and got it wrong, you **reverse** (because it was yours to pull).
{{/think}}

{{aside:model|The mental model}}
**A reversal is the originator undoing its own settled payment, by right — not by request.** It lives in the pull (direct-debit) world, where the collector controlled the amount. `RvsdIntrBkSttlmAmt` shows money moving; the absence of any camt.029 shows no permission was needed.
{{/aside}}

{{aside:chair|From the engineer's chair}}
`pacs.007` (interbank) and `pain.007` (customer side) both reverse. It moves money like a `pacs.004`, but don't model it like a return: there's no request/response to correlate, no case to open — it's a unilateral undo tied to the original by `OrgnlEndToEndId`/`OrgnlUETR`. It belongs with the `pacs.003` direct-debit flow, so it usually shows up in pull, not push, processing.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Confusing reversal with recall.** Reversal = by right, pull world, no permission; recall = a request, push world, refusable. Route them differently.
- **Waiting for a resolution message.** There isn't one — a reversal isn't answered, it just settles back.
- **Reaching for a reversal on a push payment.** If you pushed the funds, you don't have the right to unilaterally reverse — that's a recall.
{{/aside}}

{{aside:map|The map}}
The by-right undo, alongside its cousins:

- The one you *ask* for → {{link:article:403-recall|recall}}.
- The receiver's version → {{link:article:402-return|return}}.
- All the R-transactions on one map → {{link:article:407-the-r-transactions-map|the R-transactions map}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Reversal** = the *originator* undoes its own settled payment, **by right**, no permission.
- **Messages:** `pacs.007` (interbank) · `pain.007` (customer side). Moves money; no resolution to wait on.
- **The tell:** `RvsdIntrBkSttlmAmt`, and the *absence* of a camt.029.
- **Lives in the pull world** (direct debits, pacs.003), where the collector set the amount.
- **Rule:** pushed and want it back → recall (ask). Pulled and got it wrong → reverse (by right).
{{/aside}}

## So what can you do now?

You can explain what a reversal is, name the message that performs it (`pacs.007`, with `pain.007` on the customer side), describe why a reversal needs no permission while a recall does, connect reversals to the direct-debit world where the originator pulled the funds, and place all four Level 400 exceptions on one timeline: reject (before settlement), then return, recall, and reversal (all after).

{{check:What does a reversal fix?|The sender's own mistake — such as a duplicate — by undoing a payment already made|The receiver's wrong invoice number|A temporary network outage}}

{{check:Reversal vs return — the key difference?|A reversal starts from the sending side; a return comes from the receiving side|They are exactly the same thing|A return happens before settlement, a reversal never does}}
