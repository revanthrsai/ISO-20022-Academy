---
title: "Treasury: When the Bank Moves Its Own Money"
level: 500
category: Case Studies
summary: "Every customer payment you've followed quietly drains money out of one of the bank's accounts and piles it up in another. At day's end someone has to put it all back. Watch the treasury desk move the bank's own funds to keep tomorrow's payments flowing."
minutes: 9
updated: 2026-07-13
tags: [case-study, treasury, liquidity, pacs.009, camt.052, nostro]
related: [501-customer-transfer, 101-nostro-vostro, 303-camt-family, 312-pacs-009-cover]
earnedSkill: "Explain why a bank moves its own money, name the message that does it (pacs.009, no customer attached) and the camt reports the treasurer reads, and tell a treasury payment from a customer one by asking: whose money is moving, and to pay whom?"
num: 504
status: published
---

> **The problem first.** All day, the payments you've been following landed in Sweety's bank — credits from dozens of banks, debits to dozens more. By 4 p.m. one of the bank's accounts at a correspondent is nearly empty and another is overflowing. None of it belongs to Bob or Sweety anymore; it's the bank's own money, sitting in the wrong places.

Every case study so far moved a *customer's* money to pay *someone else*. This is the one flow where neither is true — and you can reason your way to what it needs.

## What fails tomorrow, and what fixes it?

{{think}}
By close, customer payments have drained one of the bank's accounts and overfilled another. Nobody's sending a payment *to* the bank; no customer is asking for anything. If the treasurer does nothing overnight, something breaks tomorrow morning.

What breaks — and what kind of message could possibly fix it, given there's no customer anywhere in sight?
{{reveal}}
Tomorrow, a *perfectly good* customer payment fails — not because anything's wrong with it, but because the account it must settle *from* is empty. The bank had the money; it was just in the wrong account.

The fix is the bank moving its **own** money between its **own** accounts — an institution-to-institution transfer with no customer at either end. That's a **pacs.009** (FI credit transfer), and there's no pain.001 in front of it, because no customer instructed it. The bank's treasury system is both the originator and the reason.
{{/think}}

## Why the balances drift

A bank doesn't keep its money in one place. To reach other banks it holds accounts *with* them — its **nostro** accounts ("our money, over at your bank"), the mirror of the **vostro** accounts those banks hold with it. Every customer payment shifts one: a pacs.008 leaving *drains* the nostro it settled from; a pacs.008 arriving *fills* another. Do that ten thousand times a day and balances drift badly out of shape. The treasury desk's job is **liquidity management**: every account the bank must pay *from* tomorrow has enough tonight — no more (idle cash earns nothing), no less (an empty account means failed settlements).

To decide, the treasurer reads the same camt reports that told Sweety "your salary arrived," in a new light: **camt.052** (the intraday report — a running mid-day view, watched all afternoon to spot an account heading for empty) and **camt.053** (the end-of-day statement — the authoritative close every account starts tomorrow from). Same messages, different reader, different decision.

{{embed:explorer:CAMT.052|Open camt.052, the intraday report the treasurer reads}}

## The one question that names a treasury payment

{{think}}
You've now seen pacs.008 (customer's money), pacs.009 COV (funds behind a customer payment), and this plain pacs.009. With the whole Library behind you, what *single question* cleanly separates a treasury payment from every other flow in the book?
{{reveal}}
*Whose money is moving, and to pay whom?* For every other flow, at least one end is a customer. For treasury — uniquely — **both** answers are "the bank itself." The bank moves its own money to fund one of its own accounts. No customer at either end, no pain.001, no invoice to reconcile.

(You've met one flavour of pacs.009 before — the **COV** cover leg funding a cross-border customer payment. A *treasury* pacs.009 is the plain variant: the bank moving money purely for its own position, with no underlying customer payment behind it.)
{{/think}}

The flow, end to end: **camt.052** — the treasurer reads the position (a nostro running low against tomorrow's outflows); **the decision** — move funds from an overflowing account into the one running dry, before the cut-off; **pacs.009** — the treasury system issues an FI credit transfer (ordering institution, beneficiary institution, amount, value date), settling across the same system customer payments use; **pacs.002** — settled, funds now where they're needed; **camt.053** — both accounts close at the right numbers, and tomorrow's customer payments have somewhere to settle from. No pain, no beneficiary notification, no invoice — just the bank reading its own balances and moving its own money to stay liquid.

{{aside:model|The mental model}}
**Treasury is the bank moving its own money to pay itself** — a `pacs.009` with no `pain.001` in front, so all the *other* payments can keep settling tomorrow. The tell, unique in the whole Library: **no customer at either end.** *Whose money, to pay whom?* — the bank, itself.
{{/aside}}

{{aside:chair|From the engineer's chair}}
`pacs.009` comes in two flavours: **plain** (treasury — the bank's own position) and **COV** (funding a customer's cross-border pacs.008). Same message id, different job — tell them by whether an `UndrlygCstmrCdtTrf` block is present. The treasurer's decision inputs are `camt.052` (intraday) and `camt.053` (close); the move settles on the very same rails as customer traffic.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **Routing a treasury move as a pacs.008.** There's no customer — an FI transfer is a pacs.009. Get it wrong and the receiving bank applies it to the wrong kind of flow.
- **Ignoring intraday `camt.052` until an account runs dry.** Liquidity is managed *through* the day; waiting for the end-of-day `camt.053` is too late to fund a cut-off.
- **Confusing plain pacs.009 with pacs.009 COV.** One balances the bank's own book; the other funds a customer payment and must carry the underlying details.
{{/aside}}

{{aside:map|The map}}
The flow with no customer:

- The customer flow it keeps alive → {{link:article:501-customer-transfer|customer transfer}}.
- The accounts it balances → {{link:article:101-nostro-vostro|nostro & vostro}}.
- The other use of pacs.009 → {{link:article:312-pacs-009-cover|pacs.009 & cover}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Treasury** = the bank moving its **own** money between its **own** accounts (liquidity management).
- **Message:** `pacs.009` (FI credit transfer), **no `pain.001`** in front — no customer instructed it.
- **The treasurer's view:** `camt.052` (intraday) + `camt.053` (close).
- **The tell:** no customer at either end. *Whose money, to pay whom?* → the bank, itself.
- **pacs.009 plain vs COV:** own position vs funding a customer payment.
{{/aside}}

{{embed:playground|Inspect a pacs.009 treasury transfer in the Playground}}

## So what can you do now?

You can explain why a bank moves its own money — customer payments constantly drain one account and fill another, and liquidity management keeps every account it pays *from* funded before its cut-off. You can name the messages: camt.052 and camt.053 to *see* the positions, pacs.009 to *move* the funds, with no pain.001 in front. And you can tell a treasury payment from every other flow with one question — *whose money is moving, and to pay whom?* — because here, uniquely, the answer to both is "the bank itself."

{{check:How does a bank moving its own money differ from moving a customer's?|The banks themselves are the parties — it is an institution-to-institution transfer|It cannot be done electronically|It requires the customer's consent}}

{{check:What is a cover payment?|A separate interbank transfer that moves the real funds behind a customer payment routed another way|Insurance purchased against fraud|The fee a bank charges for a transfer}}
