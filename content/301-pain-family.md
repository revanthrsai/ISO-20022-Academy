---
title: "The pain Family: How You Tell Your Bank to Pay"
level: 300
category: Message Deep Dives
summary: "Before any bank talks to any other bank, a customer talks to their own bank. The pain family is that conversation — the instruction that starts a payment and the receipt that answers it."
minutes: 9
updated: 2026-06-29
tags: [pain, initiation, pain.001, pain.002, customer-to-bank]
related: [301-pain-family, 302-pacs-family, 302-pain-001, 103-payment-lifecycle]
earnedSkill: "Explain what the pain family is for, name pain.001 and pain.002 and what each does, walk the three nested levels of a pain.001, and pinpoint the moment your bank stops speaking pain and starts speaking pacs."
num: 301
status: published
---

> **The problem first.** Bob is standing in his kitchen in Dubai with his phone, trying to get ₹33,000 to Sweety in Bangalore. He doesn't have her bank's number. He doesn't speak to her bank. He certainly isn't going to fill in a wire by hand. All he can actually do is tell *his own* bank what he wants. So what does that "telling" look like once it leaves his banking app — and why is it completely different from what his bank sends onward?

The answer is the **pain family** — short for **Payments Initiation**. These are the messages a *customer* uses to talk to *their own bank*. Nothing in this family ever travels between two banks. It is the conversation at the very start — and the very end — of a payment, on the customer's side of the counter.

If you remember one sentence from this whole level, make it this one: **pain is you talking to your bank; pacs is banks talking to each other.** Everything below hangs off that line.

## The purpose: the customer's side of the glass

A bank's payment engine can't act on "hey, send Sweety some money." It needs a precise, structured instruction it can validate, store, and execute without a human reading it. The pain family is that structured instruction — the standard way a person or a company hands a payment request to their bank.

It replaces a messy older world. Corporates used to send the legacy SWIFT **MT101** request, retail customers used a hundred different proprietary file formats, and every bank parsed them differently. The pain family gives everyone — a retail app, a corporate ERP, a payroll system — one shared shape to fill in.

Crucially, **no money moves inside a pain message.** It is a request and its receipt. The actual movement happens later, in the pacs family, once your bank takes over.

## Who's in the family

Four messages, but two of them carry almost all the weight:

- **pain.001 — Customer Credit Transfer Initiation.** "Please pay these people." The request itself. This is the one you'll meet most.
- **pain.002 — Customer Payment Status Report.** The bank's answer: accepted, rejected, or pending — and, if it failed, exactly which transaction and why. The receipt, not the money.
- **pain.007 — Customer Payment Reversal.** "Undo that one" — a customer-initiated reversal of a previously sent instruction.
- **pain.008 — Customer Direct Debit Initiation.** The mirror image of pain.001: instead of *pushing* money out, it asks the bank to *pull* money in (a collection).

For the rest of this article we'll follow the spine — pain.001 out, pain.002 back — because once you understand those two, the others are variations on the same idea.

## The lifecycle: request, answer, handoff

A pain message never lives alone. It's one beat in a short loop:

1. **Bob's app builds a pain.001** and sends it to Bob's bank. (For a company, an ERP or payroll system builds it instead — often with hundreds of payments in one file.)
2. **Bob's bank validates it** — does the account exist, are the funds there, is the format clean, does the payee detail look sane?
3. **Bob's bank replies with a pain.002** status report: accepted, rejected, or pending, with a reason code if something failed. This is the moment Bob's app shows a tick or an error — and still, no money has moved.
4. **For every accepted instruction, Bob's bank becomes the *debtor agent*** and turns the pain.001 into a **pacs.008** — the bank-to-bank message that actually moves the money toward Sweety's bank. *This is where the pain family ends and the pacs family begins.*

{{embed:explorer:PAIN.001|Open pain.001 in the Message Explorer}}

## The three levels of a pain.001

A pain.001 nests three levels, outermost to innermost. Learn this shape once and you'll recognise it in every initiation file you ever open:

- **Group Header (`GrpHdr`)** — file-wide facts: a message id, a timestamp, the number of transactions, a control sum. One per file.
- **Payment Information (`PmtInf`)** — one block per shared set of parameters: the debtor (Bob), his account, the execution date, the payment method. A single file can carry many `PmtInf` blocks.
- **Credit Transfer Transaction (`CdtTrfTxInf`)** — one block per actual payee: Sweety, her account, the amount, the reference.

That nesting is exactly what makes payroll efficient. A company's payroll file is **one** Group Header, **one** Payment Information block (same debtor, same debit date, same account), and **four hundred** Credit Transfer Transaction blocks — one per employee. The shared facts are stated once; only the payee changes.

## A sample pain.001

Here is Bob's instruction, trimmed to the essentials:

```xml
<CstmrCdtTrfInitn>
  <GrpHdr>
    <MsgId>BOBAPP-20260629-0001</MsgId>
    <CreDtTm>2026-06-29T08:15:00+04:00</CreDtTm>
    <NbOfTxs>1</NbOfTxs>
    <CtrlSum>33000.00</CtrlSum>
    <InitgPty><Nm>Bob Marsh</Nm></InitgPty>
  </GrpHdr>
  <PmtInf>
    <PmtInfId>BOB-RUN-0042</PmtInfId>
    <PmtMtd>TRF</PmtMtd>
    <ReqdExctnDt>2026-06-29</ReqdExctnDt>
    <Dbtr><Nm>Bob Marsh</Nm></Dbtr>
    <DbtrAcct><Id><IBAN>AE070331234567890123456</IBAN></Id></DbtrAcct>
    <DbtrAgt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></DbtrAgt>
    <CdtTrfTxInf>
      <PmtId><EndToEndId>BOB-INV0042</EndToEndId></PmtId>
      <Amt><InstdAmt Ccy="INR">33000.00</InstdAmt></Amt>
      <Cdtr><Nm>Sweety Rao</Nm></Cdtr>
      <CdtrAgt><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></CdtrAgt>
      <RmtInf><Ustrd>Invoice 0042 — June freelance</Ustrd></RmtInf>
    </CdtTrfTxInf>
  </PmtInf>
</CstmrCdtTrfInitn>
```

The cast is one you already know from Level 100: Bob is the **Debtor**, Sweety is the **Creditor**, and the amount and reference are stated here verbatim. Notice `EndToEndId` is `BOB-INV0042` — Bob's own reference for this payment. When his bank emits the pacs.008 next, it carries that *same* `EndToEndId` untouched. That is how Sweety's "Invoice 0042" survives every hop of the journey and shows up on her statement.

## Where it hands off

The pain family does the quiet, important work at the edges — taking the request in, sending the receipt back. But the second Bob's bank accepts that instruction, it stops being a messenger for Bob and becomes a *bank with a job to do*: get money to another bank. For that it speaks a different language entirely — **pacs**.

{{embed:explorer:PAIN.002|See the bank's reply, pain.002, in the Explorer}}

## So, what can you now do?

You can explain what the pain family is for, name pain.001 and pain.002 and say what each one does, walk the three nested levels of a pain.001 from Group Header down to the transaction, explain why payroll fits so neatly into that nesting, and pinpoint the exact moment your bank stops speaking "pain" and starts speaking "pacs."

{{check:Who talks to whom in the pain family?|A customer and their own bank|Two banks settling with each other|A central bank and a clearing house}}

{{check:Bob instructs his bank to pay Sweety. Which message carries that instruction?|pain.001 — the credit transfer initiation|pacs.008 — the interbank credit transfer|camt.053 — the end-of-day statement}}
