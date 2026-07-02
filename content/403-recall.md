---
title: "Recall: Asking for Your Money Back"
level: 400
category: Exceptions
summary: "A return is the receiver volunteering money back. A recall is the sender realising its own mistake and politely asking for it — a request that can be granted or refused, never assumed."
minutes: 8
updated: 2026-06-29
tags: [recall, cancellation, camt.056, camt.029, R-transactions]
related: [403-recall, 402-return, 401-camt-056-cancellation, 405-investigations]
earnedSkill: "Explain why a recall is a request and not a guaranteed return, name the message that asks (camt.056) and the one that answers (camt.029), describe how a granted recall turns into an actual pacs.004 return, and tell a recall apart from a return and a reversal."
num: 403
status: published
---

> **The problem first.** Bob's payment to Sweety settled perfectly — the money is in the right account, the right person has it. The trouble is Bob's bank sent it **twice**. The duplicate also settled. Now Bob's bank is short ₹33,000 and the money is sitting safely in Sweety's account, where it has every right to be. Nobody at Sweety's end did anything wrong, so they won't send it back on their own. How does Bob's bank *ask* for a settled, perfectly-valid payment to be undone — knowing the answer might be no?

A **return** (last chapter) is the *receiving* bank's call: it can't apply the funds, so it sends them back. A **recall** flips who's at fault. Here the **sending** bank made the mistake — a duplicate, a wrong beneficiary, a fraud report — and the money landed exactly where it was told to. The receiver has no reason to give it up. So the sender can't *demand* the money back; it can only **ask**.

That single word — *ask* — is the whole chapter. A recall is a **request**, and a request can be **refused**.

## What triggers a recall

A recall is raised by the **originating side** after settlement, because something the sender did was wrong:

- A **duplicate** payment was sent.
- The payment went to the **wrong beneficiary** (technical error in the instruction).
- **Fraud or a scam** is suspected and the sender wants the funds frozen and returned.
- The wrong **amount** was sent.

Notice the common thread: in every case the receiving bank executed the payment **correctly**. There's no error on their side to trigger a return. The only way to get the money back is to make the case and hope the beneficiary agrees.

## Which messages carry a recall

A recall is a two-message conversation — one to ask, one to answer:

- **camt.056 — FI to FI Payment Cancellation Request.** The polite, structured "please cancel / give it back" message, carrying the reason (e.g. `DUPL` duplicate, `FRAD` fraud, `CUST` customer request) and references to the original payment.
- **camt.029 — Resolution of Investigation.** The receiving bank's answer: *accepted* or *rejected*, with its own reason. This is the message that closes the loop.

A camt.056 by itself changes nothing — no money moves on the request alone. It is a question. The camt.029 is the answer, and only a positive answer leads to money actually moving.

## The resolution flow

1. **Bob's bank spots the duplicate** and sends a **camt.056** to Sweety's bank: *please cancel `BOB-INV0042`, reason `DUPL`.*
2. **Sweety's bank investigates.** Is the money still there? Will Sweety consent? (For consumer accounts, the bank usually needs the customer's agreement to debit them.)
3. **Sweety's bank answers with a camt.029:**
   - **If accepted** — it agrees to give the money back, and then performs an actual **pacs.004 return** to physically send the funds to Bob's bank. *The recall request becomes a return.*
   - **If rejected** — it sends a camt.029 declining, with a reason (funds already withdrawn, customer refuses, no consent). Bob's bank gets nothing back and must pursue it another way.

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

This is a *request* about a payment, not a payment — there's an original amount referenced, but no funds are moving yet. The money only moves if the camt.029 comes back positive and a pacs.004 follows. The same `OrgnlEndToEndId` / `OrgnlUETR` tie the whole conversation to Bob's original instruction.

There's a full field-by-field deep dive on the cancellation request itself in the **camt.056** supplementary read, linked at the foot of this article.

## Recall vs. return vs. reversal

Keep the three settled-money exceptions straight by **who acts and whether it's optional**:

- **Return (pacs.004)** — the **receiver** acts, because it *can't apply* the funds. Money comes back automatically.
- **Recall (camt.056 → camt.029)** — the **sender** asks, because *it* erred. Money comes back **only if granted**, via a follow-on pacs.004.
- **Reversal (pacs.007)** — the **sender** undoes a payment it had the right to undo (typically a direct debit it collected). No permission needed — the next chapter.

A recall is the only one of the three where the answer can simply be "no."

## So, what can you now do?

You can explain why a recall is a request and not a guaranteed return, name the message that asks (`camt.056`) and the one that answers (`camt.029`), describe how a *granted* recall turns into a real `pacs.004` return while a *refused* one returns nothing, and tell a recall apart from a return (receiver-driven, automatic) and a reversal (sender-driven, by right).

{{check:Who starts a recall?|The sending side, asking for its payment back — often for fraud or a duplicate|The receiver, refusing the funds|The clearing house, on a schedule}}

{{check:Why can a recall be refused?|The money now sits in the receiver’s account — giving it back needs their consent|Recalls are legally binding everywhere|The format does not allow a negative answer}}
