---
title: "The pacs Family: How Banks Pay Each Other"
level: 300
category: Message Deep Dives
summary: "Once your bank accepts your instruction, it has to get real money to a bank it may have never met. The pacs family is the language banks use to move that money between each other — and to tell each other it worked."
minutes: 9
updated: 2026-06-29
tags: [pacs, clearing, settlement, pacs.008, pacs.002, pacs.004, interbank]
related: [302-pacs-family, 301-pain-family, 301-pacs-008, 105-payment-participants]
earnedSkill: "Explain what the pacs family is for, tell pacs.008 from pacs.009, describe the round trip from instruction to confirmation or return, and point to the single reference that proves a pacs.008 came from a particular pain.001."
num: 302
status: published
---

> **The problem first.** Bob's bank has his instruction and his money is good. But Sweety banks somewhere Bob's bank has never directly met — another country, another regulator, no shared account. Bob's bank can't just phone them up. It has to send something one or more *other* banks can read, act on, and forward — each one moving real money on its own books — until ₹33,000 finally lands in Sweety's account. What does that instruction look like, and how do the banks tell each other it worked?

That's the **pacs family** — **Payments Clearing and Settlement**. These are the messages banks send *to each other* to actually move money and report what happened. If pain is the order you place at the counter, pacs is everything that happens in the kitchen.

One line to hold onto: **a pain.001 is a request; a pacs.008 is an execution.** pacs messages settle real money between institutions.

## The purpose: the interbank engine room

A customer's instruction is useless until some bank acts on it with its own funds. The pacs family is how that happens — bank to bank, with no customer in the loop. It carries the debtor, the creditor, their banks (the *agents*), the amount that settles between institutions, and the references that let everyone track and reconcile the payment.

It is the ISO 20022 replacement for the old SWIFT interbank world (the MT1xx/MT2xx messages). Where the pain family standardised the customer's request, the pacs family standardises the banks' execution and confirmation.

## Who's in the family

- **pacs.008 — FI-to-FI Customer Credit Transfer.** The workhorse: moves a *customer's* payment between banks. The ISO 20022 replacement for MT103. By volume, one of the most important messages in global finance.
- **pacs.009 — FI Credit Transfer.** Banks moving their *own* money — treasury, liquidity, and the "COV" cover payment that funds a pacs.008 routed serially through correspondents.
- **pacs.002 — FI Payment Status Report.** "We accepted / rejected your payment." The bank-to-bank cousin of pain.002.
- **pacs.004 — Payment Return.** "We can't deliver this — here's the money back, with a reason." (You'll meet this properly in Level 400.)
- **pacs.003 — FI-to-FI Customer Direct Debit.** The *pull* equivalent of pacs.008 — collecting funds rather than pushing them.

Tell the two credit transfers apart and you've grasped the family: **pacs.008 moves a customer's money; pacs.009 moves a bank's own money.**

## The lifecycle: instruct, forward, confirm — or return

1. **Bob's bank (the *debtor agent*)** turns the accepted pain.001 into a **pacs.008** and sends it toward Sweety's bank.
2. **If the two banks have no direct relationship,** the pacs.008 hops through one or more **intermediary agents**, each settling with the next. Sometimes a separate **pacs.009 COV** travels alongside to fund that cover leg.
3. **Sweety's bank (the *creditor agent*)** receives it, applies the funds, and sends a **pacs.002** status report back up the chain: accepted, settled, or rejected — with a reason code.
4. **If the funds can't be applied** — say Sweety's account is closed — her bank sends a **pacs.004** return instead, and the money comes back to where it started, cleanly and traceably.

Every hop preserves who pays whom and carries the same end-to-end reference and `UETR`, so a payment a dozen banks touched can still be tracked as one journey.

{{embed:explorer:PACS.002|See the status report, pacs.002, in the Explorer}}

## A sample pacs.008

The workhorse has two parts — a **Group Header** (facts about this hop) and one or more **Credit Transfer Transaction** blocks (the payment itself):

```xml
<FIToFICstmrCdtTrf>
  <GrpHdr>
    <MsgId>EBILAEAD-20260629-000400</MsgId>
    <CreDtTm>2026-06-29T09:30:00+04:00</CreDtTm>
    <NbOfTxs>1</NbOfTxs>
    <SttlmInf><SttlmMtd>INDA</SttlmMtd></SttlmInf>
  </GrpHdr>
  <CdtTrfTxInf>
    <PmtId>
      <EndToEndId>BOB-INV0042</EndToEndId>
      <UETR>eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4</UETR>
    </PmtId>
    <IntrBkSttlmAmt Ccy="INR">33000.00</IntrBkSttlmAmt>
    <Dbtr><Nm>Bob Marsh</Nm></Dbtr>
    <DbtrAgt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></DbtrAgt>
    <CdtrAgt><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></CdtrAgt>
    <Cdtr><Nm>Sweety Rao</Nm></Cdtr>
    <RmtInf><Ustrd>Invoice 0042 — June freelance</Ustrd></RmtInf>
  </CdtTrfTxInf>
</FIToFICstmrCdtTrf>
```

Look at `EndToEndId`: it's the *same* `BOB-INV0042` Bob's app put in the pain.001. That single field is the thread tying the customer's instruction to this interbank execution — proof that this pacs.008 was born from that pain.001. The `UETR` is the globally unique id that powers "where is my payment?" tracking across every bank in the chain.

For the full field-by-field tour of this message — the three identifiers everyone confuses, and the fields that get real payments rejected — read the pacs.008 deep dive, then go edit a live one and watch it validate:

{{embed:playground|Edit a live pacs.008 in the Playground}}

## So, what can you now do?

You can explain what the pacs family is for, tell pacs.008 (move a customer's money) from pacs.009 (move a bank's own money), describe the round trip from instruction to a pacs.002 confirmation or a pacs.004 return, name the debtor agent, intermediary agent, and creditor agent at each hop, and point to the single reference that proves a pacs.008 came from a particular pain.001.

{{check:The pacs family lives on which leg of the journey?|Bank to bank — clearing and settlement|Customer to bank|Bank to customer reporting}}

{{check:A settled payment cannot be applied and the money must go back. Which pacs member does that?|pacs.004 — the payment return|pacs.002 — the status report|pacs.009 — the financial-institution transfer}}
