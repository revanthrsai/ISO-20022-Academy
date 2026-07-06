---
title: "pacs.009: How Banks Move Their Own Money — and Cover Someone Else's"
level: 300
category: Message Deep Dives
num: 312
summary: "pacs.008 moves a customer's money. pacs.009 moves a bank's own — and in its COV form, it's the funds leg that quietly settles behind every serial cross-border payment. Field by field, including the block that once let dirty money hide, and the reform that closed the gap."
minutes: 9
updated: 2026-07-06
tags: [pacs.009, cover payment, COV, FI credit transfer, MT202COV, serial vs cover, correspondent]
related: [301-pacs-008, 302-pacs-family, 503-cross-border-payment, 504-treasury, 309-the-four-identifiers]
earnedSkill: "Tell pacs.009 from pacs.008 (bank's own money vs a customer's), name its two uses (CORE own-account and COV cover), explain the serial vs cover routing methods, read a pacs.009 COV and find the UndrlyingCustomerCreditTransfer block, say why that block exists (screening transparency after the MT202COV reform), and follow the shared UETR that ties a cover leg to the customer payment it funds."
status: published
---

> **The problem first.** In the {{link:article:503-cross-border-payment|cross-border case study}}, Bob's $400 crossed from Dubai to Bangalore as *two* messages: a pacs.008 carrying the information, and a pacs.009 COV settling the funds between correspondents. You saw them run in parallel. But we never opened the second one. What *is* a pacs.009, why does a payment sometimes need a whole separate message just to move the money, and why does that message have to name Bob and Sweety — two people neither correspondent has ever heard of?

The {{link:article:302-pacs-family|pacs family chapter}} introduced two workhorses. You've done pacs.008 field by field. This is its sibling: **pacs.009, the Financial Institution Credit Transfer**. It looks almost identical, and that similarity hides the single most useful distinction in interbank payments.

## The one distinction: whose money is it?

- **pacs.008** moves a **customer's** money. The `Dbtr` and `Cdtr` are people or companies — Bob, Sweety. The banks are only their *agents*.
- **pacs.009** moves a **bank's own** money. The `Dbtr` and `Cdtr` are **financial institutions themselves**, identified by BIC. No customer is party to it.

That's the whole idea. When a bank funds a nostro account, moves liquidity, settles a position, or reimburses another bank, it isn't acting for a customer — it's moving its own funds. pacs.008 has no shape for that, because its debtor is a customer. pacs.009 is the message where **the bank is the party**, not the agent. It is the ISO 20022 replacement for the old SWIFT **MT202** (and its cover variant, MT202COV).

## Two jobs: CORE and COV

The same pacs.009 does two quite different things depending on whether it carries an *underlying* customer payment:

- **pacs.009 CORE — the bank's own transfer.** No customer behind it. A treasury movement, a liquidity transfer, funding a nostro. This is the message doing the work in the {{link:article:504-treasury|treasury case study}}: the bank moving its own money to keep tomorrow's payments flowing.
- **pacs.009 COV — the cover.** This one *does* have a customer payment behind it. It is the funds leg that settles behind a customer's cross-border pacs.008, and it carries a copy of that customer payment's details in a dedicated block so the two can be matched and screened. Same message, one extra block — and that block has a history.

## Serial vs cover: two ways to cross a border

Why does a cover message exist at all? Because there are two ways to route a cross-border payment through correspondents, and they're a classic thing to get straight:

- **The serial method.** The pacs.008 is passed hand to hand down the chain. Each bank relays the information *and* settles with the next. One message type, flowing through every hop. Simple, but every intermediary sits in the path and the beneficiary bank only learns of the payment when the chain reaches it.
- **The cover method.** The debtor agent sends the pacs.008 **straight to the creditor agent** (the information arrives fast, directly), and *separately* instructs its correspondent to **cover** — reimburse the creditor agent — through a chain of **pacs.009 COV** messages (the funds settle behind). Two parallel flows, reconciled by a shared identifier.

The thread that stitches the cover leg back to the customer leg is the **`UETR`** — the same one on both messages. Lose it and the creditor agent has a customer payment it's been told about and a pile of cover funds, with no way to prove they're the same payment.

## Reading a pacs.009 COV, field by field

Here is the cover leg behind Bob's payment. Watch the parties: at the top level they are all **banks**; the humans live inside the underlying block.

