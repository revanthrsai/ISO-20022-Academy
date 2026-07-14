---
title: "The pain Family: How You Tell Your Bank to Pay"
level: 300
category: Message Deep Dives
summary: "Before any bank talks to any other bank, a customer talks to their own bank. The pain family is that conversation: the instruction that starts a payment, and the receipt that answers it."
minutes: 9
updated: 2026-07-13
tags: [pain, initiation, pain.001, pain.002, customer-to-bank]
related: [302-pacs-family, 302-pain-001, 306-anatomy-of-a-message, 103-payment-lifecycle]
earnedSkill: "Explain what the pain family is for, name pain.001 and pain.002 and what each does, walk the three nested levels of a pain.001, and pinpoint the moment your bank stops speaking pain and starts speaking pacs."
num: 301
status: published
---

> **The problem first.** Bob is in his kitchen in Dubai with his phone, trying to get ₹33,000 to Sweety in Bangalore. He doesn't have her bank's number. He doesn't speak to her bank. He's certainly not filling in a wire by hand. All he can actually do is tell *his own* bank what he wants.

This is the first message family in the shelf, and the cleanest way in is that constraint Bob is stuck with. Work out what it forces, and you've worked out what the pain family is.

## What can Bob actually produce?

{{think}}
Bob can't reach Sweety's bank. He can't reach the network. The only party in the entire payments world he can talk to is his own bank, through his app.

So: what's the one thing Bob can actually create here? And why must it be different from whatever his bank sends onward to move the money?
{{reveal}}
All Bob can produce is a *structured instruction to his own bank* — "please pay Sweety ₹33,000, here's her detail, here's my reference." That's the **pain family** (Payments Initiation): the messages a customer uses to talk to their own bank. No money moves inside it; it's a request, and later a receipt.

It has to differ from what the bank sends onward because Bob's message is *customer-to-bank*, while moving the money is *bank-to-bank* — a different audience, different rules, a different family (pacs). His bank translates one into the other.
{{/think}}

If you keep one sentence from this whole level, keep this: **pain is you talking to your bank; pacs is banks talking to each other.**

## The customer's side of the glass

A bank's payment engine can't act on "hey, send Sweety some money." It needs a precise, structured instruction it can validate, store, and execute without a human reading it. The pain family is that instruction — one shared shape for everyone, from a retail app to a corporate ERP to a payroll system. It replaced a messy world: corporates sent the legacy MT101, retail used a hundred proprietary formats, and every bank parsed them differently.

The family is four messages, two of which carry almost all the weight:

- **pain.001 — Customer Credit Transfer Initiation.** "Please pay these people." The request. The one you'll meet most.
- **pain.002 — Customer Payment Status Report.** The bank's answer: accepted, rejected, or pending, and if it failed, which transaction and why. The receipt, not the money.
- **pain.007 — Customer Payment Reversal.** "Undo that one."
- **pain.008 — Customer Direct Debit Initiation.** The mirror image: instead of *pushing* money out, it asks the bank to *pull* money in.

## The lifecycle: request, answer, handoff

A pain message never lives alone — it's one beat in a short loop:

1. **Bob's app builds a pain.001** and sends it to Bob's bank. (For a company, an ERP or payroll system builds it, often with hundreds of payments in one file.)
2. **Bob's bank validates it.** Does the account exist, are the funds there, is the format clean, does the payee detail look sane?
3. **Bob's bank replies with a pain.002** — accepted, rejected, or pending, with a reason code if something failed. This is the tick or error in Bob's app. Still no money has moved.
4. **For every accepted instruction, Bob's bank becomes the *debtor agent*** and turns the pain.001 into a **pacs.008**, the bank-to-bank message that actually moves the money.

{{embed:explorer:PAIN.001|Open pain.001 in the Message Explorer}}

## The three levels of a pain.001

A pain.001 nests the three-block skeleton you met in {{link:article:306-anatomy-of-a-message|anatomy of a message}}:

