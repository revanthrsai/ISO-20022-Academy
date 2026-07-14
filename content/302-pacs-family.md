---
title: "The pacs Family: How Banks Pay Each Other"
level: 300
category: Message Deep Dives
summary: "Once your bank accepts your instruction, it has to get real money to a bank it may never have met. The pacs family is the language banks use to move that money, and to tell each other it worked."
minutes: 9
updated: 2026-07-13
tags: [pacs, clearing, settlement, pacs.008, pacs.002, pacs.004, interbank]
related: [301-pain-family, 301-pacs-008, 105-payment-participants, 312-pacs-009-cover, 310-status-reports]
earnedSkill: "Explain what the pacs family is for, tell pacs.008 from pacs.009, describe the round trip from instruction to confirmation or return, and point to the single reference that proves a pacs.008 came from a particular pain.001."
num: 302
status: published
---

> **The problem first.** Bob's bank has his instruction and his money is good. But Sweety banks somewhere Bob's bank has never directly met — another country, another regulator, no shared account. Bob's bank can't just phone them up.

Last article was the customer's side of the glass (pain). This is the other side: banks moving real money to each other. And the shape of it falls out of the fix Bob's bank is forced into.

## What must Bob's bank send, and to whom?

{{think}}
Bob's bank can't reach Sweety's bank directly. Between them sits a chain of *other* banks, each willing to move real money on its own books and forward the payment on — but only if they're told, precisely, what to do.

So what must Bob's bank send into that chain, and how is it different from Bob's original request?
{{reveal}}
A *bank-to-bank* instruction that any bank in the chain can read, act on with its own funds, and forward — carrying the debtor, the creditor, the agents, the amount that settles *between institutions*, and references that let everyone track and reconcile. That's the **pacs family** (Payments Clearing and Settlement).

It's different from Bob's request in the deepest way: a pain.001 is a *request*; a pacs.008 is an *execution*. If pain is the order you place at the counter, pacs is everything that happens in the kitchen — bank to bank, no customer in the loop.
{{/think}}

The pacs family is the ISO 20022 replacement for the old interbank MT world (MT1xx/MT2xx). Where pain standardised the customer's request, pacs standardises the banks' execution and confirmation.

## Who's in the family

- **pacs.008 — FI-to-FI Customer Credit Transfer.** The workhorse: moves a *customer's* payment between banks. The MT103 successor. One of the most important messages in global finance by volume.
- **pacs.009 — FI Credit Transfer.** Banks moving their *own* money: treasury, liquidity, and the "COV" cover payment that funds a serially-routed pacs.008.
- **pacs.002 — FI Payment Status Report.** "We accepted / rejected your payment." The bank-to-bank cousin of pain.002.
- **pacs.004 — Payment Return.** "We can't deliver this; here's the money back, with a reason." (Level 400 covers it in full.)
- **pacs.003 — FI-to-FI Customer Direct Debit.** The *pull* equivalent of pacs.008.

## The word that tells the two credit transfers apart

{{think}}
Two members are both "credit transfers": pacs.008 and pacs.009. They look similar on the wire. But they exist for genuinely different reasons. What single question separates them?
{{reveal}}
*Whose money is moving?* **pacs.008 moves a customer's money** — Bob paying Sweety, a customer credit transfer between their banks. **pacs.009 moves a bank's own money** — treasury, liquidity, or the cover payment that funds a pacs.008 routed through correspondents. Grasp that one distinction and you've grasped the family.
{{/think}}

## The lifecycle: instruct, forward, confirm (or return)

1. **Bob's bank (the *debtor agent*)** turns the accepted pain.001 into a **pacs.008** and sends it toward Sweety's bank.
2. **If the two banks have no direct relationship,** it hops through one or more **intermediary agents**, each settling with the next. Sometimes a separate **pacs.009 COV** travels alongside to fund the cover leg.
3. **Sweety's bank (the *creditor agent*)** receives it, applies the funds, and sends a **pacs.002** back up the chain: accepted, settled, or rejected with a reason.
4. **If the funds can't be applied** — say Sweety's account is closed — her bank sends a **pacs.004** return instead, and the money comes back cleanly and traceably.

Every hop preserves who pays whom and carries the same `EndToEndId` and `UETR`, so a payment a dozen banks touched still tracks as one journey.

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

Look at `EndToEndId`: it's the *same* `BOB-INV0042` Bob's app put in the pain.001. That one field is the thread proving this pacs.008 was born from that pain.001; the `UETR` is what powers "where is my payment?" across every bank.

{{embed:explorer:PACS.002|See the status report, pacs.002, in the Explorer}}

{{aside:model|The mental model}}
**pacs = banks talking to banks; a pacs.008 is an execution, not a request.** The one distinction that unlocks the family: **pacs.008 moves a customer's money; pacs.009 moves a bank's own money.** And the `EndToEndId` is the thread that ties the interbank execution back to the customer's original pain.001.
{{/aside}}

{{aside:chair|From the engineer's chair}}
The round trip has two answers, and they're different messages: a **pacs.002** says "accepted / settled / rejected"; a **pacs.004** says "couldn't apply it, money's coming back, here's the reason." Both point back at the original with `OrgnlEndToEndId`/`OrgnlUETR`. You can watch a pacs.008 turn into its MT103 ancestor (and back) in the Playground's live engine — the same payment, two eras.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Confusing pacs.008 with pacs.009.** Route a customer payment as an FI transfer (or vice versa) and the receiving bank applies it to the wrong kind of account/flow.
- **Expecting a customer in the loop.** There isn't one — pacs is strictly interbank. Customer-facing status is pain.002, not pacs.002.
- **Breaking the thread.** Drop or rewrite `EndToEndId`/`UETR` at a hop and a multi-bank payment can no longer be reconciled or tracked as one journey.
{{/aside}}

{{aside:map|The map}}
The interbank engine room and its neighbours:

- Where the payment came from → {{link:article:301-pain-family|the pain family}}.
- The workhorse in full → {{link:article:301-pacs-008|pacs.008, field by field}}.
- The cast at each hop → {{link:article:105-payment-participants|the participants}}.
- The cover payment → {{link:article:312-pacs-009-cover|pacs.009 & cover}}.
{{/aside}}

{{aside:ref|Reference card}}
- **pacs = Payments Clearing and Settlement** — bank-to-bank, no customer in the loop.
- **pacs.008** = customer's money (MT103 successor). **pacs.009** = bank's own money (incl. cover).
- **pacs.002** = status (accepted/rejected). **pacs.004** = return. **pacs.003** = direct debit (pull).
- **Round trip:** instruct → forward through agents → confirm (pacs.002) or return (pacs.004).
- **EndToEndId + UETR** ride every hop untouched — the thread from pain.001 to statement.
{{/aside}}

## So what can you do now?

You can explain what the pacs family is for, tell pacs.008 (a customer's money) from pacs.009 (a bank's own money), describe the round trip from instruction to a pacs.002 confirmation or a pacs.004 return, name the debtor/intermediary/creditor agents at each hop, and point to the single reference that proves a pacs.008 came from a particular pain.001.

{{check:The pacs family lives on which leg of the journey?|Bank to bank — clearing and settlement|Customer to bank|Bank to customer reporting}}

{{check:A settled payment cannot be applied and the money must go back. Which pacs member does that?|pacs.004 — the payment return|pacs.002 — the status report|pacs.009 — the financial-institution transfer}}
