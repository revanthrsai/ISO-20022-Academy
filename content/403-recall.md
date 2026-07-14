---
title: "Recall: Asking for Your Money Back"
level: 400
category: Exceptions
summary: "A return is the receiver volunteering money back. A recall is the sender realising its own mistake and politely asking for it: a request that can be granted or refused, never assumed."
minutes: 8
updated: 2026-07-13
tags: [recall, cancellation, camt.056, camt.029, R-transactions]
related: [402-return, 401-camt-056-cancellation, 404-reversal, 405-investigations]
earnedSkill: "Explain why a recall is a request and not a guaranteed return, name the message that asks (camt.056) and the one that answers (camt.029), describe how a granted recall becomes a pacs.004 return, and tell a recall from a return and a reversal."
num: 403
status: published
---

> **The problem first.** Bob's payment to Sweety settled perfectly. The money's in the right account, the right person has it. The trouble is Bob's bank sent it **twice**. The duplicate settled too. Now Bob's bank is short ₹33,000 — and that money is sitting safely in Sweety's account, where it has every right to be.

Last chapter, a return was the *receiving* bank's call. A recall flips who's at fault — and that one flip changes what's even possible.

## Can Bob's bank demand it back?

{{think}}
Here's the asymmetry: the duplicate settled *correctly*. It went exactly where Bob's bank instructed. Sweety's bank did nothing wrong and has no reason to give the money up. Bob's bank made the mistake.

Can Bob's bank *demand* the money back? If not, what's its only move — and what does that imply about the outcome?
{{reveal}}
It can't demand anything. The money is legitimately Sweety's bank's to hold. All Bob's bank can do is **ask** — a structured request (a **camt.056**) that the receiver is free to refuse.

That single word — *ask* — is the whole chapter. A recall is a **request**, and a request can be **refused**.
{{/think}}

## What triggers a recall

A recall is raised by the *originating* side after settlement, because something the sender did was wrong: a duplicate, a wrong beneficiary (a technical error in the instruction), suspected fraud (freeze and return), or the wrong amount. The common thread: in every case the receiving bank executed the payment *correctly*. There's no error on their side to trigger a return. The only way to get the money back is to make the case and hope the beneficiary agrees.

## The two-message conversation

A recall is one message to ask and one to answer: **camt.056 (FI to FI Payment Cancellation Request)** — the polite "please cancel / give it back," carrying the reason (`DUPL`, `FRAD`, `CUST`…) and the original references — and **camt.029 (Resolution of Investigation)** — the receiving bank's answer, accepted or rejected. A camt.056 by itself changes nothing; no money moves on the request. It's the question; the camt.029 is the answer; and only a positive answer leads to money moving.

The flow: Bob's bank spots the duplicate and sends a **camt.056** (*please cancel `BOB-INV0042`, reason `DUPL`*); Sweety's bank investigates (is the money still there? for a consumer account, will Sweety consent?); it answers with a **camt.029** — **accepted**, in which case it performs an actual **pacs.004 return** to send the funds back (*the recall request becomes a return*), or **rejected**, with a reason (funds withdrawn, no consent), in which case Bob's bank gets nothing back and must pursue it another way.

```xml
<FIToFIPmtCxlReq>
  <Assgnmt>
    <Id>EBILAEAD-CXL-0042</Id>
    <CreDtTm>2026-06-29T12:00:00+04:00</CreDtTm>
  </Assgnmt>
  <Undrlyg>
    <TxInf>
      <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>
      <OrgnlUETR>eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4</OrgnlUETR>
      <OrgnlIntrBkSttlmAmt Ccy="INR">33000.00</OrgnlIntrBkSttlmAmt>
      <CxlRsnInf>
        <Rsn><Cd>DUPL</Cd></Rsn>
        <AddtlInf>Duplicate instruction sent in error</AddtlInf>
      </CxlRsnInf>
    </TxInf>
  </Undrlyg>
</FIToFIPmtCxlReq>
```

This is a *request* about a payment, not a payment: an original amount is referenced, but no funds move yet. The money only moves if the camt.029 comes back positive and a pacs.004 follows. (The camt.056 gets its own field-by-field read in {{link:article:401-camt-056-cancellation|the camt.056 deep dive}}.)

## Return, recall, reversal: who acts, and is it optional?

{{think}}
Three exceptions all touch *settled* money: return, recall, and reversal. Keep them straight by two questions — *who* acts, and is it *optional* (can the answer be no)?
{{reveal}}
- **Return (pacs.004)** — the *receiver* acts, because it can't apply the funds. Money comes back automatically. Not optional; the receiver just does it.
- **Recall (camt.056 → camt.029)** — the *sender* asks, because it erred. Money comes back **only if granted**. Optional — the receiver can refuse.
- **Reversal (pacs.007)** — the *originator* undoes a payment it had the right to undo (a direct debit it collected). No permission needed. Not optional; it's by right.

A recall is the only one of the three where the answer can simply be "no." That's the whole personality of it.
{{/think}}

{{aside:model|The mental model}}
**A recall is a request, and a request can be refused.** The sender erred, but the money landed correctly, so the sender can only *ask* (camt.056). The receiver *answers* (camt.029). Money moves only if the answer is yes — then a pacs.004 does the returning.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Model the recall as a case, not a fire-and-forget: correlate camt.056 → camt.029 (→ any pacs.004) on the `Case` id, and tie them all to the payment via `OrgnlEndToEndId`/`OrgnlUETR`. For consumer beneficiaries, the receiving bank usually needs the customer's consent to debit them — which is exactly why the answer isn't guaranteed and your flow must handle a decline.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Assuming a recall gets the money back.** It's a request; build for the "no" (camt.029 rejected) as a first-class outcome, not an edge case.
- **Treating camt.056 as a transfer.** No money moves on it — only a granted recall (→ pacs.004) returns funds.
- **Losing the thread.** Without the `Case`/`Orgnl*` references, the answer can't be matched to the request or the payment.
{{/aside}}

{{aside:map|The map}}
The sender's after-settlement ask:

- The receiver's version (no asking) → {{link:article:402-return|return}}.
- The by-right undo (no asking either) → {{link:article:404-reversal|reversal}}.
- The request field by field → {{link:article:401-camt-056-cancellation|camt.056}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Recall** = the *sender* asks for settled money back after *its own* mistake. A request, refusable.
- **Messages:** `camt.056` asks → `camt.029` answers; a granted recall triggers a `pacs.004` return.
- **No money moves on the request** — only on a positive resolution.
- **Reasons:** `DUPL`, `FRAD`, `CUST`, wrong amount, wrong beneficiary.
- **Return vs recall vs reversal:** receiver acts / sender asks / originator undoes by right.
{{/aside}}

## So what can you do now?

You can explain why a recall is a request and not a guaranteed return, name the message that asks (`camt.056`) and the one that answers (`camt.029`), describe how a *granted* recall becomes a real `pacs.004` return while a *refused* one returns nothing, and tell a recall from a return (receiver-driven, automatic) and a reversal (originator-driven, by right).

{{check:Who starts a recall?|The sending side, asking for its payment back — often for fraud or a duplicate|The receiver, refusing the funds|The clearing house, on a schedule}}

{{check:Why can a recall be refused?|The money now sits in the receiver's account — giving it back needs their consent|Recalls are legally binding everywhere|The format does not allow a negative answer}}
