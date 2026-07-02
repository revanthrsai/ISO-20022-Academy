---
title: "Return: Sending Settled Money Back"
level: 400
category: Exceptions
summary: "Once money has actually settled, you can't just say no — you have to physically send it back. A return is the structured U-turn for a payment that arrived but can't be applied."
minutes: 7
updated: 2026-06-29
tags: [return, pacs.004, RtrRsn, settlement, R-transactions]
related: [402-return, 401-reject, 403-recall, 302-pacs-family]
earnedSkill: "Explain why a return exists only after settlement, name the message that performs it (pacs.004), read its return reason, describe the U-turn the funds make back to the debtor, and tell a return apart from a reject and a recall."
num: 402
status: published
---

> **The problem first.** Bob's ₹33,000 made it all the way to Sweety's bank. The money settled — it's sitting there. But Sweety closed that account last month. Her bank is now holding money it can't give to anyone. It's too late to reject the payment; the funds already moved. So how does a bank hand settled money *back* — cleanly, with a reason, and without anyone losing track of it?

A **reject** (the last chapter) stops a payment before any money moves. A **return** is the opposite situation: the money already **settled**, and now it has to make a U-turn. This is the first true *R-transaction* where real funds physically travel backwards.

The rule that separates the two is the one from the last chapter: **has it settled yet?** For a return, the answer is *yes* — which is exactly why a status report won't do. You can't fix a settled payment with a "no"; you have to send the cash back.

## What triggers a return

A return happens when a payment has **settled at the receiving bank but cannot be applied to the intended account.** Common causes:

- The creditor account is **closed** or **blocked**.
- The account **doesn't exist** (a typo that passed validation but matches nobody).
- The beneficiary **refuses** the funds, or regulation forbids crediting them.
- The payment is a confirmed **duplicate** that already settled once.

In each case the money is real, present, and unwanted. The receiving bank cannot keep it and cannot apply it, so it sends it back where it came from.

## Which message performs a return

There is one dedicated message for this:

- **pacs.004 — Payment Return.** A full interbank message that carries the funds back toward the original sender, along with a **return reason code** (`RtrRsn`) explaining why, and references to the original payment so everyone can match the U-turn to the outbound leg.

A pacs.004 is a real settlement instruction, not a status report — it *moves money*, just in the opposite direction to the pacs.008 that caused it.

{{embed:explorer:PACS.004|Open pacs.004, the payment return, in the Explorer}}

## The resolution flow

1. **The funds settle** at Sweety's bank via the original pacs.008.
2. **Her bank can't apply them** — the account is closed.
3. **It originates a pacs.004**, debiting itself and crediting back along the chain, with a return reason such as `AC04` (account closed) or `NOOR` (no original transaction / not our customer).
4. **The pacs.004 retraces the route** back through any intermediaries to Bob's bank — each hop settling in reverse.
5. **Bob's bank re-credits Bob.** The money lands back in his account, and his statement shows the outbound debit and the inbound return, both tied to `BOB-INV0042`.

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
      <AddtlInf>Creditor account closed — funds returned</AddtlInf>
    </RtrRsnInf>
  </TxInf>
</PmtRtr>
```

The `RtrdIntrBkSttlmAmt` is the giveaway: a return carries a **returned amount**, because money is genuinely moving. A reject never does. And the `OrgnlEndToEndId` / `OrgnlUETR` are the same references from the original pacs.008 — they're what let Bob's bank recognise this incoming payment as *his money coming home*, not a fresh credit.

## Return vs. reject vs. recall

Three failures, one timeline:

- **Reject** — *before* settlement. A `pacs.002`/`pain.002` status, no money moves.
- **Return** — *after* settlement, initiated by the **receiving** bank because it can't apply the funds. A `pacs.004` carries the money back. **Nobody asked** — the receiver decides.
- **Recall** — *after* settlement, initiated by the **sending** bank, who realises *it* made a mistake and *asks* the receiver to give the money back. That's a request (camt.056), not a guaranteed return — the next chapter.

Said simply: a return is the receiver volunteering the money back; a recall is the sender begging for it.

## So, what can you now do?

You can explain why a return only exists after settlement, name the message that performs it (`pacs.004`) and the field that proves money is moving (the returned settlement amount), read a return reason code, describe the U-turn the funds make back through the chain to the debtor, and tell a return apart from a reject (no money) and a recall (the sender asks, the receiver decides).

{{check:What is a return?|Settled funds sent back because the payment could not be applied|A payment refused before settlement|A duplicate of the original instruction}}

{{check:The destination account is closed. What typically comes back?|A return carrying a reason code such as “account closed”|Nothing — the funds are kept by the bank|A brand-new payment with no reference to the original}}
