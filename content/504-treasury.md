---
title: "Treasury: When the Bank Moves Its Own Money"
level: 500
category: Case Studies
summary: "Every customer payment you've followed quietly drains money out of one of the bank's accounts and piles it up in another. At day's end someone has to put it all back. Watch the treasury desk move the bank's own funds to keep tomorrow's payments flowing."
minutes: 9
updated: 2026-06-29
tags: [case-study, treasury, liquidity, pacs.009, camt.052, nostro]
related: [504-treasury, 501-customer-transfer, 101-nostro-vostro, 303-camt-family, 312-pacs-009-cover]
earnedSkill: "Explain why a bank moves its own money (funding nostro positions and managing intraday liquidity), name the message that does it (pacs.009, no customer attached) and the camt reports the treasurer reads to decide, and tell a treasury payment apart from a customer payment by asking the one question: whose money is moving, and to pay whom?"
num: 504
status: published
---

> **The problem first.** All day, the payments you've been following landed in Sweety's bank: credits arriving from dozens of other banks, debits leaving to dozens more. By 4 p.m. one of the bank's accounts at a correspondent is nearly empty and another is overflowing. None of it belongs to Bob or Sweety anymore; it's the bank's own money, sitting in the wrong places. If nobody moves it, tomorrow morning a perfectly good customer payment will fail, not because anything was wrong with it, but because the bank had no funds in the right account to settle it. So who notices, and what do they send to put the money back where it needs to be?

Every case study so far moved a *customer's* money to pay *someone else*. Treasury is the one flow where neither of those is true: the bank moves **its own money** to pay **itself**, shifting funds between its own accounts so that tomorrow's customer payments have somewhere to settle from. Same rails, same lifecycle, same families you know. What changes is the answer to one question: *whose money, and to pay whom?*

## Why the bank has to move anything at all

A bank doesn't keep all its money in one place. To reach other banks it holds accounts *with* them: its **nostro** accounts ("our money, over at your bank"), the mirror of the **vostro** accounts those banks hold with it. Every customer payment shifts the balance in one of these:

- A pacs.008 leaving the bank **drains** the nostro it settled from.
- A pacs.008 arriving **fills** a different account.

Do that ten thousand times a day and the balances drift badly out of shape. The treasury desk's job is **liquidity management**: making sure every account the bank needs to pay *from* tomorrow has enough in it tonight, no more (idle cash earns nothing) and no less (an empty account means failed settlements).

## How the treasurer knows

Before moving anything, the treasurer has to *see* the positions. That's the reporting side of payments, the camt family, read in a new light:

- **camt.052, the intraday report.** A running, mid-day view of an account: what's landed so far, what's left. The treasurer watches these all afternoon to spot an account heading for empty.
- **camt.053, the end-of-day statement.** The authoritative close on every account, the number tomorrow starts from.

The same notifications that told Sweety "your salary arrived" tell the treasurer "this nostro is down to its last million." Same messages, different reader, different decision.

{{embed:explorer:CAMT.052|Open camt.052, the intraday report the treasurer reads}}

## The message that moves it: pacs.009

When the treasurer decides to move money, they don't send a pacs.008; that's for *customer* payments, and there's no customer here. They send a **pacs.009**, the **financial-institution credit transfer**: the bank instructing a move of its *own* funds between financial institutions.

The difference is the whole point of this case study:

- **pacs.008** carries a debtor and a creditor, two customers. It moves *their* money.
- **pacs.009** carries an *ordering institution* and a *beneficiary institution*, two banks. It moves the *bank's* money.

There's no pain.001 in front of it, because no customer instructed it; the bank's own treasury system is both the originator and the reason. (You met one flavour of pacs.009 already: the **COV** cover leg in the cross-border case study. That was a pacs.009 funding a customer payment. A treasury pacs.009 is the plain variant: the bank moving money purely for its own position, with no underlying customer payment behind it.)

## The flow, end to end

1. **camt.052: the treasurer reads the position.** Mid-afternoon: the bank's nostro at a key correspondent is running low against tomorrow's expected outflows. *(Family: camt.)*
2. **The decision.** Move funds from an account that's overflowing into the one running dry, and fund the position before the cut-off. No customer is involved; this is the bank balancing itself.
3. **pacs.009: the bank moves its own money.** The treasury system issues a financial-institution credit transfer: ordering institution, beneficiary institution, amount, value date. It settles across the same system the customer payments use. *(Family: pacs.)*
4. **pacs.002: confirmation.** Settled. The funds are now in the account that needed them. *(Family: pacs.)*
5. **camt.053: the books close.** At end of day, both accounts close at the right numbers, and tomorrow's customer payments have somewhere to settle from. *(Family: camt.)*

No pain, no notification to a beneficiary, no invoice to reconcile. Just the bank, reading its own balances and moving its own money to stay liquid.

## What changed from a single transfer

The machinery is identical to the customer transfer: rails, settlement, the camt reports. Three things changed, and they all answer the same question:

- **Whose money?** The bank's own, not a customer's.
- **To pay whom?** Itself, one of its accounts funding another, not a third-party beneficiary.
- **Which message?** pacs.009 (institution-to-institution), with no pain.001 in front, because no customer asked for it.

That's the tell for every treasury payment you'll ever see: there's no customer at either end. It's the bank keeping its own plumbing full so that all the *other* payments (Bob's, the payroll run, the cross-border transfer) can keep flowing tomorrow.

{{embed:playground|Inspect a pacs.009 treasury transfer in the Playground}}

## So, what can you now do?

You can explain why a bank moves its own money: customer payments constantly drain one account and fill another, and liquidity management keeps every account the bank pays *from* funded before its cut-off. You can name the messages: camt.052 and camt.053 to *see* the positions, pacs.009 to *move* the funds, with no pain.001 in front because no customer instructed it. And you can tell a treasury payment apart from every other flow in the Library with one question, *whose money is moving, and to pay whom?*, because here, uniquely, the answer to both is "the bank itself."

{{check:How does a bank moving its own money differ from moving a customer’s?|The banks themselves are the parties — it is an institution-to-institution transfer|It cannot be done electronically|It requires the customer’s consent}}

{{check:What is a cover payment?|A separate interbank transfer that moves the real funds behind a customer payment routed another way|Insurance purchased against fraud|The fee a bank charges for a transfer}}
