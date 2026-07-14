---
title: "Return: Sending Settled Money Back"
level: 400
category: Exceptions
summary: "Once money has actually settled, you can't just say no. You have to physically send it back. A return is the structured U-turn for a payment that arrived but can't be applied."
minutes: 7
updated: 2026-07-13
tags: [return, pacs.004, RtrRsn, settlement, R-transactions]
related: [401-reject, 403-recall, 302-pacs-family, 408-reason-codes]
earnedSkill: "Explain why a return exists only after settlement, name the message that performs it (pacs.004), read its return reason, describe the U-turn the funds make back to the debtor, and tell a return from a reject and a recall."
num: 402
status: published
---

> **Delivered, and stuck.** Bob's ₹33,000 made it all the way to Sweety's bank. The money settled; it's sitting there. But Sweety closed that account last month. Her bank is now holding money it can't give to anyone. It's too late to reject the payment — the funds already moved.

Last chapter, a reject stopped a payment before any money moved. This is the opposite situation, and the difference is the one question that runs the level: **has it settled yet?** Here the answer is *yes* — which changes everything about the fix.

## You can't say "no" to money that already arrived

{{think}}
The funds settled at Sweety's bank. The account they were meant for is closed, so the bank can't apply them and can't keep them. A status report saying "rejected" is useless now — the money already moved.

So what does her bank actually have to do, and why won't a status message do?
{{reveal}}
It has to physically send the money **back** — a real settlement instruction running in reverse, carrying a **return reason** and references to the original payment so everyone can match the U-turn to the outbound leg. That message is the **pacs.004, Payment Return**.

A status report can only say yes or no; it can't move cash. Once money has settled, the only way to undo it is to settle it again, backwards. This is the first true R-transaction where real funds physically travel in reverse.
{{/think}}

## What triggers a return

A return happens when a payment **settled at the receiving bank but can't be applied**: the creditor account is closed or blocked, the account doesn't exist (a typo that passed validation but matches nobody), the beneficiary refuses or regulation forbids crediting, or it's a confirmed duplicate that already settled once. In each case the money is real, present, and unwanted — the bank can neither keep it nor apply it, so it sends it home.

## The message and the U-turn

There's one dedicated message: **pacs.004, Payment Return** — a full interbank message that carries the funds back toward the sender, with a return reason code (`RtrRsn`) and references to the original. It's a real settlement instruction, not a status report: it *moves money*, in the opposite direction to the pacs.008 that caused it. The flow: the funds settle at Sweety's bank via the pacs.008; her bank can't apply them; it originates a pacs.004 (debiting itself, crediting back along the chain) with a reason like `AC04` (account closed) or `NOOR` (no original / not our customer); the pacs.004 retraces the route through any intermediaries, each hop settling in reverse; Bob's bank re-credits Bob, whose statement now shows the outbound debit and the inbound return, both tied to `BOB-INV0042`.

```xml
<PmtRtr>
  <GrpHdr>
    <MsgId>HDFCINBB-RTN-0042</MsgId>
    <CreDtTm>2026-06-29T11:05:00+05:30</CreDtTm>
    <NbOfTxs>1</NbOfTxs>
  </GrpHdr>
  <TxInf>
    <RtrId>HDFCINBB-RTN-0042-01</RtrId>
    <OrgnlEndToEndId>BOB-INV0042</OrgnlEndToEndId>
    <OrgnlUETR>eb6305c9-1f7c-4a9b-9b1e-2c2f4e7a91d4</OrgnlUETR>
    <RtrdIntrBkSttlmAmt Ccy="INR">33000.00</RtrdIntrBkSttlmAmt>
    <RtrRsnInf>
      <Rsn><Cd>AC04</Cd></Rsn>
      <AddtlInf>Creditor account closed, funds returned</AddtlInf>
    </RtrRsnInf>
  </TxInf>
</PmtRtr>
```

The `RtrdIntrBkSttlmAmt` is the giveaway: a return carries a **returned amount**, because money is genuinely moving — a reject never does. The `OrgnlEndToEndId`/`OrgnlUETR` are the same references from the original pacs.008, which is what lets Bob's bank recognise this incoming payment as *his money coming home*, not a fresh credit.

## Return, or recall? Who starts it, and is it guaranteed?

{{think}}
Two exceptions both happen *after* settlement and both send money back: a **return** and a **recall**. They're easy to blur. But they differ on two axes — *who* starts it, and whether the money is *guaranteed* to come back. Work out both.
{{reveal}}
- **Return** — the *receiving* bank starts it, because *it* can't apply the funds. Nobody asked; the receiver decides, and the money genuinely moves back. Guaranteed, in the sense that the receiver is doing it, not requesting it.
- **Recall** — the *sending* bank starts it, because *it* made the mistake, and it *asks* the receiver to give the money back. That's a request (camt.056), not a guaranteed return — the receiver can say no.

Said simply: a return is the receiver *volunteering* the money back; a recall is the sender *begging* for it. That asymmetry is the next chapter.
{{/think}}

{{aside:model|The mental model}}
**A return is settled money making a U-turn, started by the receiver because it can't apply the payment.** It's a real settlement instruction (`pacs.004`) that *moves funds* backward — the `RtrdIntrBkSttlmAmt` is the proof money is travelling. A reject (before settlement) never carries an amount.
{{/aside}}

{{aside:chair|From the engineer's chair}}
`pacs.004` is a settlement instruction, not a status — treat it like an inbound payment, not a report. Match it to the original via `OrgnlEndToEndId`/`OrgnlUETR` so Bob's re-credit reconciles against his original debit. (Our Playground engine maps `pacs.004 → MT103 RETN`, the legacy return with `/RETN/` in field 72 — the same U-turn, MT-era.)
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Expecting a status report to fix a settled payment.** After settlement, `RJCT` is too late — only a `pacs.004` moves the cash back.
- **Confusing return with recall.** Return = receiver-initiated and it moves funds; recall = sender-requested and may be refused. Different owners, different guarantees.
- **Treating the inbound return as a new credit.** Without matching on the `Orgnl*` references, Bob's bank double-counts "his money coming home" as fresh income.
{{/aside}}

{{aside:map|The map}}
The receiver's after-settlement fix:

- Its before-settlement sibling → {{link:article:401-reject|reject}}.
- The sender's version (ask, not take) → {{link:article:403-recall|recall}}.
- The codes that say why → {{link:article:408-reason-codes|reason codes}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Return** = settled funds sent back because the receiving bank can't apply them.
- **Message:** `pacs.004` — a real settlement instruction moving money in reverse, with `RtrRsnInf`.
- **The tell:** `RtrdIntrBkSttlmAmt` (a returned amount). Rejects have none.
- **Started by the receiver**, no request needed; retraces the chain to re-credit the debtor.
- **Return vs recall:** receiver volunteers (return) vs sender asks (recall, camt.056).
{{/aside}}

{{embed:explorer:PACS.004|Open pacs.004, the payment return, in the Explorer}}

## So what can you do now?

You can explain why a return only exists after settlement, name the message that performs it (`pacs.004`) and the field that proves money is moving (the returned settlement amount), read a return reason code, describe the U-turn the funds make back to the debtor, and tell a return from a reject (no money) and a recall (the sender asks, the receiver decides).

{{check:What is a return?|Settled funds sent back because the payment could not be applied|A payment refused before settlement|A duplicate of the original instruction}}

{{check:The destination account is closed. What typically comes back?|A return carrying a reason code such as "account closed"|Nothing — the funds are kept by the bank|A brand-new payment with no reference to the original}}
