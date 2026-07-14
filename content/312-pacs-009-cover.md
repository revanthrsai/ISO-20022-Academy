---
title: "pacs.009: How Banks Move Their Own Money — and Cover Someone Else's"
level: 300
category: Message Deep Dives
num: 312
summary: "pacs.008 moves a customer's money. pacs.009 moves a bank's own — and in its COV form, it's the funds leg that quietly settles behind every serial cross-border payment. Field by field, including the block that once let dirty money hide, and the reform that closed the gap."
minutes: 9
updated: 2026-07-13
tags: [pacs.009, cover payment, COV, FI credit transfer, MT202COV, serial vs cover, correspondent]
related: [301-pacs-008, 302-pacs-family, 503-cross-border-payment, 504-treasury, 309-the-four-identifiers]
earnedSkill: "Tell pacs.009 from pacs.008, name its two uses (CORE and COV), explain serial vs cover routing, read a pacs.009 COV and find the UndrlygCstmrCdtTrf block, say why it exists (the MT202COV transparency reform), and follow the shared UETR that ties a cover leg to the customer payment it funds."
status: published
---

> **The problem first.** In the cross-border case study, Bob's $400 crossed from Dubai to Bangalore as *two* messages: a pacs.008 carrying the information, and a pacs.009 COV settling the funds between correspondents. You saw them run in parallel — but we never opened the second one.

You've done pacs.008 field by field. This is its sibling, and it looks almost identical. That similarity hides the single most useful distinction in interbank payments — one you can derive from a job pacs.008 simply can't do.

## A message for when the bank *is* the party

{{think}}
A pacs.008 moves a customer's money: its `Dbtr` and `Cdtr` are people — Bob, Sweety — and the banks are only their agents. Now a bank needs to move its *own* money: fund a nostro, shift liquidity, settle a position, reimburse another bank. No customer is involved at all.

pacs.008 has no shape for that. What has to change about the message?
{{reveal}}
The parties themselves. In this message the `Dbtr` and `Cdtr` are **financial institutions**, identified by BIC — the bank is the party, not the agent. That's **pacs.009**, the FI Credit Transfer (the MT202 successor).

And that gives you the one distinction that unlocks the whole family: **whose money is it?** Customer's → pacs.008. Bank's own → pacs.009. Amount has nothing to do with it.
{{/think}}

## Two jobs: CORE and COV

The same pacs.009 does two different things depending on whether it carries an *underlying* customer payment:

- **pacs.009 CORE — the bank's own transfer.** No customer behind it: a treasury movement, a liquidity shift, funding a nostro. This is the workhorse of the treasury case study — a bank moving its own money to keep tomorrow's payments flowing.
- **pacs.009 COV — the cover.** This one *does* have a customer payment behind it. It's the funds leg that settles behind a customer's cross-border pacs.008, and it carries a copy of that payment's details in a dedicated block so the two can be matched and screened. Same message, one extra block — and that block has a history.

## Serial vs cover: two ways to cross a border

Why does a cover message exist at all? Because there are two ways to route a cross-border payment through correspondents. **Serial:** the pacs.008 is passed hand to hand — each bank relays the information *and* settles with the next. Simple, but every intermediary sits in the path and the beneficiary bank only learns of the payment when the chain reaches it. **Cover:** the debtor agent sends the pacs.008 *straight to the creditor agent* (information arrives fast, directly) and *separately* instructs its correspondent to **cover** — reimburse the creditor agent — through a chain of **pacs.009 COV** messages (funds settle behind). Two parallel flows, reconciled by a shared **`UETR`** — the same one on both messages. Lose it and the creditor agent has a customer payment it's been told about and a pile of cover funds, with no way to prove they're the same payment.

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

The root is `FICdtTrf` — *financial institution* credit transfer — and `SttlmMtd` is **`COVE`**. The `UndrlygCstmrCdtTrf` block reproduces Bob and Sweety inside a message that is otherwise entirely bank-to-bank. That block is what makes it a COV and not a CORE.

## Why does a bank-to-bank message name two customers?

