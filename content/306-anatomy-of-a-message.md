---
title: "Anatomy of a Payment Message: The Three-Block Skeleton"
level: 300
category: Message Deep Dives
num: 306
summary: "Open any payment message and the same skeleton looks back: one header, a grouping layer, and the transactions themselves. Learn it once and every message becomes a variation you can already read."
minutes: 6
updated: 2026-07-13
tags: [grphdr, pmtinf, txinf, message structure, skeleton]
related: [302-pain-001, 301-pacs-008, 209-what-is-iso-20022]
earnedSkill: "Sketch the three-block skeleton from memory, say what belongs at each level and why, and predict where a field lives in a message you've never seen."
status: published
---

> **One skeleton, many bodies.** A payroll file with 400 salaries. A single rupee transfer between two friends. A bank moving a billion of its own money. Three payments that couldn't be more different — yet open all three messages side by side and the same three shapes appear, in the same order, every time.

Every other article in this shelf walks you through *a* message. This one hands you the master key to *all* of them. And the key isn't a fact to memorise — it's a design decision you can rederive yourself in about a minute.

## Design the payroll file yourself

{{think}}
You're designing the format for a payroll file. A company runs 400 salaries: same company, same account, same debit date — only the employee and the amount change from line to line.

The obvious first draft repeats the company name, account, and debit date on every one of the 400 lines. Before you ship it: what goes wrong, and what would you change?
{{reveal}}
Four hundred copies of the same three facts means four hundred chances for one copy to drift. And the day two of them disagree, which one is true? You've built a format that can *express a contradiction.*

The fix writes itself: state the shared facts **once**, above the part that repeats. The company, account, and date go in one block; only the employee and amount repeat below it. Nesting. And the rule behind it is the whole article: **information lives at the level where it is true.**
{{/think}}

Say that sentence twice — it's the entire message design. Everything below is just watching it work.

## The three levels

A payment message nests three blocks:

- **Group Header (`GrpHdr`), once per message.** Facts true of the *whole transmission*: a message id, a timestamp, how many transactions, sometimes a control sum. The outside of the parcel — nothing here is about any single payment.
- **The grouping layer, once per batch that shares facts.** In a pain.001 it's Payment Information (`PmtInf`): the debtor, the account to debit, the execution date. Stated once because it's true once, no matter how many payments hang below.
- **The transaction block (`TxInf` / `CdtTrfTxInf`), once per payment.** Only what's unique to *this* one: this creditor, this amount, this reference. Nothing here repeats a parent.

{{flow:Where a fact lives|Whole message? ~ GrpHdr: ids, timestamp, counts|-> shared by a batch?|Grouping block ~ debtor, account, execution date|-> unique to one payment?|Transaction block ~ creditor, amount, reference|-> result|No fact stated twice}}

## Why nesting beats flatness

The nesting doesn't just tidy things up — it *makes inconsistency impossible to express.* There's one debtor because the debtor is written in one place. The structure itself is a validation rule. It's also why the skeleton flexes between extremes without changing shape: Bob's single transfer is one GrpHdr, one grouping block, one transaction; payroll is one GrpHdr, one grouping block, four hundred transactions. Shared facts up, unique facts down.

And the practical payoff: meet a message you've never studied, and before reading a single element name you already know the three questions — what's true of the whole transmission, what does a batch share, what varies per item? You're never reading from zero. You're reading a dialect of a grammar you already speak.

## When the parcel misdescribes itself

{{think}}
A message header says `NbOfTxs` = 400. You open the message and count 399 transaction blocks. One is missing. What should the receiver do — process the 399 it got, or reject the whole thing? And why?
{{reveal}}
Reject the whole thing. A payment message is a *self-describing parcel* — it states its own contents. A parcel that misdescribes itself can't be trusted about anything else either: if the count is wrong, what else is? Processing 399 would mean silently guessing which payment vanished and hoping it didn't matter. So the standard's answer is blunt: the counts must match reality, or the message doesn't count. That strictness is a feature, not a nuisance.
{{/think}}

{{aside:model|The mental model}}
**Information lives at the level where it is true.** Ask one question of any field — *how many things is this fact true of?* — and you know exactly where it belongs: whole message → header; a batch → grouping block; one payment → transaction. In every message, forever.
{{/aside}}

{{aside:chair|From the engineer's chair}}
You'll see this exact skeleton wearing different clothes: `GrpHdr` → `PmtInf` → `CdtTrfTxInf` in a pain.001; the same header-then-transaction shape in a pacs.008 (interbank messages carry most shared facts in the header). It even runs on the reporting side — a `camt.053` nests entries inside an account inside a statement inside a header. Learn the skeleton once and half of every deep-dive is already familiar.
{{/aside}}

{{aside:breaks|Where it breaks}}
- **A fact at the wrong level.** Put the execution date on each transaction instead of the grouping block and 400 dates *can* now disagree — until one day two of them do. Wrong level re-enables the exact bug the nesting existed to forbid.
- **Counts that don't match.** `NbOfTxs` says 400, the file holds 399 — receivers reject the whole message, by design.
- **Repeating parent facts "for convenience."** Copy the debtor into every transaction and downstream systems must now decide which copy wins. Don't restate what a parent already said.
{{/aside}}

{{aside:map|The map}}
The skeleton underneath every message in the shelf:

- Dressed as a customer instruction → {{link:article:302-pain-001|pain.001, field by field}}.
- Dressed for interbank travel → {{link:article:301-pacs-008|pacs.008}}.
- Why it's built this way at all → {{link:article:209-what-is-iso-20022|what ISO 20022 is}}.
{{/aside}}

{{aside:ref|Reference card}}
- **Three blocks:** Group Header (whole message) → grouping layer (a shared batch) → transaction (one payment).
- **The rule:** information lives at the level where it is true — state a shared fact once.
- **The test:** *how many things is this fact true of?* → that's its level.
- **Nesting = a validation rule:** a fact written once can't contradict itself.
- **Counts must match** (`NbOfTxs`) or the whole message is rejected.
{{/aside}}

{{embed:article:302-pain-001|The skeleton dressed as a customer instruction: pain.001 field by field}}
{{embed:article:301-pacs-008|The skeleton dressed for interbank travel: pacs.008}}

{{check:What belongs in the Group Header?|Facts true of the whole message, like ids, timestamp, and transaction counts|The creditor of each payment|The remittance information}}
{{check:Why does the nesting structure prevent inconsistency?|A shared fact is written exactly once, so contradictory copies can't exist|Because validation software is very fast|It doesn't; it's purely cosmetic}}
{{check:NbOfTxs says 400 but the message holds 399 transactions. What happens and why?|The message is rejected, because a parcel that misdescribes itself can't be trusted|The receiver processes 399 and ignores the count|The missing transaction is invented from the control sum}}
