---
title: "Anatomy of a Payment Message: The Three-Block Skeleton"
level: 300
num: 306
summary: "Open any payment message and the same skeleton looks back at you: one header, a grouping layer, and the transactions themselves. Learn the skeleton once and every message in the standard becomes a variation you can already read."
minutes: 5
updated: 2026-07-04
tags: [grphdr, pmtinf, txinf, message structure, skeleton]
related: [302-pain-001, 301-pacs-008, 209-what-is-iso-20022]
earnedSkill: "Sketch the three-block skeleton from memory, say what belongs at each level and why, and predict where a field lives in a message you've never seen before."
status: published
---

> **One skeleton, many bodies.** A payroll file with 400 salaries. A single rupee transfer between two friends. A bank moving a billion of its own money. Three payments that could not be more different, and yet if you open all three messages side by side, the same three shapes appear in the same order, every time. Learn to see the skeleton and you will never again open an unfamiliar message and feel lost.

Every article in this shelf walks you through *a* message. This one hands you the master key to *all* of them, because the designers of ISO 20022 made a structural decision that repeats across the whole payments catalogue: **information lives at the level where it is true.**

Say that sentence twice; it is the entire article. Everything below is just watching it work.

## The three levels

A payment message is a nesting of three blocks:

- **The Group Header (`GrpHdr`), once per message.** Facts true of the *whole transmission*: a message id, a creation timestamp, how many transactions are inside, sometimes a control sum. This is the outside of the parcel: nothing in here is about any individual payment.
- **The grouping layer, once per batch of things that share facts.** In a pain.001 it's called Payment Information (`PmtInf`) and holds what a batch shares: the debtor, the account to debit, the execution date. Facts stated once because they are true once, no matter how many payments hang below.
- **The transaction block (`TxInf` / `CdtTrfTxInf`), once per payment.** Only what is unique to *this* payment: this creditor, this amount, this reference. Nothing here repeats what a parent level already said.

{{flow:Where a fact lives|Whole message? ~ GrpHdr: ids, timestamp, counts|-> shared by a batch?|Grouping block ~ debtor, account, execution date|-> unique to one payment?|Transaction block ~ creditor, amount, reference|-> result|No fact stated twice}}

## Why nesting beats flatness

Imagine the alternative: a flat file where each of payroll's 400 lines repeats the company's name, account, and debit date. Four hundred copies of identical facts means four hundred chances for one copy to differ, and then which one is true? The nesting *makes inconsistency impossible to express*. There is one debtor because the debtor is written in one place. The structure itself is a validation rule.

This is also why the skeleton flexes so gracefully between extremes. Bob's single transfer? One GrpHdr, one grouping block, one transaction. Payroll? One GrpHdr, one grouping block, four hundred transactions. The bank-to-bank pacs.008 drops the middle layer's customer-facing role (interbank messages usually carry their shared facts in the header) but the principle is identical: shared facts up, unique facts down.

## Reading an unfamiliar message

Here is the practical payoff. Suppose tomorrow you meet a message you've never studied. Before reading a single element name, you already know the questions to ask: Where is the header, and what does this message consider "whole-transmission" facts? What does the grouping layer share? What varies per item? Every message in the payments business area answers those three questions in the same shape, so you're never reading from zero. You are reading a dialect of a grammar you already speak.

That grammar even extends to the reporting side: a camt.053 statement nests entries inside an account inside a statement inside a header, the same principle pointed at reporting instead of instructing.

## What breaks

- **A fact at the wrong level.** An implementer puts the execution date on each transaction instead of the grouping block. Now 400 dates *can* disagree, and one day two of them do. The skeleton existed precisely to make that bug impossible; putting data at the wrong level re-enables it.
- **Counts that don't match reality.** `NbOfTxs` in the header says 400; the file contains 399 transaction blocks. Receivers reject the whole message, by design, because a self-describing parcel that misdescribes itself cannot be trusted.
- **Repeating parent facts downstream.** Copying the debtor into every transaction "for convenience" invites the exact inconsistency the nesting forbids, and downstream systems must now decide which copy wins.

The phrase to keep: **information lives at the level where it is true.** Ask "how many things is this fact true of?" and you know where it belongs, in every message, forever.

{{embed:article:302-pain-001|The skeleton dressed as a customer instruction: pain.001 field by field}}
{{embed:article:301-pacs-008|The skeleton dressed for interbank travel: pacs.008}}

{{check:What belongs in the Group Header?|Facts true of the whole message, like ids, timestamp, and transaction counts|The creditor of each payment|The remittance information}}
{{check:Why does the nesting structure prevent inconsistency?|A shared fact is written exactly once, so contradictory copies cannot exist|Because validation software is very fast|It doesn't; it's purely cosmetic}}
{{check:NbOfTxs says 400 but the message holds 399 transactions. What happens and why?|The message is rejected, because a parcel that misdescribes itself can't be trusted|The receiver processes 399 and ignores the count|The missing transaction is invented from the control sum}}
