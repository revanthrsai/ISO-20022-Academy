---
title: "The camt Family: How Banks Tell You What Happened"
level: 300
category: Message Deep Dives
summary: "The money moved. But how do you actually find out? The camt family is the reporting side of payments: the statements, the notifications, and the balances that let everyone reconcile what happened."
minutes: 8
updated: 2026-06-29
tags: [camt, reporting, camt.053, camt.054, camt.052, reconciliation, cash-management]
related: [303-camt-family, 302-pacs-family, 305-message-lifecycle, 103-payment-lifecycle, 311-camt-053-reconciliation]
earnedSkill: "Explain what the camt family is for, tell a statement (camt.053) from an intraday report (camt.052) from a single-payment notification (camt.054), and say where reporting sits in the life of a payment."
num: 303
status: published
---

> **Nobody knows yet.** Sweety's ₹33,000 has landed. Her bank applied the funds, the payment settled, everyone's happy. But Sweety doesn't work at the bank. She's at her desk in Bangalore, and as far as she can tell, *nothing has happened* until her bank tells her something did. And her accountant needs more: not just "money arrived," but *which* invoice it paid, on *what* date, leaving *what* balance. Who sends that, and what does it look like?

That's the **camt family**, short for **Cash Management**. If pain is you instructing your bank and pacs is banks moving the money, camt is everyone being *told what happened* afterwards. It is the reporting layer of the payment world: statements, notifications, and balances.

One line to keep: **pain and pacs make money move; camt tells you that it did.** No money settles inside a camt message. It is information about money that already moved.

## The purpose: closing the loop

A payment isn't finished when the funds settle. It's finished when both sides can *see* it settled and tie it back to what they were owed, the step Level 100 called **reconciliation**. The camt family is what makes reconciliation possible at scale: instead of a human logging into a portal, a bank sends a structured report that a company's accounting system can read and match automatically.

It replaces a tangle of older formats: the legacy SWIFT **MT940** statement, **MT942** interim report, **MT900/910** debit and credit advices, plus a hundred proprietary bank file formats. The camt family gives every bank one shared shape for "here is what happened on your account."

## Who's in the family

Three messages do almost all the everyday work, and they differ mainly in *scope* and *timing*:

- **camt.053, Bank-to-Customer Statement.** The end-of-day statement. Every booked entry on the account for the period, plus opening and closing balances. The workhorse of reconciliation, and the replacement for MT940.
- **camt.052, Bank-to-Customer Account Report.** The *intraday* report: the same idea, but provisional and mid-day: "here's where you stand right now," before the day is closed. Replaces MT942.
- **camt.054, Bank-to-Customer Debit/Credit Notification.** A single-event nudge: "one specific entry just hit your account." This is the message that tells Sweety's accounting system *the moment* her ₹33,000 arrived, rather than waiting for the nightly statement. Replaces MT900/910.

Two more you'll meet later: **camt.060** asks the bank to *send* a report (a request, not a report itself), and **camt.056**, the payment cancellation request, belongs to the exceptions world you'll study in Level 400.

Tell the first three apart by scope: **camt.054 is one entry now, camt.052 is the whole account so far today, camt.053 is the whole account at day's close.**

{{embed:explorer:CAMT.054|Open camt.054, the credit notification, in the Explorer}}

## The lifecycle: where reporting sits

camt messages don't start a payment; they trail it. Following Sweety's ₹33,000:

1. **The pacs.008 settles** at Sweety's bank and the funds are applied to her account.
2. **Her bank fires a camt.054** credit notification almost immediately, a single-event "this just arrived" that her accounting system can match to Invoice 0042 without waiting.
3. **Through the day, a camt.052** intraday report shows the provisional running position if her treasury team asks for it.
4. **At end of day, a camt.053** statement closes the books, every entry with opening and closing balances, the authoritative record her accountant reconciles against.

The same references thread through all of it. The `EndToEndId` Bob set back in the pain.001, `BOB-INV0042`, rides the pacs.008 into Sweety's bank and surfaces again here, inside the camt entry, which is exactly how her system knows this credit pays *that* invoice.

## A sample camt.054

A credit notification, trimmed to the essentials. Notice it reports an entry rather than moving one:

```xml
<BkToCstmrDbtCdtNtfctn>
  <GrpHdr>
    <MsgId>HDFCINBB-NTFCN-20260629-0007</MsgId>
    <CreDtTm>2026-06-29T14:02:11+05:30</CreDtTm>
  </GrpHdr>
  <Ntfctn>
    <Id>NTFCN-0007</Id>
    <Acct><Id><IBAN>INHDFC0SWEETY00033445</IBAN></Id></Acct>
    <Ntry>
      <Amt Ccy="INR">33000.00</Amt>
      <CdtDbtInd>CRDT</CdtDbtInd>
      <Sts><Cd>BOOK</Cd></Sts>
      <BookgDt><Dt>2026-06-29</Dt></BookgDt>
      <NtryDtls><TxDtls>
        <Refs><EndToEndId>BOB-INV0042</EndToEndId></Refs>
        <RltdPties><Dbtr><Nm>Bob Marsh</Nm></Dbtr></RltdPties>
        <RmtInf><Ustrd>Invoice 0042 — June freelance</Ustrd></RmtInf>
      </TxDtls></NtryDtls>
    </Ntry>
  </Ntfctn>
</BkToCstmrDbtCdtNtfctn>
```

Read it as a sentence: a **credit** (`CdtDbtInd = CRDT`) of **33,000 INR** was **booked** (`Sts = BOOK`) on Sweety's account on 29 June, sent by **Bob**, for **Invoice 0042**. That single `EndToEndId` is the thread back to the instruction Bob typed in his kitchen, and the reason reconciliation works at all.

## So, what can you now do?

You can explain what the camt family is for (reporting, not moving), tell camt.053 (end-of-day statement) from camt.052 (intraday report) from camt.054 (single-entry notification), say which legacy MT messages each one replaced, and place reporting at its proper spot in the life of a payment: the step that finally closes the loop.

{{check:What is the camt family for?|Cash management — statements, intraday reports, notifications, and cancellation requests|Initiating customer payments|Settling between central banks}}

{{embed:article:311-camt-053-reconciliation|Now use one: camt.053 reconciliation, line by line}}

{{check:Which one is the authoritative end-of-day record?|camt.053 — the statement|camt.052 — the intraday report|camt.054 — the single-entry notification}}