- **Group Header (`GrpHdr`)** — file-wide facts: message id, timestamp, transaction count, control sum. One per file.
- **Payment Information (`PmtInf`)** — one block per shared set: the debtor (Bob), his account, the execution date, the payment method. A file can carry many.
- **Credit Transfer Transaction (`CdtTrfTxInf`)** — one block per payee: Sweety, her account, the amount, the reference.

That nesting is exactly what makes payroll efficient: one Group Header, one Payment Information block (same debtor, same debit date), and four hundred transaction blocks, one per employee. Shared facts once, only the payee changes.

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

The cast is one you know from Level 100: Bob is the **Debtor**, Sweety the **Creditor**. Notice `EndToEndId` is `BOB-INV0042` — Bob's own reference. When his bank emits the pacs.008 next, it carries that *same* EndToEndId untouched, which is how "Invoice 0042" survives every hop and lands on Sweety's statement.

## The exact moment pain becomes pacs

{{think}}
Bob's bank is holding an accepted pain.001. At some precise instant it stops being Bob's messenger and becomes a bank with a job of its own — get money to another bank. When is that instant, and what marks it?
{{reveal}}
The instant it *accepts* the instruction and builds the **pacs.008** from it. Up to that point the bank was speaking *pain*, on Bob's side of the glass — taking his request, sending his receipt. The moment it emits a bank-to-bank message, it's speaking *pacs*, and Bob is no longer in the conversation.

That handoff is the border of this whole level: pain ends, pacs begins, and the EndToEndId is the one thing carried across it unchanged.
{{/think}}

{{aside:model|The mental model}}
**pain = you talking to your bank; pacs = banks talking to each other.** No money moves inside a pain message — it's a request (pain.001) and a receipt (pain.002). The money moves only once your bank turns it into a pacs.008.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Keep the two "status" messages straight: `pain.002` is your bank telling *you* (the customer) accepted/rejected/pending; `pacs.002` is one *bank* telling another the same, out on the interbank leg. Same idea, two sides of the glass. And the `EndToEndId` you set in the pain.001 is the thread that ties the eventual creditor statement back to this instruction — set it well, or reconciliation suffers downstream.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Expecting money to move in a pain message.** It never does — a pain.001 is a request. Systems that treat "pain.001 sent" as "paid" are reading the wrong beat of the loop.
- **Looking for pain between banks.** pain never travels bank-to-bank; if you see it there, something is mislabelled. Interbank is pacs.
- **Dropping the EndToEndId at handoff.** If the bank doesn't carry the customer's reference into the pacs.008, the creditor's statement can't be auto-reconciled — the classic broken thread.
{{/aside}}

{{aside:map|The map}}
The pain family is the edge of the payment, customer-side:

- The request in full detail → {{link:article:302-pain-001|pain.001, field by field}}.
- What the bank speaks after the handoff → {{link:article:302-pacs-family|the pacs family}}.
- The nested shape it's built on → {{link:article:306-anatomy-of-a-message|the three-block skeleton}}.
{{/aside}}

{{aside:ref|Reference card}}
- **pain = Payments Initiation** — customer ↔ their own bank. Never between banks.
- **pain.001** = the request ("please pay"). **pain.002** = the receipt (accepted/rejected/pending).
- **pain.007** = customer reversal. **pain.008** = direct debit (pull, not push).
- **No money moves in pain** — it becomes a pacs.008 at the handoff.
- **Three levels:** GrpHdr (file) → PmtInf (shared batch: debtor/account/date) → CdtTrfTxInf (one payee).
{{/aside}}

{{embed:explorer:PAIN.002|See the bank's reply, pain.002, in the Explorer}}

## So what can you do now?

You can explain what the pain family is for, name pain.001 and pain.002 and what each does, walk the three nested levels of a pain.001 from Group Header down to the transaction, say why payroll fits so neatly into that nesting, and pinpoint the exact moment your bank stops speaking "pain" and starts speaking "pacs."

{{check:Who talks to whom in the pain family?|A customer and their own bank|Two banks settling with each other|A central bank and a clearing house}}

{{check:Bob instructs his bank to pay Sweety. Which message carries that instruction?|pain.001 — the credit transfer initiation|pacs.008 — the interbank credit transfer|camt.053 — the end-of-day statement}}