```xml
<FICdtTrf>
  <GrpHdr>
    <MsgId>CORRUS33-COV-0042</MsgId>
    <CreDtTm>2026-07-01T09:31:00+04:00</CreDtTm>
    <NbOfTxs>1</NbOfTxs>
    <SttlmInf><SttlmMtd>COVE</SttlmMtd></SttlmInf>   <!-- settled via cover -->
  </GrpHdr>
  <CdtTrfTxInf>
    <PmtId>
      <EndToEndId>BOB-INV0042</EndToEndId>
      <UETR>eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4</UETR>   <!-- SAME UETR as the pacs.008 -->
    </PmtId>
    <IntrBkSttlmAmt Ccy="USD">400.00</IntrBkSttlmAmt>

    <!-- the parties HERE are financial institutions -->
    <Dbtr><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></Dbtr>       <!-- Bob's bank -->
    <CdtrAgt><FinInstnId><BICFI>CORRINBB</BICFI></FinInstnId></CdtrAgt>
    <Cdtr><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></Cdtr>       <!-- Sweety's bank -->

    <!-- the underlying CUSTOMER payment this cover funds -->
    <UndrlygCstmrCdtTrf>
      <Dbtr><Nm>Bob Marsh</Nm></Dbtr>
      <DbtrAgt><FinInstnId><BICFI>EBILAEAD</BICFI></FinInstnId></DbtrAgt>
      <CdtrAgt><FinInstnId><BICFI>HDFCINBB</BICFI></FinInstnId></CdtrAgt>
      <Cdtr><Nm>Sweety Rao</Nm></Cdtr>
    </UndrlygCstmrCdtTrf>
  </CdtTrfTxInf>
</FICdtTrf>
```

Two things to see. The root is `FICdtTrf` — *financial institution* credit transfer — and `SttlmMtd` is **`COVE`**, the settlement method that says "this is a cover." And the `UndrlygCstmrCdtTrf` block reproduces Bob and Sweety inside a message that is otherwise entirely bank-to-bank. That block is a CORE pacs.009 with the customer payment; a COV pacs.009 without it.

## Why the underlying block exists: the transparency reform

That extra block is not convenience. It is a **compliance fix with a history worth knowing**, because an interviewer will love it and a regulator lives by it.

In the old MT world, a cover payment travelled as an **MT202** — a pure bank-to-bank transfer that named only the banks. The customer's own bank knew who Bob and Sweety were, but the correspondents settling the funds **did not**, because the cover message didn't carry them. That was a real anti-money-laundering blind spot: money could move through the correspondent system with the originator and beneficiary invisible to the banks handling the cash. After FATF pressure, the industry introduced **MT202COV** in 2009 — a cover message *required* to carry the underlying customer details — precisely so every bank in the funds chain could screen the actual originator and beneficiary against sanctions and watchlists.

`pacs.009 COV` inherits that obligation directly. The `UndrlygCstmrCdtTrf` block is the ISO 20022 form of "you may not move the money in the dark." Every correspondent in the cover chain can now screen Bob and Sweety, not just the banks. Structured transparency, enforced by the message shape.

## What breaks

- **Confusing pacs.008 and pacs.009.** If a human is the debtor, it's a pacs.008. If a bank is the debtor, it's a pacs.009. Getting this wrong routes the payment into the wrong processing entirely.
- **A COV that should be CORE, or vice versa.** Send a cover without the `UndrlygCstmrCdtTrf` block and you've recreated the pre-2009 screening gap — funds moving with the parties hidden. The block is mandatory for a reason.
- **A mismatched or missing UETR.** The cover leg and the customer leg are one payment only because they share a UETR. Break that link and the creditor agent can't reconcile the funds to the instruction.
- **Treating pacs.009 as "pacs.008 for big amounts."** Amount has nothing to do with it. It's about *whose money*: customer (008) or institution (009).

## So, what can you now do?

You can tell **pacs.009** from **pacs.008** by the one question *whose money is moving?*; name its two uses — **CORE** (a bank's own transfer, the treasury workhorse) and **COV** (the cover leg behind a customer's cross-border payment); explain the **serial vs cover** routing methods and why the cover method splits information from funds; read a pacs.009 COV, spot `SttlmMtd COVE` and the `UndrlygCstmrCdtTrf` block, and follow the shared `UETR` that ties the cover to the customer payment; and explain why that underlying block exists at all — the **MT202COV** transparency reform that stopped cover payments hiding the people behind the money.

{{embed:explorer:PACS.009|Open pacs.009, the FI credit transfer, in the Message Explorer}}
{{embed:article:503-cross-border-payment|See both legs in motion: the cross-border case study}}

{{check:What is the core difference between pacs.008 and pacs.009?|pacs.008 moves a customer's money (debtor is a person/company); pacs.009 moves a financial institution's own money (debtor is a bank)|pacs.009 is only for amounts over a threshold|They are the same message with different names}}
{{check:In the cover method, what carries the funds while the pacs.008 carries the information?|A pacs.009 COV, settling between correspondents and reconciled by the shared UETR|A second pacs.008|A camt.053 statement}}
{{check:Why must a pacs.009 COV carry the UndrlyingCustomerCreditTransfer block?|So every correspondent in the funds chain can screen the real originator and beneficiary — the transparency fix behind MT202COV|To make the message longer|Because banks have no BICs}}
