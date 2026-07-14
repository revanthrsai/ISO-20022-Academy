---
title: "The camt Family: How Banks Tell You What Happened"
level: 300
category: Message Deep Dives
summary: "The money moved. But how do you actually find out? The camt family is the reporting side of payments: the statements, notifications, and balances that let everyone reconcile what happened."
minutes: 8
updated: 2026-07-13
tags: [camt, reporting, camt.053, camt.054, camt.052, reconciliation, cash-management]
related: [302-pacs-family, 305-message-lifecycle, 103-payment-lifecycle, 311-camt-053-reconciliation]
earnedSkill: "Explain what the camt family is for, tell a statement (camt.053) from an intraday report (camt.052) from a single-payment notification (camt.054), and place reporting in the life of a payment."
num: 303
status: published
---

> **Nobody knows yet.** Sweety's ₹33,000 has landed. Her bank applied the funds, it settled, everyone's happy. But Sweety doesn't work at the bank. She's at her desk in Bangalore, and as far as she can tell, *nothing has happened*. And her accountant needs more than "money arrived" — *which* invoice it paid, on *what* date, leaving *what* balance.

You've moved the money (pain, then pacs). This family is about everyone finding out it moved. And the shape of it falls out of Sweety's problem.

## Who tells Sweety, and does money move in it?

{{think}}
The payment settled inside the banks. Sweety, outside them, knows nothing until she's told. Her ERP needs to match the credit to Invoice 0042, on the right date, and confirm the new balance — automatically, at scale.

So who sends that, what kind of thing is it, and does any money move inside it?
{{reveal}}
Her bank sends *structured reports* her accounting system can read and match without a human — the **camt family** (Cash Management): statements, notifications, balances. And no, no money moves inside a camt message. It's *information about money that already moved.*

The one line: **pain and pacs make money move; camt tells you that it did.**
{{/think}}

## Closing the loop

A payment isn't finished when the funds settle — it's finished when both sides can *see* it settled and tie it back to what they were owed. That's the **reconciliation** step from Level 100, and camt is what makes it work at scale: not a human logging into a portal, but a structured report a company's accounting system reads and matches automatically. It replaces a tangle of legacy formats — MT940 statement, MT942 interim report, MT900/910 advices, plus a hundred proprietary files — with one shared shape for "here's what happened on your account."

## Who's in the family, and how they differ

{{think}}
Three messages do almost all the everyday work, and they differ mainly by *scope* and *timing*. Match each description to a job: "one specific entry, the moment it lands," "the whole account so far today, provisional," "the whole account at day's close, authoritative."
{{reveal}}
- **one entry, now** → **camt.054**, Bank-to-Customer Debit/Credit Notification — the single-event nudge that tells Sweety's system the moment her ₹33,000 arrived. (Replaces MT900/910.)
- **the whole account so far today** → **camt.052**, Bank-to-Customer Account Report — the intraday, provisional "here's where you stand right now." (Replaces MT942.)
- **the whole account at close** → **camt.053**, Bank-to-Customer Statement — the authoritative end-of-day record, the workhorse of reconciliation. (Replaces MT940.)
{{/think}}

Two more you'll meet later: **camt.060** *asks* the bank to send a report (a request, not a report), and **camt.056**, the cancellation request, belongs to the Level 400 exceptions world.

## Where reporting sits

camt messages don't start a payment; they trail it. Following Sweety's ₹33,000: the **pacs.008 settles** and the funds hit her account; her bank fires a **camt.054** almost immediately so her ERP can match Invoice 0042 without waiting; through the day a **camt.052** shows the provisional running position if treasury asks; at close a **camt.053** statement closes the books with opening and closing balances. The same references thread through all of it — the `EndToEndId` Bob set in the pain.001 rides into Sweety's bank and surfaces again *inside the camt entry*, which is exactly how her system knows this credit pays *that* invoice.

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

Read it as a sentence: a **credit** (`CdtDbtInd = CRDT`) of **33,000 INR** was **booked** (`Sts = BOOK`) on Sweety's account on 29 June, from **Bob**, for **Invoice 0042**. That single `EndToEndId` is the thread back to the instruction Bob typed in his kitchen — and the reason reconciliation works at all.

{{embed:explorer:CAMT.054|Open camt.054, the credit notification, in the Explorer}}

{{aside:model|The mental model}}
**pain and pacs make money move; camt tells you it did.** No money settles inside a camt message — it's information *about* money that already moved. Tell the three apart by scope: camt.054 = one entry now, camt.052 = the whole account so far today, camt.053 = the whole account at day's close.
{{/aside}}

{{aside:chair|From the engineer's chair}}
The `EndToEndId` that started life in Bob's pain.001 surfaces again inside the camt entry (`NtryDtls/TxDtls/Refs`) — that reappearance is what lets an ERP tie an incoming credit to a specific open invoice. Structurally the camt family replaces MT940 (→ camt.053), MT942 (→ camt.052), and MT900/910 (→ camt.054), but with references in named homes instead of a cramped free-text field.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Expecting money to move in a camt.** It never does — it reports movement that already happened.
- **Confusing the scope.** Acting on a provisional camt.052 as if it were the authoritative camt.053, or waiting for the nightly camt.053 when a real-time camt.054 already told you.
- **A missing `EndToEndId` in the entry.** Without the thread, the ERP can't auto-match the credit to its invoice, and the entry drops into a manual queue.
{{/aside}}

{{aside:map|The map}}
Reporting closes the loop the earlier families opened:

- What actually moved the money → {{link:article:302-pacs-family|the pacs family}}.
- The statement up close → {{link:article:311-camt-053-reconciliation|camt.053, line by line}}.
- The field that makes matching automatic → {{link:article:601-remittance-information|remittance information}}.
{{/aside}}

{{aside:ref|Reference card}}
- **camt = Cash Management** — reporting, not moving. No settlement inside.
- **camt.054** = one-entry notification (MT900/910). **camt.052** = intraday report (MT942). **camt.053** = end-of-day statement (MT940).
- **camt.060** requests a report; **camt.056** (cancellation) is a Level 400 exception.
- **Purpose:** make reconciliation automatic at scale.
- **The thread:** `EndToEndId` from the pain.001 surfaces in the camt entry to tie a credit to its invoice.
{{/aside}}

## So what can you do now?

You can explain what the camt family is for (reporting, not moving), tell camt.053 (end-of-day statement) from camt.052 (intraday) from camt.054 (single-entry notification), say which legacy MT messages each replaced, and place reporting at its proper spot in the life of a payment — the step that finally closes the loop.

{{check:What is the camt family for?|Cash management — statements, intraday reports, notifications, and cancellation requests|Initiating customer payments|Settling between central banks}}

{{embed:article:311-camt-053-reconciliation|Now use one: camt.053 reconciliation, line by line}}

{{check:Which one is the authoritative end-of-day record?|camt.053 — the statement|camt.052 — the intraday report|camt.054 — the single-entry notification}}