{{think}}
Look again at that message. At the top level it's pure bank-to-bank — the parties are BICs. Yet it's *required* to carry Bob's and Sweety's names inside, two people neither correspondent has any relationship with. Why force that? And what went wrong when it wasn't there?
{{reveal}}
In the old MT world a cover travelled as an **MT202** — a pure bank-to-bank transfer naming only the banks. The customer's own bank knew Bob and Sweety; the correspondents moving the actual cash *did not*, because the cover message didn't carry them. That was a real money-laundering blind spot — money moving through the correspondent system with the originator and beneficiary invisible to the banks handling it.

After FATF pressure, the industry introduced **MT202COV** in 2009: a cover message *required* to carry the underlying customer details, so every bank in the funds chain could screen the actual originator and beneficiary against sanctions and watchlists. `pacs.009 COV` inherits that obligation directly — the `UndrlygCstmrCdtTrf` block is the ISO 20022 form of "you may not move the money in the dark." Transparency enforced by the shape of the message.
{{/think}}

{{aside:model|The mental model}}
**Whose money is moving? Customer's → pacs.008. Bank's own → pacs.009.** A pacs.009 CORE is a bank's own transfer; a pacs.009 COV is the funds leg behind a customer's cross-border pacs.008, tied to it by a **shared UETR** and carrying the customer's details for screening.
{{/aside}}

{{aside:chair|From the engineer's chair}}
Spot a COV by two tells: `SttlmMtd` = `COVE` and the presence of `UndrlygCstmrCdtTrf`. The shared `UETR` is the only thing linking the cover leg to the customer leg — reconcile on it. (Our Playground engine handles pacs.008 ⇄ MT103 today; pacs.009/MT202 is a natural next mapping, and the underlying-block requirement is exactly the kind of rule a hand-written mapping has to respect.)
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Confusing pacs.008 and pacs.009.** Human debtor → 008; bank debtor → 009. Get it wrong and the payment lands in the wrong processing entirely.
- **A COV missing its `UndrlygCstmrCdtTrf`.** You've recreated the pre-2009 screening gap — funds moving with the parties hidden. The block is mandatory for a reason.
- **A mismatched or missing UETR.** The cover leg and customer leg are one payment only because they share a UETR; break it and the creditor agent can't reconcile funds to instruction.
- **"pacs.009 = pacs.008 for big amounts."** Amount is irrelevant. It's about *whose money*.
{{/aside}}

{{aside:map|The map}}
The sibling of the workhorse:

- The customer-money version → {{link:article:301-pacs-008|pacs.008}}.
- The family both belong to → {{link:article:302-pacs-family|the pacs family}}.
- Both legs in motion → {{link:article:503-cross-border-payment|the cross-border case study}}.
{{/aside}}

{{aside:ref|Reference card}}
- **pacs.009** = FI Credit Transfer (MT202 successor): the *bank* is the party, not the agent.
- **The distinction:** whose money — customer's (008) vs the bank's own (009). Not amount.
- **CORE** = bank's own transfer (treasury). **COV** = the cover/funds leg behind a customer pacs.008.
- **Cover method:** info goes direct (pacs.008), funds settle behind (pacs.009 COV), reconciled by shared `UETR`.
- **`UndrlygCstmrCdtTrf`** carries the real originator/beneficiary for screening — the MT202COV transparency reform.
{{/aside}}

{{embed:explorer:PACS.009|Open pacs.009, the FI credit transfer, in the Message Explorer}}
{{embed:article:503-cross-border-payment|See both legs in motion: the cross-border case study}}

{{check:What is the core difference between pacs.008 and pacs.009?|pacs.008 moves a customer's money (debtor is a person/company); pacs.009 moves a financial institution's own money (debtor is a bank)|pacs.009 is only for amounts over a threshold|They are the same message with different names}}
{{check:In the cover method, what carries the funds while the pacs.008 carries the information?|A pacs.009 COV, settling between correspondents and reconciled by the shared UETR|A second pacs.008|A camt.053 statement}}
{{check:Why must a pacs.009 COV carry the UndrlyingCustomerCreditTransfer block?|So every correspondent in the funds chain can screen the real originator and beneficiary — the transparency fix behind MT202COV|To make the message longer|Because banks have no BICs}}
